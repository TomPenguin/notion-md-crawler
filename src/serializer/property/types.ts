import { NotionProperty } from "../../notion.types.js";

type MakeOptional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

export type FactoryOptions = {
  urlMask: string | false;
};

export type SerializerFactory<T extends NotionProperty["type"]> = (
  options: FactoryOptions,
) => (
  name: string,
  property: MakeOptional<Extract<NotionProperty, { type: T }>, "id">,
) => string | false | Promise<string | false>;

export type Serializer<T extends NotionProperty["type"]> = ReturnType<
  SerializerFactory<T>
>;

export type Serializers = {
  [K in NotionProperty["type"]]: Serializer<K>;
};
