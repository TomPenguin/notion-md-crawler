import { Client, collectPaginatedAPI } from "@notionhq/client";
import { indent as _indent } from "md-utils-ts";
import {
  BlockSerializers,
  PropertySerializers,
  Serializers,
  serializer,
} from "./serializer/index.js";
import { DELIMITER } from "./serializer/property/defaults.js";
import { propertiesSerializer } from "./serializer/property/index.js";
import {
  NotionBlock,
  NotionBlockObjectResponse,
  NotionPage,
  Page,
  Pages,
} from "./types.js";

const fetchNotionBlocks = (client: Client) => async (blockId: string) =>
  collectPaginatedAPI(client.blocks.children.list, {
    block_id: blockId,
  }).catch((err) => {
    console.error(`Fetching Notion block failed. [blockId: ${blockId}]`);
    console.error(err);

    return [];
  });

const fetchNotionPage = (client: Client) => (pageId: string) =>
  client.pages.retrieve({ page_id: pageId });

const fetchNotionDatabase = (client: Client) => (databaseId: string) =>
  client.databases
    .query({ database_id: databaseId })
    .then(({ results }) => results)
    .catch(() => []);

const has = <T extends Object, K extends string>(
  obj: T,
  key: K,
): obj is Extract<T, { [k in K]: any }> => key in obj;

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

const walking =
  (client: Client) =>
  (serializers: Serializers) =>
  async (
    parent: Page,
    blocks: NotionBlockObjectResponse[],
    pages: Pages = {},
    depth = 0,
  ): Promise<Pages> => {
    const walk = walking(client)(serializers);
    pages[parent.metadata.id] = pages[parent.metadata.id] || parent;

    for (const block of blocks) {
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
        const _pages = await walk(parent, blocks, pages, depth);

        pages = { ...pages, ..._pages };

        continue;
      }

      if (blockIs(block, "child_page")) {
        const { title } = block.child_page;
        const _parent = initPage(block, title, parent.metadata.id);
        const _blocks = await fetchNotionBlocks(client)(block.id);
        const _pages = await walk(_parent, _blocks, pages, 0);

        pages = { ...pages, ..._pages };

        continue;
      }

      if (blockIs(block, "child_database")) {
        const { title } = block.child_database;
        pages[block.id] = initPage(block, title, parent.metadata.id);
        const crawlDB = dbCrawler({ client, serializers });
        const _pages = await crawlDB(block.id);

        pages = { ...pages, ..._pages };

        continue;
      }

      if (block.has_children) {
        const _blocks = await fetchNotionBlocks(client)(block.id);
        const { type } = block;
        const _depth = IGNORE_NEST_LIST.includes(type) ? depth : depth + 1;
        const _pages = await walk(parent, _blocks, pages, _depth);

        pages = { ...pages, ..._pages };

        continue;
      }
    }

    return pages;
  };

const extractPageTitle = (page: NotionPage) => {
  if (!has(page, "properties")) return "";

  let title = "";

  for (const [name, prop] of Object.entries(page.properties)) {
    if (prop.type !== "title") continue;

    const text = serializer.property.defaults.title(name, prop) as string;
    title = text.split(DELIMITER)[1];
  }

  return title;
};

const mergeSerializers = (serializers?: OptionalSerializers): Serializers => ({
  block: { ...serializer.block.strategy, ...serializers?.block },
  property: { ...serializer.property.strategy, ...serializers?.property },
});

type OptionalSerializers = {
  block?: Partial<BlockSerializers>;
  property?: Partial<PropertySerializers>;
};
export type CrawlerOptions = {
  client: Client;
  serializers?: OptionalSerializers;
  parentId?: string;
};
export type Crawler = (
  options: CrawlerOptions,
) => (rootPageId: string) => Promise<Pages>;
export const crawler: Crawler =
  ({ client, serializers, parentId }) =>
  async (rootPageId: string) => {
    const notionPage = await fetchNotionPage(client)(rootPageId);
    if (!has(notionPage, "parent")) {
      console.error("Unintended Notion Page object.");
      return {};
    }

    const _serializers = mergeSerializers(serializers);

    const title = extractPageTitle(notionPage);
    const serializeProps = propertiesSerializer(_serializers.property);
    const props = await serializeProps(notionPage.properties);
    const blocks = await fetchNotionBlocks(client)(notionPage.id);
    const rootPage: Page = initPage(notionPage, title, parentId, props);

    const walk = walking(client)(_serializers);
    return walk(rootPage, blocks);
  };

export type DatabaseCrawler = (
  options: CrawlerOptions,
) => (databaseId: string) => Promise<Pages>;
export const dbCrawler: DatabaseCrawler = (options) => async (databaseId) => {
  const crawl = crawler({ ...options, parentId: databaseId });
  const records = await fetchNotionDatabase(options.client)(databaseId);

  let context: Pages = {};

  for (const record of records) {
    const pages = await crawl(record.id);
    context = { ...context, ...pages };
  }

  return context;
};
