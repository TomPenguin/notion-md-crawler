import { Client, collectPaginatedAPI } from "@notionhq/client";
import { indent } from "md-utils-ts";
import { strategy } from "./serializer/index.js";
import { Serializers } from "./serializer/types.js";
import {
  NotionBlock,
  NotionBlockObjectResponse,
  NotionClient,
} from "./types.js";

export type Page = {
  metadata: {
    id: string;
    title: string;
    createdTime: string;
    lastEditedTime: string;
    parentId?: string;
  };
  lines: string[];
};

export type Pages = Record<string, Page>;

type NotionPageRetrieveMethod = NotionClient["pages"]["retrieve"];
type NotionPartialPageObjectResponse = Awaited<
  ReturnType<NotionPageRetrieveMethod>
>;

const fetchBlocks = (client: Client) => async (blockId: string) =>
  collectPaginatedAPI(client.blocks.children.list, {
    block_id: blockId,
  }).catch((err) => {
    console.error(`Fetching Notion block failed. [blockId: ${blockId}]`);
    console.error(err);

    return [];
  });

const fetchPage = (client: Client) => (pageId: string) =>
  client.pages.retrieve({ page_id: pageId }).catch((err) => {
    console.error(`Fetching Notion page failed. [pageId: ${pageId}]`);
    console.error(err);

    return [];
  });

const fetchNotionDatabase = (client: Client) => (databaseId: string) =>
  client.databases
    .query({ database_id: databaseId })
    .then(({ results }) => results)
    .catch(() => []);

const hasType = (block: NotionBlockObjectResponse): block is NotionBlock =>
  "type" in block;

const blockIs = <T extends NotionBlock["type"]>(
  block: NotionBlock,
  type: T,
): block is Extract<NotionBlock, { type: T }> => block.type === type;

const IGNORE_NEST_LIST = ["table", "table_row", "column_list", "column"];

const walk =
  (client: Client) =>
  (serializers: Serializers) =>
  async (
    parent: Page,
    blocks: NotionBlockObjectResponse[],
    context: Pages = {},
    depth = 0,
  ): Promise<Pages> => {
    context[parent.metadata.id] = context[parent.metadata.id] || parent;

    for (const block of blocks) {
      if (!hasType(block)) continue;

      const serializer = serializers[block.type];
      const text = serializer(block as any);

      if (text !== false) {
        const line = indent()(text, depth);
        parent.lines.push(line);
      }

      if (blockIs(block, "synced_block")) {
        // Specify the sync destination block id
        const blockId = block.synced_block.synced_from?.block_id || block.id;
        const blocks = await fetchBlocks(client)(blockId);
        const pages = await walk(client)(serializers)(
          parent,
          blocks,
          context,
          depth,
        );

        context = { ...context, ...pages };

        continue;
      }

      if (blockIs(block, "child_page")) {
        const nextParent: Page = {
          metadata: {
            id: block.id,
            title: block.child_page.title,
            createdTime: block.created_time,
            lastEditedTime: block.last_edited_time,
            parentId: parent.metadata.id,
          },
          lines: [],
        };
        const blocks = await fetchBlocks(client)(block.id);
        const pages = await walk(client)(serializers)(
          nextParent,
          blocks,
          context,
          0,
        );

        context = { ...context, ...pages };

        continue;
      }

      if (blockIs(block, "child_database")) {
        context[block.id] = {
          metadata: {
            id: block.id,
            title: block.child_database.title,
            createdTime: block.created_time,
            lastEditedTime: block.last_edited_time,
            parentId: parent.metadata.id,
          },
          lines: [],
        };

        const crawlDatabase = databaseCrawler({
          client,
          serializers: serializers,
        });
        const pages = await crawlDatabase(block.id);

        context = { ...context, ...pages };

        continue;
      }

      if (block.has_children) {
        const blocks = await fetchBlocks(client)(block.id);
        const pages = await walk(client)(serializers)(
          parent,
          blocks,
          context,
          IGNORE_NEST_LIST.includes(block.type) ? depth : depth + 1,
        );

        context = { ...context, ...pages };

        continue;
      }
    }

    return context;
  };

const extractPageTitle = (page: NotionPartialPageObjectResponse) => {
  if (!("properties" in page)) return "";

  if (page.properties.title?.type !== "title") return "";

  return page.properties.title.title[0].plain_text;
};

export type CrawlerOptions = {
  client: Client;
  serializers?: Partial<Serializers>;
  parentId?: string;
};
export type Crawler = (
  options: CrawlerOptions,
) => (rootPageId: string) => Promise<Pages>;
export const crawler: Crawler =
  ({ client, serializers, parentId }) =>
  async (rootPageId: string) => {
    const rootPage = (await fetchPage(client)(rootPageId)) as any;
    const rootPageTitle = extractPageTitle(rootPage);
    const rootBlocks = await fetchBlocks(client)(rootPage.id);

    const parent: Page = {
      metadata: {
        id: rootPage.id,
        title: rootPageTitle,
        createdTime: rootPage.created_time,
        lastEditedTime: rootPage.last_edited_time,
        parentId,
      },
      lines: [],
    };

    return walk(client)({ ...strategy, ...serializers })(parent, rootBlocks);
  };

export type DatabaseCrawler = (
  options: CrawlerOptions,
) => (databaseId: string) => Promise<Pages>;
export const databaseCrawler: DatabaseCrawler =
  (options) => async (databaseId) => {
    const crawl = crawler({ ...options, parentId: databaseId });
    const records = await fetchNotionDatabase(options.client)(databaseId);

    let context: Pages = {};

    for (const record of records) {
      const pages = await crawl(record.id);
      context = { ...context, ...pages };
    }

    return context;
  };
