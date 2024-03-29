import { indent as _indent } from "md-utils-ts";
import {
  fetchNotionBlocks,
  fetchNotionDatabase,
  fetchNotionPage,
} from "./clients.js";
import { has } from "./libs.js";
import { serializer } from "./serializer/index.js";
import { propertiesSerializer } from "./serializer/property/index.js";
import {
  CrawlerOptions,
  CrawlingResult,
  Dictionary,
  Metadata,
  MetadataBuilder,
  NotionBlock,
  NotionBlockObjectResponse,
  NotionChildPage,
  NotionPage,
  NotionProperties,
  Page,
} from "./types.js";

const blockIs = <T extends NotionBlock["type"][]>(
  block: NotionBlock,
  types: T,
): block is Extract<NotionBlock, { type: T[number] }> =>
  types.includes(block.type);

const shouldSkipPage = (currentPageId: string, skipPageIds?: string[]) =>
  skipPageIds && skipPageIds.includes(currentPageId);

const pageInit =
  <T extends Dictionary>(metadataBuilder?: MetadataBuilder<T>) =>
  async (
    page: NotionPage | NotionBlock,
    title: string,
    parent?: Page<T>,
    properties?: string[],
  ): Promise<Page<T>> => {
    const metadata: Metadata = {
      id: page.id,
      title,
      createdTime: page.created_time,
      lastEditedTime: page.last_edited_time,
      parentId: parent?.metadata.id,
    };

    const userMetadata = metadataBuilder
      ? await metadataBuilder({ page, title, properties, parent })
      : ({} as T);

    return {
      metadata: { ...metadata, ...userMetadata },
      properties: properties || [],
      lines: [],
    };
  };

/**
 * List of block types that do not need to be nested.
 * Avoid nesting when serializing due to the Notion Block structure.
 */
const IGNORE_NEST_LIST = ["table", "table_row", "column_list", "column"];

const indent = _indent();

const getBlockSerializer = <T extends Dictionary>(
  type: NotionBlock["type"],
  { urlMask = false, serializers }: CrawlerOptions<T>,
) =>
  ({
    ...serializer.block.strategy({ urlMask }),
    ...serializers?.block,
  })[type];

const isPage = (block: NotionBlock): block is NotionChildPage =>
  blockIs(block, ["child_page", "child_database"]);

const getSuccessResult = <T extends Dictionary>(
  page: Page<T>,
): CrawlingResult<T> => ({
  id: page.metadata.id,
  success: true,
  page,
});

const getFailedResult = <T extends Dictionary>(
  page: Page<T>,
  err: unknown,
): CrawlingResult<T> => ({
  id: page.metadata.id,
  success: false,
  failure: {
    parentId: page.metadata.parentId,
    reason:
      err instanceof Error
        ? `${err.name}: ${err.message}\n${err.stack}`
        : `${err}`,
  },
});

const readLines =
  <T extends Dictionary>(options: CrawlerOptions<T>) =>
  async (blocks: NotionBlockObjectResponse[], depth = 0) => {
    let lines: string[] = [];
    let pages: NotionChildPage[] = [];

    for (const block of blocks) {
      if (!has(block, "type")) continue;
      const { type } = block;
      const serialize = getBlockSerializer(type, options);
      const text = await serialize(block as any);

      if (text !== false) {
        const line = indent(text, depth);
        lines.push(line);
      }

      if (isPage(block)) {
        pages.push(block);

        continue;
      }

      if (blockIs(block, ["synced_block"])) {
        // Specify the sync destination block id
        const blockId = block.synced_block.synced_from?.block_id || block.id;
        const _blocks = await fetchNotionBlocks(options.client)(blockId);
        const result = await readLines(options)(_blocks, depth);

        lines = [...lines, ...result.lines];
        pages = [...pages, ...result.pages];

        continue;
      }

      if (block.has_children) {
        const _blocks = await fetchNotionBlocks(options.client)(block.id);
        const _depth = IGNORE_NEST_LIST.includes(type) ? depth : depth + 1;
        const result = await readLines(options)(_blocks, _depth);

        lines = [...lines, ...result.lines];
        pages = [...pages, ...result.pages];
      }
    }

    return { lines, pages };
  };

const walking = <T extends Dictionary>(options: CrawlerOptions<T>) =>
  async function* (
    parent: Page<T>,
    blocks: NotionBlockObjectResponse[],
    depth = 0,
  ): AsyncGenerator<CrawlingResult<T>> {
    try {
      const { client, metadataBuilder } = options;
      const initPage = pageInit(metadataBuilder);

      const { lines, pages } = await readLines(options)(blocks, depth);
      yield getSuccessResult({ ...parent, lines });

      for (const page of pages) {
        if (shouldSkipPage(page.id, options.skipPageIds)) continue;

        if (blockIs(page, ["child_page"])) {
          const { title } = page.child_page;
          const _parent = await initPage(page, title, parent);
          const _blocks = await fetchNotionBlocks(client)(page.id);

          yield* walking(options)(_parent, _blocks, 0);

          continue;
        }

        if (blockIs(page, ["child_database"])) {
          const { title } = page.child_database;
          const _parent = await initPage(page, title, parent);
          const _options = { ...options, parent: _parent };

          yield* dbCrawler(_options)(page.id);
        }
      }
    } catch (err) {
      yield getFailedResult(parent, err);
    }
  };

const serializeProperties = <T extends Dictionary>(
  properties: NotionProperties,
  options: CrawlerOptions<T>,
) => {
  const { urlMask = false, serializers } = options;
  const _serializers = {
    ...serializer.property.strategy({ urlMask }),
    ...serializers?.property,
  };

  return propertiesSerializer(_serializers)(properties);
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

/**
 * `crawler` is a higher-order function that returns a function designed to crawl through Notion pages.
 * It utilizes given client, optional serializers, and an optional parentId to customize its operation.
 *
 * @param {CrawlerOptions} options - The crawler options which contains:
 *  - client: An instance of the Notion client.
 *  - serializers?: An optional object that can be used to define custom serializers for blocks and properties.
 *  - urlMask?: If specified, the url is masked with the string.
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
export const crawler = <T extends Dictionary>(options: CrawlerOptions<T>) =>
  async function* (rootPageId: string): AsyncGenerator<CrawlingResult<T>> {
    const { client, parent, metadataBuilder, skipPageIds } = options;
    if (shouldSkipPage(rootPageId, skipPageIds)) return;

    try {
      const notionPage = await fetchNotionPage(client)(rootPageId);

      if (!has(notionPage, "parent")) {
        const reason = "Unintended Notion Page object.";

        return yield {
          id: rootPageId,
          success: false,
          failure: { parentId: parent?.metadata.id, reason },
        };
      }

      // Preparation Before Exploring
      const props = await serializeProperties(notionPage.properties, options);
      const blocks = await fetchNotionBlocks(client)(notionPage.id);
      const title = extractPageTitle(notionPage);
      const initPage = pageInit(metadataBuilder);
      const rootPage = await initPage(notionPage, title, parent, props);

      yield* walking(options)(rootPage, blocks);
    } catch {
      // Try as DB Page may have been passed.
      yield* dbCrawler(options)(rootPageId);
    }
  };

/**
 * `dbCrawler` is specifically designed to crawl Notion databases. This function retrieves all records in a database and then
 * utilizes the `crawler` function for each individual record.
 *
 * Note: When working with a root page that is a database, use `dbCrawler` instead of the regular `crawler`.
 *
 * @param {CrawlerOptions} options - The options necessary for the crawl operation, which includes:
 *  - client: The Notion client used for making requests.
 *  - serializers: Optional serializers for block and property.
 *  - urlMask?: If specified, the url is masked with the string.
 *
 * @returns {Function} A function that takes a `databaseId` and returns a promise that resolves to a `Pages` object, which is a collection of
 * all the pages found within the specified Notion database.
 */
export const dbCrawler = <T extends Dictionary>(options: CrawlerOptions<T>) =>
  async function* (rootDatabaseId: string): AsyncGenerator<CrawlingResult<T>> {
    const { skipPageIds } = options;
    if (shouldSkipPage(rootDatabaseId, skipPageIds)) return;

    const crawl = crawler(options);
    const records = await fetchNotionDatabase(options.client)(rootDatabaseId);

    const { parent } = options;
    if (parent) {
      yield getSuccessResult<T>(parent);
    }

    for (const record of records) {
      yield* crawl(record.id);
    }
  };
