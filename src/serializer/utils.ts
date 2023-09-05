import * as md from "md-utils-ts";
import { has } from "../libs.js";
import { ExtractBlock, ExtractProperty } from "../types.js";

type NotionParagraphBlock = ExtractBlock<"paragraph">;
type NotionRichText = NotionParagraphBlock["paragraph"]["rich_text"];
type NotionAnnotations = NotionRichText[number]["annotations"];
type NotionImageBlock = ExtractBlock<"image">;
type NotionLinkObject = NotionImageBlock["image"];

export type Annotate = (text: string, annotations: NotionAnnotations) => string;

/**
 * `annotate` is a function designed to apply various annotations to a given text. It transforms the text based on the `NotionAnnotations` provided.
 *
 * Annotations include: code, bold, italic, strikethrough, and underline.
 * Multiple annotations can be applied to the text at once.
 *
 * @param {string} text - The original text to which annotations should be applied.
 * @param {NotionAnnotations} annotations - An object that specifies which annotations to apply to the text.
 * The object can have properties such as `code`, `bold`, `italic`, `strikethrough`, and `underline` set to `true` to apply the corresponding annotation.
 *
 * @returns {string} The annotated text.
 */
export const annotate: Annotate = (text, annotations) => {
  if (annotations.code) text = md.inlineCode(text);
  if (annotations.bold) text = md.bold(text);
  if (annotations.italic) text = md.italic(text);
  if (annotations.strikethrough) text = md.del(text);
  if (annotations.underline) text = md.underline(text);

  return text;
};

export type FromRichText = (
  richText: NotionRichText,
  urlMask?: string | false,
) => string;

/**
 * `fromRichText` transforms a Notion-rich text object into a plain string representation, preserving annotations such as bold, italic, etc., and links (hrefs).
 *
 * The function first determines if the provided text is whitespace only. If true, it just returns the whitespace.
 * Otherwise, it preserves the leading and trailing spaces, trims the main content, applies annotations, and embeds links if present.
 *
 * @param {NotionRichText} richTextObject - An array of Notion rich text objects. Each object has a `plain_text` field with the raw text,
 * `annotations` detailing style attributes, and an optional `href` for links.
 *
 * @returns {string} A transformed string representation of the provided Notion-rich text object.
 */
export const fromRichText: FromRichText = (richTextObject, urlMask = false) =>
  richTextObject
    .map(({ plain_text, annotations, href }) => {
      if (plain_text.match(/^\s*$/)) return plain_text;

      const leadingSpaceMatch = plain_text.match(/^(\s*)/);
      const trailingSpaceMatch = plain_text.match(/(\s*)$/);

      const leading_space = leadingSpaceMatch ? leadingSpaceMatch[0] : "";
      const trailing_space = trailingSpaceMatch ? trailingSpaceMatch[0] : "";

      const text = plain_text.trim();

      if (text === "") return leading_space + trailing_space;

      const annotatedText = annotate(text, annotations);
      const linkedText = href
        ? md.anchor(annotatedText, urlMask || href)
        : annotatedText;

      return leading_space + linkedText + trailing_space;
    })
    .join("");

export type fromLink = (linkObject: NotionLinkObject) => {
  title: string;
  href: string;
};

/**
 * `fromLink` transforms a Notion link object into a simpler representation with a title and href.
 *
 * @param {NotionLinkObject} linkObject - The Notion link object to be transformed.
 *
 * @returns {Object} An object with a `title` which is either the caption of the link, the file name, or a default "link" string,
 * and `href` which is the URL of the link.
 */
export const fromLink: fromLink = (linkObject) => {
  const caption = fromRichText(linkObject.caption);
  const href =
    linkObject.type === "external"
      ? linkObject.external.url
      : linkObject.file.url;
  const fileName = href.match(/[^\/\\&\?]+\.\w{3,4}(?=([\?&].*$|$))/);
  const title = caption.trim() ? caption : fileName ? fileName[0] : "link";
  return { title, href };
};

type NotionUserObject = ExtractProperty<"created_by">["created_by"];
type FromUser = (_user: NotionUserObject) => string;

/**
 * `fromUser` transforms a Notion user object into a string representation of the user's name.
 * If the user is a bot, "[bot]" is appended to the name.
 *
 * @param {NotionUserObject} _user - The Notion user object to be transformed.
 *
 * @returns {string} A string representation of the user's name.
 */
export const fromUser: FromUser = (_user) => {
  if (!has(_user, "type")) return "<empty>";

  const name = _user.name ?? "<empty>";
  return _user.type === "person" ? `${name}` : `${name}[bot]`;
};

type NotionDateObject = ExtractProperty<"date">["date"];
type FromDate = (date: NotionDateObject) => string;

/**
 * `fromDate` transforms a Notion date object into a string representation.
 * If the date object contains both a start and end date, both dates are returned. Otherwise, only the start date is returned.
 *
 * @param {NotionDateObject} date - The Notion date object to be transformed.
 *
 * @returns {string} A string representation of the date or dates.
 */
export const fromDate: FromDate = (date) => {
  if (!date) return "<empty>";

  return date.end ? `(start)${date.start}, (end): ${date.end}` : date.start;
};
