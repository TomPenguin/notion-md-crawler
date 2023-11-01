# notion-md-crawler

A library to recursively retrieve and serialize Notion pages and databases with customization for machine learning applications.

[![NPM Version](https://badge.fury.io/js/notion-md-crawler.svg)](https://www.npmjs.com/package/notion-md-crawler)

## 🌟 Features

- **🕷️ Crawling Pages and Databases**: Dig deep into Notion's hierarchical structure with ease.
- **📝 Serialize to Markdown**: Seamlessly convert Notion pages to Markdown for easy use in machine learning and other.
- **🛠️ Custom Serialization**: Adapt the serialization process to fit your specific machine learning needs.
- **⏳ Async Generator**: Yields results on a page-by-page basis, so even huge documents can be made memory efficient.

## 🛠️ Installation

[`@notionhq/client`](https://github.com/makenotion/notion-sdk-js) must also be installed.

Using npm 📦:

```bash
npm install notion-md-crawler @notionhq/client
```

Using yarn 🧶:

```bash
yarn add notion-md-crawler @notionhq/client
```

Using pnpm 🚀:

```bash
pnpm add notion-md-crawler @notionhq/client
```

## 🚀 Quick Start

> ⚠️ Note: Before getting started, create [an integration and find the token](https://www.notion.so/my-integrations). Details on methods can be found in [API section](https://github.com/souvikinator/notion-to-md#api)

Leveraging the power of JavaScript generators, this library is engineered to handle even the most extensive Notion documents with ease. It's designed to yield results page-by-page, allowing for efficient memory usage and real-time processing.

```ts
import { Client } from "@notionhq/client";
import { crawler, pageToString } from "notion-md-crawler";

// Need init notion client with credential.
const client = new Client({ auth: process.env.NOTION_API_KEY });

const crawl = crawler({ client });

const main = async () => {
  const rootPageId = "****";
  for await (const result of crawl(rootPageId)) {
    if (result.success) {
      const pageText = pageToString(result.page);
      console.log(pageText);
    }
  }
};

main();
```

## 🌐 API

### crawler

Recursively crawl the Notion Page. [`dbCrawler`](#dbcrawler) should be used if the Root is a Notion Database.

> Note: It tries to continue crawling as much as possible even if it fails to retrieve a particular Notion Page.

#### Parameters:

- `options` ([`CrawlerOptions`](#optionscrawleroptions)): Crawler options.
- `rootPageId` (string): Id of the root page to be crawled.

#### Returns:

- `AsyncGenerator<CrawlingResult>`: Crawling results with failed information.

### dbCrawler

Recursively crawl the Notion Database. [`crawler`](#crawler) should be used if the Root is a Notion Page.

#### Parameters:

- `options` ([`CrawlerOptions`](#crawleroptions)): Crawler options.
- `rootDatabaseId` (string): Id of the root page to be crawled.

#### Returns:

- `AsyncGenerator<CrawlingResult>`: Crawling results with failed information.

### CrawlerOptions

| Option                   | Description                                                                                         | Type                                          | Default     |
| ------------------------ | --------------------------------------------------------------------------------------------------- | --------------------------------------------- | ----------- |
| `client`                 | Instance of Notion Client. Set up an instance of the Client class imported from `@notionhq/client`. | Notion Client                                 | -           |
| `serializers?`           | Used for custom serialization of Block and Property objects.                                        | Object                                        | `undefined` |
| `serializers?.block?`    | Map of Notion block type and [`BlockSerializer`](#blockserializer).                                 | [`BlockSerializers`](#blockserializers)       | `undefined` |
| `serializers?.property?` | Map of Notion Property Type and [`PropertySerializer`](#propertyserializer).                        | [`PropertySerializers`](#propertyserializers) | `undefined` |
| `metadataBuilder?`       | The metadata generation process can be customize.                                                   | [`MetadataBuilder`](#metadatabuilder)         | `undefined` |
| `urlMask?`               | If specified, the url is masked with the string.                                                    | string \| false                               | `false`     |
| `skipPageIds?`           | List of page Ids to skip crawling (also skips descendant pages)                                     | string[]                                      | `undefined` |

#### `BlockSerializers`

Map with Notion block type (like `"heading_1"`, `"to_do"`, `"code"`) as key and [`BlockSerializer`](#blockserializer) as value.

#### `BlockSerializer`

BlockSerializer that takes a Notion block object as argument. Returning `false` will skip serialization of that Notion block.

**[Type]**

```ts
type BlockSerializer = (
  block: NotionBlock,
) => string | false | Promise<string | false>;
```

#### `PropertySerializers`

Map with Notion Property Type (like `"heading_1"`, `"to_do"`, `"code"`) as key and [`PropertySerializer`](#propertyserializer) as value.

#### `PropertySerializer`

PropertySerializer that takes a Notion property object as argument. Returning `false` will skip serialization of that Notion property.

**[Type]**

```ts
type PropertySerializer = (
  name: string,
  block: NotionBlock,
) => string | false | Promise<string | false>;
```

#### `MetadataBuilder`

Retrieving metadata is sometimes very important, but the information you want to retrieve will vary depending on the context. `MetadataBuilder` allows you to customize it according to your use case.

**[Example]**

```ts
import { crawler, MetadataBuilderParams } from "notion-md-crawler";

const getUrl = (id: string) => `https://www.notion.so/${id.replace(/-/g, "")}`;

const metadataBuilder = ({ page }: MetadataBuilderParams) => ({
  url: getUrl(page.metadata.id),
});

const crawl = crawler({ client, metadataBuilder });

for await (const result of crawl("notion-page-id")) {
  if (result.success) {
    console.log(result.page.metadata.url); // "https://www.notion.so/********"
  }
}
```

## 📊 Use Metadata

Since `crawler` returns `Page` objects and `Page` object contain metadata, you can be used it for machine learning.

## 🛠️ Custom Serialization

`notion-md-crawler` gives you the flexibility to customize the serialization logic for various Notion objects to cater to the unique requirements of your machine learning model or any other use case.

### Define your custom serializer

You can define your own custom serializer. You can also use the utility function for convenience.

```ts
import { BlockSerializer, crawler, serializer } from "notion-md-crawler";

const customEmbedSerializer: BlockSerializer<"embed"> = (block) => {
  if (block.embed.url) return "";

  // You can use serializer utility.
  const caption = serializer.utils.fromRichText(block.embed.caption);

  return `<figure>
  <iframe src="${block.embed.url}"></iframe>
  <figcaption>${caption}</figcaption>
</figure>`;
};

const serializers = {
  block: {
    embed: customEmbedSerializer,
  },
};

const crawl = crawler({ client, serializers });
```

### Skip serialize

Returning `false` in the serializer allows you to skip the serialize of that block. This is useful when you want to omit unnecessary information.

```ts
const image: BlockSerializer<"image"> = () => false;
const crawl = crawler({ client, serializers: { block: { image } } });
```

### Advanced: Use default serializer in custom serializer

If you want to customize serialization only in specific cases, you can use the default serializer in a custom serializer.

```ts
import { BlockSerializer, crawler, serializer } from "notion-md-crawler";

const defaultImageSerializer = serializer.block.defaults.image;

const customImageSerializer: BlockSerializer<"image"> = (block) => {
  // Utility function to retrieve the link
  const { title, href } = serializer.utils.fromLink(block.image);

  // If the image is from a specific domain, wrap it in a special div
  if (href.includes("special-domain.com")) {
    return `<div class="special-image">
      ${defaultImageSerializer(block)}
    </div>`;
  }

  // Use the default serializer for all other images
  return defaultImageSerializer(block);
};

const serializers = {
  block: {
    image: customImageSerializer,
  },
};

const crawl = crawler({ client, serializers });
```

## 🔍 Supported Blocks and Database properties

### Blocks

| Block Type         | Supported |
| ------------------ | --------- |
| Text               | ✅ Yes    |
| Bookmark           | ✅ Yes    |
| Bulleted List      | ✅ Yes    |
| Numbered List      | ✅ Yes    |
| Heading 1          | ✅ Yes    |
| Heading 2          | ✅ Yes    |
| Heading 3          | ✅ Yes    |
| Quote              | ✅ Yes    |
| Callout            | ✅ Yes    |
| Equation (block)   | ✅ Yes    |
| Equation (inline)  | ✅ Yes    |
| Todos (checkboxes) | ✅ Yes    |
| Table Of Contents  | ✅ Yes    |
| Divider            | ✅ Yes    |
| Column             | ✅ Yes    |
| Column List        | ✅ Yes    |
| Toggle             | ✅ Yes    |
| Image              | ✅ Yes    |
| Embed              | ✅ Yes    |
| Video              | ✅ Yes    |
| Figma              | ✅ Yes    |
| PDF                | ✅ Yes    |
| Audio              | ✅ Yes    |
| File               | ✅ Yes    |
| Link               | ✅ Yes    |
| Page Link          | ✅ Yes    |
| External Page Link | ✅ Yes    |
| Code (block)       | ✅ Yes    |
| Code (inline)      | ✅ Yes    |

### Database Properties

| Property Type    | Supported |
| ---------------- | --------- |
| Checkbox         | ✅ Yes    |
| Created By       | ✅ Yes    |
| Created Time     | ✅ Yes    |
| Date             | ✅ Yes    |
| Email            | ✅ Yes    |
| Files            | ✅ Yes    |
| Formula          | ✅ Yes    |
| Last Edited By   | ✅ Yes    |
| Last Edited Time | ✅ Yes    |
| Multi Select     | ✅ Yes    |
| Number           | ✅ Yes    |
| People           | ✅ Yes    |
| Phone Number     | ✅ Yes    |
| Relation         | ✅ Yes    |
| Rich Text        | ✅ Yes    |
| Rollup           | ✅ Yes    |
| Select           | ✅ Yes    |
| Status           | ✅ Yes    |
| Title            | ✅ Yes    |
| Unique Id        | ✅ Yes    |
| Url              | ✅ Yes    |
| Verification     | □ No      |

## 💬 Issues and Feedback

For any issues, feedback, or feature requests, please file an issue on GitHub.

## 📜 License

MIT

---

Made with ❤️ by TomPenguin.
