import { anchor } from "md-utils-ts";
import { has } from "../../libs.js";
import { fromDate, fromRichText, fromUser } from "../utils.js";
import { Serializer } from "./types.js";

export const DELIMITER = ": ";

type Checkbox = Serializer<"checkbox">;
export const checkbox: Checkbox = (name, property) =>
  `[${name}] ${property.checkbox}`;

type CreatedBy = Serializer<"created_by">;
export const createdBy: CreatedBy = (name, property) =>
  `[${name}] ${fromUser(property.created_by)}`;

type CreatedTime = Serializer<"created_time">;
export const createdTime: CreatedTime = (name, property) =>
  `[${name}] ${property.created_time}`;

type _Date = Serializer<"date">;
export const date: _Date = (name, property) =>
  `[${name}] ${fromDate(property.date)}`;

type Email = Serializer<"email">;
export const email: Email = (name, property) => `[${name}] ${property.email}`;

type Title = Serializer<"title">;
export const title: Title = (name, property) =>
  `[${name}] ${fromRichText(property.title)}`;

type Files = Serializer<"files">;
export const files: Files = (name, property) =>
  `[${name}]` +
  property.files
    .map((file) => {
      const href = has(file, "external") ? file.external.url : file.file.url;
      return anchor(file.name, href);
    })
    .join(", ");

export const defaults = {
  title,
  checkbox,
  createdBy,
  createdTime,
  date,
  email,
  files,
};
