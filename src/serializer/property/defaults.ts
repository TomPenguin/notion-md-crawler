import { anchor } from "md-utils-ts";
import { has } from "../../libs.js";
import { NotionProperty } from "../../types.js";
import { fromDate, fromRichText, fromUser } from "../utils.js";
import { FactoryOptions, Serializer, SerializerFactory } from "./types.js";

const DELIMITER = ", ";
const EMPTY_STR = "<empty>";

type Checkbox = SerializerFactory<"checkbox">;
export const checkbox: Checkbox =
  ({ urlMask }) =>
  (name, prop) =>
    `[${name}] ${prop.checkbox}`;

type CreatedBy = SerializerFactory<"created_by">;
export const createdBy: CreatedBy =
  ({ urlMask }) =>
  (name, prop) =>
    `[${name}] ${fromUser(prop.created_by)}`;

type CreatedTime = SerializerFactory<"created_time">;
export const createdTime: CreatedTime =
  ({ urlMask }) =>
  (name, prop) =>
    `[${name}] ${prop.created_time}`;

type _Date = SerializerFactory<"date">;
export const date: _Date =
  ({ urlMask }) =>
  (name, prop) =>
    `[${name}] ${fromDate(prop.date)}`;

type Email = SerializerFactory<"email">;
export const email: Email =
  ({ urlMask }) =>
  (name, prop) =>
    `[${name}] ${prop.email ?? EMPTY_STR}`;

type Files = SerializerFactory<"files">;
export const files: Files =
  ({ urlMask }) =>
  (name, prop) =>
    `[${name}] ` +
    prop.files
      .map((file) => {
        const href = has(file, "external") ? file.external.url : file.file.url;
        return anchor(file.name, href);
      })
      .join(DELIMITER);

type Formula = SerializerFactory<"formula">;
export const formula: Formula =
  ({ urlMask }) =>
  (name, prop) => {
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

type LastEditedBy = SerializerFactory<"last_edited_by">;
export const lastEditedBy: LastEditedBy =
  ({ urlMask }) =>
  (name, prop) =>
    `[${name}] ${fromUser(prop.last_edited_by)}`;

type LastEditedTime = SerializerFactory<"last_edited_time">;
export const lastEditedTime: LastEditedTime =
  ({ urlMask }) =>
  (name, prop) =>
    `[${name}] ${prop.last_edited_time}`;

type MultiSelect = SerializerFactory<"multi_select">;
export const multiSelect: MultiSelect =
  ({ urlMask }) =>
  (name, prop) =>
    `[${name}] ` +
    prop.multi_select.map((select) => select.name).join(DELIMITER);

type _Number = SerializerFactory<"number">;
export const number: _Number =
  ({ urlMask }) =>
  (name, prop) =>
    `[${name}] ${prop.number ?? EMPTY_STR}`;

type People = SerializerFactory<"people">;
export const people: People =
  ({ urlMask }) =>
  (name, prop) =>
    `[${name}] ` +
    prop.people.map((person) => fromUser(person)).join(DELIMITER);

type PhoneNumber = SerializerFactory<"phone_number">;
export const phoneNumber: PhoneNumber =
  ({ urlMask }) =>
  (name, prop) =>
    `[${name}] ${prop.phone_number ?? EMPTY_STR}`;

type Relation = SerializerFactory<"relation">;
export const relation: Relation =
  ({ urlMask }) =>
  (name, prop) =>
    `[${name}] ` + prop.relation.map((item) => `${item.id}`).join(DELIMITER);

type RichText = SerializerFactory<"rich_text">;
export const richText: RichText =
  ({ urlMask }) =>
  (name, prop) =>
    `[${name}] ${fromRichText(prop.rich_text)}`;

type Select = SerializerFactory<"select">;
export const select: Select =
  ({ urlMask }) =>
  (name, prop) =>
    `[${name}] ${prop.select?.name ?? EMPTY_STR}`;

type Status = SerializerFactory<"status">;
export const status: Status =
  ({ urlMask }) =>
  (name, prop) =>
    `[${name}] ${prop.status?.name ?? EMPTY_STR}`;

type Title = SerializerFactory<"title">;
export const title: Title =
  ({ urlMask }) =>
  (name, prop) =>
    `[${name}] ${fromRichText(prop.title)}`;

type UniqueId = SerializerFactory<"unique_id">;
export const uniqueId: UniqueId =
  ({ urlMask }) =>
  (name, prop) => {
    const prefix = prop.unique_id.prefix ?? "";
    const _number = prop.unique_id.number ?? "";
    const id = prefix + _number;
    return `[${name}] ${id || EMPTY_STR}`;
  };

type Url = SerializerFactory<"url">;
export const url: Url =
  ({ urlMask }) =>
  (name, prop) =>
    `[${name}] ${prop.url ?? EMPTY_STR}`;

type Verification = SerializerFactory<"verification">;
export const verification: Verification =
  ({ urlMask }) =>
  () =>
    false;

type OmitFromUnion<T, U extends T> = T extends U ? never : T;
type RollupFactory = (options: FactoryOptions) => {
  [K in OmitFromUnion<NotionProperty["type"], "rollup">]: Serializer<K>;
};
const rollupFactory: RollupFactory = (options) => ({
  checkbox: checkbox(options),
  created_by: createdBy(options),
  created_time: createdTime(options),
  date: date(options),
  email: email(options),
  files: files(options),
  formula: formula(options),
  last_edited_by: lastEditedBy(options),
  last_edited_time: lastEditedTime(options),
  multi_select: multiSelect(options),
  number: number(options),
  people: people(options),
  phone_number: phoneNumber(options),
  relation: relation(options),
  rich_text: richText(options),
  select: select(options),
  status: status(options),
  title: title(options),
  unique_id: uniqueId(options),
  url: url(options),
  verification: verification(options),
});

type Rollup = SerializerFactory<"rollup">;
export const rollup: Rollup = (options) => (name, prop) => {
  switch (prop.rollup.type) {
    case "number":
      return number(options)(name, prop.rollup);
    case "date":
      return date(options)(name, prop.rollup);
    case "array":
      const strategy = rollupFactory(options);
      return Promise.all(
        prop.rollup.array.map((item) => strategy[item.type](name, item as any)),
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

export const factory = (options: FactoryOptions) => ({
  ...rollupFactory(options),
  rollup: rollup(options),
});

export const defaults = factory({ urlMask: false });
