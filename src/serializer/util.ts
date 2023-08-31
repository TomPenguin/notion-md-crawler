import * as md from "md-utils-ts";
import { ExtractBlock } from "../types.js";

type NotionParagraphBlock = ExtractBlock<"paragraph">;
type NotionRichText = NotionParagraphBlock["paragraph"]["rich_text"];
type NotionAnnotations = NotionRichText[number]["annotations"];
type NotionImageBlock = ExtractBlock<"image">;
type NotionLinkObject = NotionImageBlock["image"];

export type Annotate = (text: string, annotations: NotionAnnotations) => string;
export const annotate: Annotate = (text, annotations) => {
  if (annotations.code) text = md.inlineCode(text);
  if (annotations.bold) text = md.bold(text);
  if (annotations.italic) text = md.italic(text);
  if (annotations.strikethrough) text = md.del(text);
  if (annotations.underline) text = md.underline(text);

  return text;
};

export type RichText = (richText: NotionRichText) => string;
export const richText: RichText = (richTextObject) =>
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
      const linkedText = href ? md.anchor(annotatedText, href) : annotatedText;

      return leading_space + linkedText + trailing_space;
    })
    .join("");

export type Link = (linkObject: NotionLinkObject) => {
  title: string;
  href: string;
};
export const link: Link = (linkObject) => {
  const caption = richText(linkObject.caption);
  const href =
    linkObject.type === "external"
      ? linkObject.external.url
      : linkObject.file.url;
  const fileName = href.match(/[^\/\\&\?]+\.\w{3,4}(?=([\?&].*$|$))/);
  const title = caption.trim() ? caption : fileName ? fileName[0] : "link";
  return { title, href };
};
