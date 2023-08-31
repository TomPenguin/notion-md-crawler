import { Client } from "@notionhq/client";

export type NotionClient = InstanceType<typeof Client>;

type NotionBlockListMethod = NotionClient["blocks"]["children"]["list"];
type NotionBlockListResponse = Awaited<ReturnType<NotionBlockListMethod>>;
export type NotionBlockObjectResponse =
  NotionBlockListResponse["results"][number];
type ExtractBlockObjectResponse<T> = T extends { type: string } ? T : never;
export type NotionBlock = ExtractBlockObjectResponse<NotionBlockObjectResponse>;
export type ExtractBlock<T extends NotionBlock["type"]> = Extract<
  NotionBlock,
  { type: T }
>;
