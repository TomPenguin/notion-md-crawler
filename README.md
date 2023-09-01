# notion-md-crawler

A library to recursively retrieve and serialize Notion pages and databases with customization for machine learning applications.

[![NPM Version](https://badge.fury.io/js/notion-md-crawler.svg)](https://www.npmjs.com/package/notion-md-crawler)

## Features

- **Crawling Pages and Databases**: Dig deep into Notion's hierarchical structure with ease.
- **Serialize to Markdown**: Seamlessly convert Notion pages to Markdown for easy use in machine learning and other.
- **Custom Serialization**: Adapt the serialization process to fit your specific machine learning needs.
- **User-Friendly**: Built with customization and usability in mind, and it's type safe.

## Installation

[`@notionhq/client`](https://github.com/makenotion/notion-sdk-js) must also be installed.

Using npm:

```bash
npm install notion-md-crawler @notionhq/client
```

## Quick Start

> ⚠️ Note: Before getting started, create [an integration and find the token](https://www.notion.so/my-integrations). Details on methods can be found in [API section](https://github.com/souvikinator/notion-to-md#api)

```ts
import { Client } from "@notionhq/client";
import { crawler, pagesToString } from "notion-md-crawler";

// Need init notion client with credential.
const client = new Client({ auth: process.env.NOTION_API_KEY });

const crawl = crawler({ client });

const main = async () => {
  const rootPageId = "****";
  const pages = await crawl(rootPageId);
  const result = pagesToString(pages);
};

main();
```

## API

### crawler

#### Parameters:

- `options.client` (NotionClient): Notion client.
- `options.serializers` (Serializers, Optional): Used to customize the serializer.
- `rootPageId` (string): Id of the root page to be crawled.

#### Returns:

- `Promise<Pages>`: `Pages` object resulting from recursively parsing Notion pages.

### `Pages` Object

Key is page id, value is `Page` Object.

```ts
type Pages = <string, Page>;
```

### `Page` Object

```ts
type Page = {
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
```

## Use Metadata

Since `crawler` returns `Page` objects and `Page` object contain metadata, you can be used it for machine learning.

## Custom Serialization

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

## Supported Blocks and Database properties

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
| Google Maps        | ✅ Yes    |
| Google Drive       | ✅ Yes    |
| Tweet              | ✅ Yes    |
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

## Issues and Feedback

For any issues, feedback, or feature requests, please file an issue on GitHub.

## License

MIT

---

Made with ❤️ by TomPenguin.
