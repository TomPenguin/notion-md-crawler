import { Client, collectPaginatedAPI } from "@notionhq/client";
import { indent as _indent } from "md-utils-ts";
import { BlockSerializers, serializer } from "./serializer/index.js";
import {
  NotionBlock,
  NotionBlockObjectResponse,
  NotionPage,
  NotionProperty,
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
const initPage = (page: PageLike, title: string, parentId?: string): Page => ({
  metadata: {
    id: page.id,
    title,
    createdTime: page.created_time,
    lastEditedTime: page.last_edited_time,
    parentId,
  },
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
  (serializers: BlockSerializers) =>
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

      // Serialize Block
      const serializer = serializers[block.type];
      const text = serializer(block as any);

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

  return Object.values(page.properties)
    .filter(
      <T extends NotionProperty>(
        prop: T,
      ): prop is Extract<T, { type: "title" }> => prop.type === "title",
    )
    .map((prop) => serializer.property.defaults.title(prop, ""))
    .join("");
};

export type CrawlerOptions = {
  client: Client;
  serializers?: Partial<BlockSerializers>;
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

    const title = extractPageTitle(notionPage);
    const blocks = await fetchNotionBlocks(client)(notionPage.id);
    const rootPage: Page = initPage(notionPage, title, parentId);

    const walk = walking(client)({
      ...serializer.block.strategy,
      ...serializers,
    });
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
