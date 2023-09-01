import { anchor } from "md-utils-ts";
import { has } from "../../libs.js";
import { fromDate, fromRichText, fromUser } from "../utils.js";
import { Serializer } from "./types.js";

export const DELIMITER = ", ";

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
export const email: Email = (name, prop) => `[${name}] ${prop.email}`;

type Title = Serializer<"title">;
export const title: Title = (name, prop) =>
  `[${name}] ${fromRichText(prop.title)}`;

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
      return `[${name}] ${prop.formula.string}`;
    case "boolean":
      return `[${name}] ${prop.formula.boolean}`;
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
export const number: _Number = (name, prop) => `[${name}] ${prop.number}`;

type People = Serializer<"people">;
export const people: People = (name, prop) =>
  `[${name}] ` + prop.people.map((person) => fromUser(person)).join(DELIMITER);

type PhoneNumber = Serializer<"phone_number">;
export const phoneNumber: PhoneNumber = (name, prop) =>
  `[${name}] ${prop.phone_number}`;

type Relation = Serializer<"relation">;
export const relation: Relation = (name, prop) =>
  `[${name}] ` + prop.relation.map((item) => `${item.id}`).join(DELIMITER);

export const defaults = {
  title,
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
};
