import { NotionProperty } from "../../notion.types.js";

export type Serializer<T extends NotionProperty["type"]> = (
  property: Extract<NotionProperty, { type: T }>,
  key: string,
) => string | false;

export type Serializers = {
  [K in NotionProperty["type"]]: Serializer<K>;
};
