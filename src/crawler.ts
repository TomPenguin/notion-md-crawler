import { Client, collectPaginatedAPI } from "@notionhq/client";
import { indent } from "md-utils-ts";
import { strategy } from "./serializer/index.js";
import { SerializerStrategy } from "./serializer/types.js";
import {
  ExtractBlock,
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

type NotionChildPageBlock = ExtractBlock<"child_page">;
type NotionPageRetrieveMethod = NotionClient["pages"]["retrieve"];
type NotionPartialPageObjectResponse = Awaited<
  ReturnType<NotionPageRetrieveMethod>
>;

const fetchNotionBlocks = (client: Client) => async (blockId: string) =>
  collectPaginatedAPI(client.blocks.children.list, {
    block_id: blockId,
  });

const fetchNotionPage = (client: Client) => (pageId: string) =>
  client.pages.retrieve({ page_id: pageId });

const hasType = (block: NotionBlockObjectResponse): block is NotionBlock =>
  "type" in block;

const blockIs = <T extends NotionBlock["type"]>(
  block: NotionBlock,
  type: T,
): block is Extract<NotionBlock, { type: T }> => block.type === type;

const getCursor = (
  pageBlock: NotionChildPageBlock,
  parentId?: string,
): Page => ({
  metadata: {
    id: pageBlock.id,
    title: pageBlock.child_page.title,
    createdTime: pageBlock.created_time,
    lastEditedTime: pageBlock.last_edited_time,
    parentId,
  },
  lines: [],
});

const getNest = (block: NotionBlock, baseNest: number) => {
  switch (block.type) {
    // Reset nest
    case "child_page":
      return 0;

    // Eliminates unnecessary nests due to NotionBlock structure
    case "table_row":
    case "column_list":
    case "column":
    case "synced_block":
      return baseNest;

    default:
      return baseNest + 1;
  }
};

const walk =
  (client: Client) =>
  (strategy: SerializerStrategy) =>
  async (
    blocks: NotionBlockObjectResponse[],
    cursor: Page,
    pages: Pages = {},
    nest = 0,
  ): Promise<Pages> => {
    pages[cursor.metadata.id] = pages[cursor.metadata.id] || cursor;

    for (const block of blocks) {
      if (!hasType(block)) continue;

      const serialize = strategy[block.type];
      const text = serialize(block as any);

      if (text !== false) {
        const line = indent()(text, nest);
        cursor.lines.push(line);
      }

      if (block.has_children) {
        const blockId = blockIs(block, "synced_block")
          ? block.synced_block.synced_from?.block_id || block.id
          : block.id;
        const childBlocks = await fetchNotionBlocks(client)(blockId);
        const nextCursor = blockIs(block, "child_page")
          ? getCursor(block, cursor.metadata.id)
          : cursor;
        const childPages = await walk(client)(strategy)(
          childBlocks,
          nextCursor,
          pages,
          getNest(block, nest),
        );
        pages = { ...pages, ...childPages };
      }
    }

    return pages;
  };

const extractPageTitle = (page: NotionPartialPageObjectResponse) => {
  if (!("properties" in page)) return "";

  if (page.properties.title.type !== "title") return "";

  return page.properties.title.title[0].plain_text;
};

export type NotionMdCrawlerOptions = {
  client: Client;
  serializerStrategy?: SerializerStrategy;
};
export type NotionMdCrawler = (
  options: NotionMdCrawlerOptions,
) => (rootPageId: string) => Promise<Pages>;
export const crawler: NotionMdCrawler =
  ({ client, serializerStrategy }) =>
  async (rootPageId: string) => {
    const rootPage = (await fetchNotionPage(client)(rootPageId)) as any;
    const rootPageTitle = extractPageTitle(rootPage);
    const rootBlocks = await fetchNotionBlocks(client)(rootPage.id);

    const cursor: Page = {
      metadata: {
        id: rootPage.id,
        title: rootPageTitle,
        createdTime: rootPage.created_time,
        lastEditedTime: rootPage.last_edited_time,
      },
      lines: [],
    };

    return walk(client)({ ...strategy, ...serializerStrategy })(
      rootBlocks,
      cursor,
    );
  };
