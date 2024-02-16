import {
  APIErrorCode,
  Client,
  collectPaginatedAPI,
  isNotionClientError,
} from "@notionhq/client";
import { wait } from "./libs.js";

const isRateLimitError = (error: unknown) =>
  isNotionClientError(error) && error.code === APIErrorCode.RateLimited;

/**
 * Executes a function with exponential backoff on rate limit error.
 * @param fn - The function to execute.
 * @param retries - The number of retries before giving up. Default is 5.
 * @param delay - The delay in milliseconds before each retry. Default is 1000ms.
 * @returns A promise that resolves to the result of the function.
 * @throws If the function throws an error other than rate limit error.
 */
const backoffOnRateLimit = async <T>(
  fn: () => Promise<T>,
  retries: number = 5,
  delay: number = 1000,
): Promise<T> => {
  try {
    return await fn();
  } catch (error) {
    if (isRateLimitError(error)) {
      if (retries === 0) throw error;
      console.log(
        `Rate limited. Retries left: ${retries}. Waiting ${delay}ms before retrying...`,
      );
      await wait(delay);
      return backoffOnRateLimit(fn, retries - 1, delay * 2);
    } else {
      throw error;
    }
  }
};

/**
 * Fetches Notion blocks for a given block ID.
 *
 * @param client - The Notion client.
 * @returns A function that takes a block ID and returns a promise that resolves to an array of Notion blocks.
 */
export const fetchNotionBlocks = (client: Client) => async (blockId: string) =>
  backoffOnRateLimit(() =>
    collectPaginatedAPI(client.blocks.children.list, {
      block_id: blockId,
    }),
  ).catch(() => []);

/**
 * Fetches a Notion page using the provided client and page ID.
 * @param client The Notion client.
 * @returns A function that takes a page ID and returns a Promise that resolves to the retrieved page.
 */
export const fetchNotionPage = (client: Client) => (pageId: string) =>
  backoffOnRateLimit(() => client.pages.retrieve({ page_id: pageId }));

/**
 * Fetches the Notion database with the specified database ID.
 *
 * @param client - The Notion client.
 * @returns A function that takes a database ID and returns a promise that resolves to an array of database results.
 */
export const fetchNotionDatabase = (client: Client) => (databaseId: string) =>
  backoffOnRateLimit(() =>
    client.databases
      .query({ database_id: databaseId })
      .then(({ results }) => results),
  ).catch(() => []);
