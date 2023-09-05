import { h1 } from "md-utils-ts";
import { Crawler, CrawlingResult, DBCrawler, Page } from "./types.js";

const nestHeading = (text: string) => (text.match(/^#+\s/) ? "#" + text : text);

/**
 * `pageToString` transforms a `Page` object into a string representation. It formats the metadata, properties, and lines
 * into a unified string, with the metadata as an H1 heading and the properties nested between triple-dashes.
 *
 * @param {Page} params - An object containing:
 *   - metadata: The metadata of the page which includes the title.
 *   - properties: An array of property strings.
 *   - lines: An array of line strings.
 *
 * @returns {string} A string representation of the provided page.
 */
export const pageToString = ({ metadata, properties, lines }: Page): string => {
  const title = h1(metadata.title);
  const data = ["---", properties.join("\n"), "---"].join("\n");
  const body = lines.map(nestHeading);
  return [title, data, ...body].join("\n");
};

type Crawling =
  | ReturnType<ReturnType<Crawler>>
  | ReturnType<ReturnType<DBCrawler>>;

/**
 * Asynchronously waits for all results from a given crawling operation and collects them into an array.
 * This function is compatible with both `Crawler` and `DBCrawler` types.
 *
 * @param {Crawling} crawling - A generator function that yields crawling results. It can be an instance of `Crawler` or `DBCrawler`.
 *
 * @returns {Promise<CrawlingResult[]>} A Promise that resolves to an array of `CrawlingResult` objects, which contain the results of the crawling operation.
 *
 * @example
 * // Initialize a Crawler or DBCrawler instance
 * const crawl = crawler({ client: myClient });
 * // OR
 * const dbCrawl = dbCrawler({ client: myDbClient });
 *
 * // Wait for all results and collect them
 * waitAllResults(crawl("someRootPageId"))
 *   .then((allResults) => {
 *     console.log("All crawled results:", allResults);
 *   })
 *   .catch((error) => {
 *     console.error("Error during crawling:", error);
 *   });
 */
export const waitAllResults = async (crawling: Crawling) => {
  const results: CrawlingResult[] = [];

  for await (const result of crawling) {
    results.push(result);
  }

  return results;
};
