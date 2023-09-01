import { richText } from "../utils.js";
import { Serializer } from "./types.js";

export const DELIMITER = ": ";

type Title = Serializer<"title">;
export const title: Title = (name, property) =>
  [name, richText(property.title)].join(DELIMITER);

export const defaults = { title };
