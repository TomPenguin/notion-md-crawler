import { NotionProperty } from "../../notion.types.js";

export type Serializer<T extends NotionProperty["type"]> = (
  name: string,
  property: Extract<NotionProperty, { type: T }>,
) => string | false | Promise<string | false>;

export type Serializers = {
  [K in NotionProperty["type"]]: Serializer<K>;
};
