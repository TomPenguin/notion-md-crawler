import { ExtractBlock, NotionBlock } from "../../types.js";

export type Serializer<T extends NotionBlock["type"]> = (
  block: ExtractBlock<T>,
) => string | false;

export type Serializers = {
  [K in NotionBlock["type"]]: Serializer<K>;
};
