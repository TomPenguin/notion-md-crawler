import { richText } from "../utils.js";
import { Serializer } from "./types.js";

type Title = Serializer<"title">;
export const title: Title = (property) => richText(property.title);

export const defaults = { title };
