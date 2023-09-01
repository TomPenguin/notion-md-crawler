import * as md from "md-utils-ts";
import { fromLink, fromRichText } from "../utils.js";
import { Serializer } from "./types.js";

type Audio = Serializer<"audio">;
export const audio: Audio = (block) => {
  const { title, href } = fromLink(block.audio);
  return md.anchor(title, href);
};

type Bookmark = Serializer<"bookmark">;
export const bookmark: Bookmark = (block) =>
  md.anchor(fromRichText(block.bookmark.caption), block.bookmark.url);

type Breadcrumb = Serializer<"breadcrumb">;
export const breadcrumb: Breadcrumb = () => false;

type BulletedListItem = Serializer<"bulleted_list_item">;
export const bulletedListItem: BulletedListItem = (block) =>
  md.bullet(fromRichText(block.bulleted_list_item.rich_text));

type Callout = Serializer<"callout">;
export const callout: Callout = (block) =>
  md.quote(fromRichText(block.callout.rich_text));

type ChildPage = Serializer<"child_page">;
export const childPage: ChildPage = (block) => `[${block.child_page.title}]`;

type ChildDatabase = Serializer<"child_database">;
export const childDatabase: ChildDatabase = (block) =>
  `[${block.child_database.title}]`;

type Code = Serializer<"code">;
export const code: Code = (block) =>
  md.codeBlock(block.code.language)(fromRichText(block.code.rich_text));

type Column = Serializer<"column">;
export const column: Column = () => false;

type ColumnList = Serializer<"column_list">;
export const columnList: ColumnList = () => false;

type Divider = Serializer<"divider">;
export const divider: Divider = () => md.hr();

type Embed = Serializer<"embed">;
export const embed: Embed = (block) => {
  const caption = fromRichText(block.embed.caption);
  return md.anchor(caption, block.embed.url);
};

type Equation = Serializer<"equation">;
export const equation: Equation = (block) =>
  md.equationBlock(block.equation.expression);

type File = Serializer<"file">;
export const file: File = (block) => {
  const { title, href } = fromLink(block.file);
  return md.anchor(title, href);
};

type Heading1 = Serializer<"heading_1">;
export const heading1: Heading1 = (block) =>
  md.h1(fromRichText(block.heading_1.rich_text));

type Heading2 = Serializer<"heading_2">;
export const heading2: Heading2 = (block) =>
  md.h2(fromRichText(block.heading_2.rich_text));

type Heading3 = Serializer<"heading_3">;
export const heading3: Heading3 = (block) =>
  md.h3(fromRichText(block.heading_3.rich_text));

type Image = Serializer<"image">;
export const image: Image = (block) => {
  const { title, href } = fromLink(block.image);
  return md.image(title, href);
};

type LinkPreview = Serializer<"link_preview">;
export const linkPreview: LinkPreview = (block) =>
  md.anchor(block.type, block.link_preview.url);

type LinkToPage = Serializer<"link_to_page">;
export const linkToPage: LinkToPage = (block) => {
  const href =
    block.link_to_page.type === "page_id" ? block.link_to_page.page_id : "";
  return md.anchor(block.type, href);
};

type NumberedListItem = Serializer<"numbered_list_item">;
export const numberedListItem: NumberedListItem = (block) =>
  md.bullet(fromRichText(block.numbered_list_item.rich_text), 1);

type Paragraph = Serializer<"paragraph">;
export const paragraph: Paragraph = (block) =>
  fromRichText(block.paragraph.rich_text);

type PDF = Serializer<"pdf">;
export const pdf: PDF = (block) => {
  const { title, href } = fromLink(block.pdf);
  return md.anchor(title, href);
};

type Quote = Serializer<"quote">;
export const quote: Quote = (block) =>
  md.quote(fromRichText(block.quote.rich_text));

type SyncedBlock = Serializer<"synced_block">;
export const syncedBlock: SyncedBlock = () => false;

type Table = Serializer<"table">;
export const table: Table = () => false;

type TableOfContents = Serializer<"table_of_contents">;
export const tableOfContents: TableOfContents = () => false;

type TableRow = Serializer<"table_row">;
export const tableRow: TableRow = (block) =>
  `| ${block.table_row.cells
    .flatMap((row) => row.map((column) => fromRichText([column])))
    .join(" | ")} |`;

type Template = Serializer<"template">;
export const template: Template = (block) =>
  fromRichText(block.template.rich_text);

type ToDo = Serializer<"to_do">;
export const toDo: ToDo = (block) =>
  md.todo(fromRichText(block.to_do.rich_text), block.to_do.checked);

type Toggle = Serializer<"toggle">;
export const toggle: Toggle = (block) => fromRichText(block.toggle.rich_text);

type Unsupported = Serializer<"unsupported">;
export const unsupported: Unsupported = () => false;

type Video = Serializer<"video">;
export const video: Video = (block) => {
  const { title, href } = fromLink(block.video);
  return md.anchor(title, href);
};

export const defaults = {
  audio,
  bookmark,
  breadcrumb,
  bulletedListItem,
  callout,
  childDatabase,
  childPage,
  code,
  column,
  columnList,
  divider,
  embed,
  equation,
  file,
  heading1,
  heading2,
  heading3,
  image,
  linkPreview,
  linkToPage,
  numberedListItem,
  paragraph,
  pdf,
  quote,
  syncedBlock,
  table,
  tableOfContents,
  tableRow,
  template,
  toDo,
  toggle,
  unsupported,
  video,
};
