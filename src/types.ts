import { Client } from "@notionhq/client";
import { BlockSerializers, PropertySerializers } from "./serializer/index.js";

export * from "./notion.types.js";

export type Page = {
  metadata: {
    id: string;
    title: string;
    createdTime: string;
    lastEditedTime: string;
    parentId?: string;
  };
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

export type CrawlerOptions = {
  client: Client;
  serializers?: OptionalSerializers;
  parentId?: string;
};

export type Crawler = (
  options: CrawlerOptions,
) => (rootPageId: string) => AsyncGenerator<CrawlingResult>;

export type DBCrawler = (
  options: CrawlerOptions,
) => (rootDatabaseId: string) => AsyncGenerator<CrawlingResult>;
