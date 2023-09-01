import { Client } from "@notionhq/client";

export type PromiseResult<T extends (...args: any) => any> = Awaited<
  ReturnType<T>
>;

export type NotionClient = InstanceType<typeof Client>;

type NotionBlockListMethod = NotionClient["blocks"]["children"]["list"];
type NotionBlockListResponse = PromiseResult<NotionBlockListMethod>;
export type NotionBlockObjectResponse =
  NotionBlockListResponse["results"][number];

type ExtractBlockObjectResponse<T> = T extends { type: string } ? T : never;
export type NotionBlock = ExtractBlockObjectResponse<NotionBlockObjectResponse>;
export type ExtractBlock<T extends NotionBlock["type"]> = Extract<
  NotionBlock,
  { type: T }
>;

type NotionPageRetrieveMethod = NotionClient["pages"]["retrieve"];
type NotionPageResponse = PromiseResult<NotionPageRetrieveMethod>;
export type NotionPage = Extract<NotionPageResponse, { parent: any }>;

export type NotionProperty = NotionPage["properties"][string];
export type ExtractProperty<T extends NotionProperty["type"]> = Extract<
  NotionProperty,
  { type: T }
>;
