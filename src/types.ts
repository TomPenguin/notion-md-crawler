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

export type Pages = Record<string, Page>;

export type FailurePage = {
  id: string;
  parentId?: string;
  reason: string;
};

export type CrawlingResult = {
  pages: Pages;
  failures: FailurePage[];
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
) => (rootPageId: string) => Promise<CrawlingResult>;
