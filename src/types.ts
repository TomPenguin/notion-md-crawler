import { Client } from "@notionhq/client";
import { NotionBlock, NotionPage } from "./notion.types.js";
import { BlockSerializers, PropertySerializers } from "./serializer/index.js";

export * from "./notion.types.js";

export type Dictionary = Record<string, any>;

export type Metadata<T extends Dictionary = {}> = {
  id: string;
  title: string;
  createdTime: string;
  lastEditedTime: string;
  parentId?: string;
} & T;

export type Page<T extends Dictionary = {}> = {
  metadata: Metadata<T>;
  properties: string[];
  lines: string[];
};

export type CrawlingFailure = {
  parentId?: string;
  reason: string;
};

export type CrawlingResult<T extends Dictionary = {}> =
  | {
      id: string;
      success: true;
      page: Page<T>;
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

export type MetadataBuilderParams<T extends Dictionary = {}> = {
  page: NotionPage | NotionBlock;
  title: string;
  properties?: string[];
  parent?: Page<T>;
};

export type MetadataBuilder<T extends Dictionary = {}> = (
  params: MetadataBuilderParams<T>,
) => T | Promise<T>;

export type CrawlerOptions<T extends Dictionary = {}> = {
  client: Client;
  serializers?: OptionalSerializers;
  urlMask?: string | false;
  metadataBuilder?: MetadataBuilder<T>;
  parent?: Page<T>;
};

export type Crawler<T extends Dictionary = {}> = (
  options: CrawlerOptions<T>,
) => (rootPageId: string) => AsyncGenerator<CrawlingResult<T>>;

export type DBCrawler<T extends Dictionary = {}> = (
  options: CrawlerOptions<T>,
) => (rootDatabaseId: string) => AsyncGenerator<CrawlingResult<T>>;
