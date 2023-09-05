import { ExtractBlock, NotionBlock } from "../../types.js";

export type FactoryOptions = {
  urlMask: string | false;
};

export type SerializerFactory<T extends NotionBlock["type"]> = (
  options: FactoryOptions,
) => (block: ExtractBlock<T>) => string | false | Promise<string | false>;

export type Serializer<T extends NotionBlock["type"]> = ReturnType<
  SerializerFactory<T>
>;

export type Serializers = {
  [K in NotionBlock["type"]]: Serializer<K>;
};
