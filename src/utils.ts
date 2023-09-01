import { h1 } from "md-utils-ts";
import { Page, Pages } from "./types.js";

const nestHeading = (text: string) => (text.match(/^#+\s/) ? "#" + text : text);

export const pageToString = ({ lines, metadata }: Page): string => {
  const title = h1(metadata.title);
  const body = lines.map(nestHeading);
  return [title, ...body].join("\n");
};

export const pagesToString = (pages: Pages): Record<string, string> =>
  Object.fromEntries(
    Object.entries(pages).map(([pageId, page]) => [pageId, pageToString(page)]),
  );
