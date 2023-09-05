import * as md from "md-utils-ts";
import { fromLink, fromRichText } from "../utils.js";
import { FactoryOptions, SerializerFactory } from "./types.js";

type Audio = SerializerFactory<"audio">;
export const audio: Audio =
  ({ urlMask }) =>
  (block) => {
    const { title, href } = fromLink(block.audio);
    return md.anchor(title, urlMask || href);
  };

type Bookmark = SerializerFactory<"bookmark">;
export const bookmark: Bookmark =
  ({ urlMask }) =>
  (block) =>
    md.anchor(
      fromRichText(block.bookmark.caption),
      urlMask || block.bookmark.url,
    );

type Breadcrumb = SerializerFactory<"breadcrumb">;
export const breadcrumb: Breadcrumb = () => () => false;

type BulletedListItem = SerializerFactory<"bulleted_list_item">;
export const bulletedListItem: BulletedListItem =
  ({ urlMask }) =>
  (block) =>
    md.bullet(fromRichText(block.bulleted_list_item.rich_text, urlMask));

type Callout = SerializerFactory<"callout">;
export const callout: Callout =
  ({ urlMask }) =>
  (block) =>
    md.quote(fromRichText(block.callout.rich_text, urlMask));

type ChildPage = SerializerFactory<"child_page">;
export const childPage: ChildPage = () => (block) =>
  `[${block.child_page.title}]`;

type ChildDatabase = SerializerFactory<"child_database">;
export const childDatabase: ChildDatabase = () => (block) =>
  `[${block.child_database.title}]`;

type Code = SerializerFactory<"code">;
export const code: Code =
  ({ urlMask }) =>
  (block) =>
    md.codeBlock(block.code.language)(
      fromRichText(block.code.rich_text, urlMask),
    );

type Column = SerializerFactory<"column">;
export const column: Column = () => () => false;

type ColumnList = SerializerFactory<"column_list">;
export const columnList: ColumnList = () => () => false;

type Divider = SerializerFactory<"divider">;
export const divider: Divider = () => () => md.hr();

type Embed = SerializerFactory<"embed">;
export const embed: Embed =
  ({ urlMask }) =>
  (block) => {
    const caption = fromRichText(block.embed.caption, urlMask);
    return md.anchor(caption, urlMask || block.embed.url);
  };

type Equation = SerializerFactory<"equation">;
export const equation: Equation = () => (block) =>
  md.equationBlock(block.equation.expression);

type File = SerializerFactory<"file">;
export const file: File =
  ({ urlMask }) =>
  (block) => {
    const { title, href } = fromLink(block.file);
    return md.anchor(title, urlMask || href);
  };

type Heading1 = SerializerFactory<"heading_1">;
export const heading1: Heading1 =
  ({ urlMask }) =>
  (block) =>
    md.h1(fromRichText(block.heading_1.rich_text, urlMask));

type Heading2 = SerializerFactory<"heading_2">;
export const heading2: Heading2 =
  ({ urlMask }) =>
  (block) =>
    md.h2(fromRichText(block.heading_2.rich_text, urlMask));

type Heading3 = SerializerFactory<"heading_3">;
export const heading3: Heading3 =
  ({ urlMask }) =>
  (block) =>
    md.h3(fromRichText(block.heading_3.rich_text, urlMask));

type Image = SerializerFactory<"image">;
export const image: Image =
  ({ urlMask }) =>
  (block) => {
    const { title, href } = fromLink(block.image);
    return md.image(title, urlMask || href);
  };

type LinkPreview = SerializerFactory<"link_preview">;
export const linkPreview: LinkPreview =
  ({ urlMask }) =>
  (block) =>
    md.anchor(block.type, urlMask || block.link_preview.url);

type LinkToPage = SerializerFactory<"link_to_page">;
export const linkToPage: LinkToPage =
  ({ urlMask }) =>
  (block) => {
    const href =
      block.link_to_page.type === "page_id" ? block.link_to_page.page_id : "";
    return md.anchor(block.type, urlMask || href);
  };

type NumberedListItem = SerializerFactory<"numbered_list_item">;
export const numberedListItem: NumberedListItem =
  ({ urlMask }) =>
  (block) =>
    md.bullet(fromRichText(block.numbered_list_item.rich_text, urlMask), 1);

type Paragraph = SerializerFactory<"paragraph">;
export const paragraph: Paragraph =
  ({ urlMask }) =>
  (block) =>
    fromRichText(block.paragraph.rich_text, urlMask);

type PDF = SerializerFactory<"pdf">;
export const pdf: PDF =
  ({ urlMask }) =>
  (block) => {
    const { title, href } = fromLink(block.pdf);
    return md.anchor(title, urlMask || href);
  };

type Quote = SerializerFactory<"quote">;
export const quote: Quote =
  ({ urlMask }) =>
  (block) =>
    md.quote(fromRichText(block.quote.rich_text, urlMask));

type SyncedBlock = SerializerFactory<"synced_block">;
export const syncedBlock: SyncedBlock = () => () => false;

type Table = SerializerFactory<"table">;
export const table: Table = () => () => false;

type TableOfContents = SerializerFactory<"table_of_contents">;
export const tableOfContents: TableOfContents = () => () => false;

type TableRow = SerializerFactory<"table_row">;
export const tableRow: TableRow =
  ({ urlMask }) =>
  (block) =>
    `| ${block.table_row.cells
      .flatMap((row) => row.map((column) => fromRichText([column], urlMask)))
      .join(" | ")} |`;

type Template = SerializerFactory<"template">;
export const template: Template =
  ({ urlMask }) =>
  (block) =>
    fromRichText(block.template.rich_text, urlMask);

type ToDo = SerializerFactory<"to_do">;
export const toDo: ToDo =
  ({ urlMask }) =>
  (block) =>
    md.todo(fromRichText(block.to_do.rich_text, urlMask), block.to_do.checked);

type Toggle = SerializerFactory<"toggle">;
export const toggle: Toggle =
  ({ urlMask }) =>
  (block) =>
    fromRichText(block.toggle.rich_text, urlMask);

type Unsupported = SerializerFactory<"unsupported">;
export const unsupported: Unsupported = () => () => false;

type Video = SerializerFactory<"video">;
export const video: Video =
  ({ urlMask }) =>
  (block) => {
    const { title, href } = fromLink(block.video);
    return md.anchor(title, urlMask || href);
  };

export const factory = (options: FactoryOptions) => ({
  audio: audio(options),
  bookmark: bookmark(options),
  breadcrumb: breadcrumb(options),
  bulleted_list_item: bulletedListItem(options),
  callout: callout(options),
  child_database: childDatabase(options),
  child_page: childPage(options),
  code: code(options),
  column: column(options),
  column_list: columnList(options),
  divider: divider(options),
  embed: embed(options),
  equation: equation(options),
  file: file(options),
  heading_1: heading1(options),
  heading_2: heading2(options),
  heading_3: heading3(options),
  image: image(options),
  link_preview: linkPreview(options),
  link_to_page: linkToPage(options),
  numbered_list_item: numberedListItem(options),
  paragraph: paragraph(options),
  pdf: pdf(options),
  quote: quote(options),
  synced_block: syncedBlock(options),
  table: table(options),
  table_of_contents: tableOfContents(options),
  table_row: tableRow(options),
  template: template(options),
  to_do: toDo(options),
  toggle: toggle(options),
  unsupported: unsupported(options),
  video: video(options),
});

export const defaults = factory({ urlMask: false });
