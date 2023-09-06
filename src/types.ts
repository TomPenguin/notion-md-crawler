import { Client } from "@notionhq/client";
import { NotionBlock, NotionPage } from "./notion.types.js";
import { BlockSerializers, PropertySerializers } from "./serializer/index.js";

export * from "./notion.types.js";

type Metadata<T extends Record<string, any> = {}> = {
  id: string;
  title: string;
  createdTime: string;
  lastEditedTime: string;
  parentId?: string;
} & T;
export type Page<T extends Record<string, any> = {}> = {
  metadata: Metadata<T>;
  properties: string[];
  lines: string[];
};

export type CrawlingFailure = {
  parentId?: string;
  reason: string;
};

export type CrawlingResult =
  | {
      id: string;
      success: true;
      page: Page;
    }
  | {
      id: string;
      success: false;
      failure: CrawlingFailure;
    };

export type OptionalSerializers = {
  block?: Partial<BlockSerializers>;
  property?: Partial<PropertySerializers>;
};

export type MetadataBuilder<T extends Record<string, any> = {}> = (options: {
  page: NotionPage | NotionBlock;
  title: string;
  properties?: string[];
  parent?: Page;
}) => Metadata<T> | Promise<Metadata<T>>;

export type CrawlerOptions = {
  client: Client;
  serializers?: OptionalSerializers;
  urlMask?: string | false;
  metadataBuilder?: MetadataBuilder;
  parent?: Page;
};

export type Crawler = (
  options: CrawlerOptions,
) => (rootPageId: string) => AsyncGenerator<CrawlingResult>;

export type DBCrawler = (
  options: CrawlerOptions,
) => (rootDatabaseId: string) => AsyncGenerator<CrawlingResult>;
