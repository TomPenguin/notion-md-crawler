import { anchor } from "md-utils-ts";
import { has } from "../../libs.js";
import { NotionProperty } from "../../types.js";
import { fromDate, fromRichText, fromUser } from "../utils.js";
import { Serializer } from "./types.js";

const DELIMITER = ", ";
const EMPTY_STR = "<empty>";

type Checkbox = Serializer<"checkbox">;
export const checkbox: Checkbox = (name, prop) => `[${name}] ${prop.checkbox}`;

type CreatedBy = Serializer<"created_by">;
export const createdBy: CreatedBy = (name, prop) =>
  `[${name}] ${fromUser(prop.created_by)}`;

type CreatedTime = Serializer<"created_time">;
export const createdTime: CreatedTime = (name, prop) =>
  `[${name}] ${prop.created_time}`;

type _Date = Serializer<"date">;
export const date: _Date = (name, prop) => `[${name}] ${fromDate(prop.date)}`;

type Email = Serializer<"email">;
export const email: Email = (name, prop) =>
  `[${name}] ${prop.email ?? EMPTY_STR}`;

type Files = Serializer<"files">;
export const files: Files = (name, prop) =>
  `[${name}] ` +
  prop.files
    .map((file) => {
      const href = has(file, "external") ? file.external.url : file.file.url;
      return anchor(file.name, href);
    })
    .join(DELIMITER);

type Formula = Serializer<"formula">;
export const formula: Formula = (name, prop) => {
  switch (prop.formula.type) {
    case "string":
      return `[${name}] ${prop.formula.string ?? EMPTY_STR}`;
    case "boolean":
      return `[${name}] ${prop.formula.boolean ?? EMPTY_STR}`;
    case "date":
      return `[${name}] ${fromDate(prop.formula.date)}`;
    case "number":
      return `[${name}] ${prop.formula.number}`;
  }
};

type LastEditedBy = Serializer<"last_edited_by">;
export const lastEditedBy: LastEditedBy = (name, prop) =>
  `[${name}] ${fromUser(prop.last_edited_by)}`;

type LastEditedTime = Serializer<"last_edited_time">;
export const lastEditedTime: LastEditedTime = (name, prop) =>
  `[${name}] ${prop.last_edited_time}`;

type MultiSelect = Serializer<"multi_select">;
export const multiSelect: MultiSelect = (name, prop) =>
  `[${name}] ` + prop.multi_select.map((select) => select.name).join(DELIMITER);

type _Number = Serializer<"number">;
export const number: _Number = (name, prop) =>
  `[${name}] ${prop.number ?? EMPTY_STR}`;

type People = Serializer<"people">;
export const people: People = (name, prop) =>
  `[${name}] ` + prop.people.map((person) => fromUser(person)).join(DELIMITER);

type PhoneNumber = Serializer<"phone_number">;
export const phoneNumber: PhoneNumber = (name, prop) =>
  `[${name}] ${prop.phone_number ?? EMPTY_STR}`;

type Relation = Serializer<"relation">;
export const relation: Relation = (name, prop) =>
  `[${name}] ` + prop.relation.map((item) => `${item.id}`).join(DELIMITER);

type RichText = Serializer<"rich_text">;
export const richText: RichText = (name, prop) =>
  `[${name}] ${fromRichText(prop.rich_text)}`;

type Select = Serializer<"select">;
export const select: Select = (name, prop) =>
  `[${name}] ${prop.select?.name ?? EMPTY_STR}`;

type Status = Serializer<"status">;
export const status: Status = (name, prop) =>
  `[${name}] ${prop.status?.name ?? EMPTY_STR}`;

type Title = Serializer<"title">;
export const title: Title = (name, prop) =>
  `[${name}] ${fromRichText(prop.title)}`;

type UniqueId = Serializer<"unique_id">;
export const uniqueId: UniqueId = (name, prop) => {
  const prefix = prop.unique_id.prefix ?? "";
  const _number = prop.unique_id.number ?? "";
  const id = prefix + _number;
  return `[${name}] ${id || EMPTY_STR}`;
};

type Url = Serializer<"url">;
export const url: Url = (name, prop) => `[${name}] ${prop.url ?? EMPTY_STR}`;

type Verification = Serializer<"verification">;
export const verification: Verification = () => false;

type OmitFromUnion<T, U extends T> = T extends U ? never : T;
type RollupStrategy = {
  [K in OmitFromUnion<NotionProperty["type"], "rollup">]: Serializer<K>;
};
const rollupStrategy: RollupStrategy = {
  checkbox,
  created_by: createdBy,
  created_time: createdTime,
  date,
  email,
  files,
  formula,
  last_edited_by: lastEditedBy,
  last_edited_time: lastEditedTime,
  multi_select: multiSelect,
  number,
  people,
  phone_number: phoneNumber,
  relation,
  rich_text: richText,
  select,
  status,
  title,
  unique_id: uniqueId,
  url,
  verification,
};

type Rollup = Serializer<"rollup">;
export const rollup: Rollup = (name, prop) => {
  switch (prop.rollup.type) {
    case "number":
      return number(name, prop.rollup);
    case "date":
      return date(name, prop.rollup);
    case "array":
      return Promise.all(
        prop.rollup.array.map((item) =>
          rollupStrategy[item.type](name, item as any),
        ),
      ).then(
        (items) =>
          `[${name}] ` +
          items
            .map((item) => item as string)
            .map((text) => text.replace(`[${name}] `, ""))
            .join(DELIMITER),
      );
  }
};

export const defaults = {
  checkbox,
  createdBy,
  createdTime,
  date,
  email,
  files,
  formula,
  lastEditedBy,
  lastEditedTime,
  multiSelect,
  number,
  people,
  phoneNumber,
  relation,
  richText,
  rollup,
  select,
  status,
  title,
  uniqueId,
  url,
  verification,
};
