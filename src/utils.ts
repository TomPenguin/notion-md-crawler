import { h1 } from "md-utils-ts";
import { Page, Pages } from "./types.js";

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

/**
 * `pagesToString` transforms a `Pages` object (a record of page IDs to `Page` objects) into a record of strings.
 * Each page is transformed into its string representation using the `pageToString` function.
 *
 * @param {Pages} pages - A record of page IDs to `Page` objects.
 *
 * @returns {Record<string, string>} A record where each key is a page ID and each value is the string representation of the corresponding page.
 */
export const pagesToString = (pages: Pages): Record<string, string> =>
  Object.fromEntries(
    Object.entries(pages).map(([pageId, page]) => [pageId, pageToString(page)]),
  );
