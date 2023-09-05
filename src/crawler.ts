import { Client, collectPaginatedAPI } from "@notionhq/client";
import { indent as _indent } from "md-utils-ts";
import { has } from "./libs.js";
import { Serializers, serializer } from "./serializer/index.js";
import { propertiesSerializer } from "./serializer/property/index.js";
import {
  Crawler,
  CrawlingResult,
  DBCrawler,
  NotionBlock,
  NotionBlockObjectResponse,
  NotionPage,
  OptionalSerializers,
  Page,
} from "./types.js";

const fetchNotionBlocks = (client: Client) => async (blockId: string) =>
  collectPaginatedAPI(client.blocks.children.list, {
    block_id: blockId,
  }).catch(() => []);

const fetchNotionPage = (client: Client) => (pageId: string) =>
  client.pages.retrieve({ page_id: pageId });

const fetchNotionDatabase = (client: Client) => (databaseId: string) =>
  client.databases
    .query({ database_id: databaseId })
    .then(({ results }) => results)
    .catch(() => []);

const blockIs = <T extends NotionBlock["type"]>(
  block: NotionBlock,
  type: T,
): block is Extract<NotionBlock, { type: T }> => block.type === type;

type PageLike = {
  id: string;
  created_time: string;
  last_edited_time: string;
};
const initPage = (
  page: PageLike,
  title: string,
  parentId?: string,
  properties?: string[],
): Page => ({
  metadata: {
    id: page.id,
    title,
    createdTime: page.created_time,
    lastEditedTime: page.last_edited_time,
    parentId,
  },
  properties: properties || [],
  lines: [],
});

/**
 * List of block types that do not need to be nested.
 * Avoid nesting when serializing due to the Notion Block structure.
 */
const IGNORE_NEST_LIST = ["table", "table_row", "column_list", "column"];

const indent = _indent();

const walking = (client: Client) => (serializers: Serializers) =>
  async function* (
    parent: Page,
    blocks: NotionBlockObjectResponse[],
    depth = 0,
  ): AsyncGenerator<CrawlingResult> {
    const walk = walking(client)(serializers);

    for (const block of blocks) {
      try {
        if (!has(block, "type")) continue;

        const serializeBlock = serializers.block[block.type];
        const text = await serializeBlock(block as any);

        if (text !== false) {
          const line = indent(text, depth);
          parent.lines.push(line);
        }

        if (blockIs(block, "synced_block")) {
          // Specify the sync destination block id
          const blockId = block.synced_block.synced_from?.block_id || block.id;
          const blocks = await fetchNotionBlocks(client)(blockId);

          yield* walk(parent, blocks, depth);

          continue;
        }

        if (blockIs(block, "child_page")) {
          const { title } = block.child_page;
          const _parent = initPage(block, title, parent.metadata.id);
          const _blocks = await fetchNotionBlocks(client)(block.id);

          yield* walk(_parent, _blocks, 0);
          yield { id: _parent.metadata.id, success: true, page: _parent };

          continue;
        }

        if (blockIs(block, "child_database")) {
          const { title } = block.child_database;
          const dbPage = initPage(block, title, parent.metadata.id);

          yield* dbCrawler({ client, serializers })(block.id);
          yield { id: block.id, success: true, page: dbPage };

          continue;
        }

        if (block.has_children) {
          const _blocks = await fetchNotionBlocks(client)(block.id);
          const { type } = block;
          const _depth = IGNORE_NEST_LIST.includes(type) ? depth : depth + 1;

          yield* walk(parent, _blocks, _depth);
        }
      } catch (err) {
        const reason =
          err instanceof Error
            ? `${err.name}: ${err.message}\n${err.stack}`
            : `${err}`;

        const parentId = parent.metadata.id;
        yield { id: block.id, success: false, failure: { parentId, reason } };
      }
    }
  };

const extractPageTitle = (page: NotionPage) => {
  if (!has(page, "properties")) return "";

  let title = "";

  for (const prop of Object.values(page.properties)) {
    if (prop.type !== "title") continue;

    const text = serializer.property.defaults.title("", prop) as string;
    title = text.replace("[] ", "");
  }

  return title;
};

const mergeSerializers = (serializers?: OptionalSerializers): Serializers => ({
  block: { ...serializer.block.strategy, ...serializers?.block },
  property: { ...serializer.property.strategy, ...serializers?.property },
});

/**
 * `crawler` is a higher-order function that returns a function designed to crawl through Notion pages.
 * It utilizes given client, optional serializers, and an optional parentId to customize its operation.
 *
 * @param {CrawlerOptions} options - The crawler options which contains:
 *  - client: An instance of the Notion client.
 *  - serializers?: An optional object that can be used to define custom serializers for blocks and properties.
 *  - parentId?: An optional parent ID which, if provided, associates the resulting pages with the given parent.
 *
 * @returns {Function} A generator function that takes a `rootPageId` (the ID of the starting Notion page) and yields a Promise that resolves to the crawled pages or an error object.
 *
 * @example
 * // Initialize the crawler with options.
 * const crawl = crawler({ client: myClient });
 *
 * // Use the initialized crawler
 * for await (const result of crawl("someRootPageId")) {
 *   if (result.success) {
 *     console.log("Crawled page:", result.page);
 *   } else {
 *     console.error("Crawling failed:", result.failure);
 *   }
 * }
 */
export const crawler: Crawler = ({ client, serializers, parentId }) =>
  async function* (rootPageId) {
    const notionPage = await fetchNotionPage(client)(rootPageId);
    if (!has(notionPage, "parent")) {
      const reason = "Unintended Notion Page object.";

      return yield {
        id: rootPageId,
        success: false,
        failure: { parentId, reason },
      };
    }

    const _serializers = mergeSerializers(serializers);
    const title = extractPageTitle(notionPage);
    const serializeProps = propertiesSerializer(_serializers.property);
    const props = await serializeProps(notionPage.properties);
    const blocks = await fetchNotionBlocks(client)(notionPage.id);
    const rootPage = initPage(notionPage, title, parentId, props);

    yield* walking(client)(_serializers)(rootPage, blocks);
    yield { id: rootPageId, success: true, page: rootPage };
  };

/**
 * `dbCrawler` is specifically designed to crawl Notion databases. This function retrieves all records in a database and then
 * utilizes the `crawler` function for each individual record.
 *
 * Note: When working with a root page that is a database, use `dbCrawler` instead of the regular `crawler`.
 *
 * @param {CrawlerOptions} options - The options necessary for the crawl operation, which includes:
 *   - client: The Notion client used for making requests.
 *   - serializers: Optional serializers for block and property.
 *   - parentId: Optional parent ID.
 *
 * @returns {Function} A function that takes a `databaseId` and returns a promise that resolves to a `Pages` object, which is a collection of
 * all the pages found within the specified Notion database.
 */
export const dbCrawler: DBCrawler = (options) =>
  async function* (rootDatabaseId) {
    const crawl = crawler({ ...options, parentId: rootDatabaseId });
    const records = await fetchNotionDatabase(options.client)(rootDatabaseId);

    for (const record of records) {
      yield* crawl(record.id);
    }
  };
