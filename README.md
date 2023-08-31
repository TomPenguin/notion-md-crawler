# notion-md-crawler

A library to recursively retrieve and serialize Notion pages with customization for machine learning applications.

[![NPM Version](https://badge.fury.io/js/notion-md-crawler.svg)](https://www.npmjs.com/package/notion-md-crawler)

## Features

- **Recursively Retrieve Pages**: Dig deep into Notion's hierarchical structure with ease.
- **Serialize to Markdown**: Seamlessly convert Notion pages to Markdown for easy use in machine learning and other.
- **Custom Serialization**: Adapt the serialization process to fit your specific machine learning needs.
- **User-Friendly**: Built with customization and usability in mind, and it's type safe.

## Installation

Using npm:

```bash
npm install notion-md-crawler
```

## Quick Start

```ts
import { Client } from "@notionhq/client";
import { crawler, pagesToString } from "notion-md-crawler";

// Need init notion client with credential.
const client = new Client({ auth: process.env.NOTION_API_KEY });

const crawl = crawler({ client });

const main = async () => {
  const pages = await crawl("********-****-****-****-************");
  const result = pagesToString(pages);
};

main();
```

## Custom Serialization

`notion-md-crawler` gives you the flexibility to customize the serialization logic for various Notion objects to cater to the unique requirements of your machine learning model or any other use case.

### Define your custom serializer

You can define your own custom serializer. You can also use the utility function for convenience.

```ts
import { crawler, serializer, Serializer } from "notion-md-crawler";

const embedSerializer: Serializer<"embed"> = (block) => {
  if (block.embed.url) return "";

  // You can use serializer utility.
  const caption = serializer.utils.richText(block.embed.caption);

  return `<figure>
  <iframe src="${block.embed.url}"></iframe>
  <figcaption>${caption}</figcaption>
</figure>`;
};

const serializerStrategy = {
  embed: embedSerializer,
};

const crawl = crawler({ client, serializerStrategy });
```

### Skip serialize

Returning `false` in the serializer allows you to skip the serialize of that block. This is useful when you want to omit unnecessary information.

```ts
const image: serializer.Serializer<"image"> = () => false;
const crawl = crawler({ client, serializerStrategy: { image } });
```

### Advanced: Use default serializer in custom serializer

If you want to customize serialization only in specific cases, you can use the default serializer in a custom serializer.

```ts
import { crawler, serializer } from "notion-md-crawler";

const defaultImageSerializer = serializer.defaults.image;

const customImageSerializer: serializer.Serializer<"image"> = (block) => {
  // Utility function to retrieve the link
  const { title, href } = serializer.utils.link(block.image);

  // If the image is from a specific domain, wrap it in a special div
  if (href.includes("special-domain.com")) {
    return `<div class="special-image">
      ${defaultImageSerializer(block)}
    </div>`;
  }

  // Use the default serializer for all other images
  return defaultImageSerializer(block);
};

const serializerStrategy = {
  image: customImageSerializer,
};

const crawl = crawler({ client, serializerStrategy });
```

## Issues and Feedback

For any issues, feedback, or feature requests, please file an issue on GitHub.

## License

MIT

---

Made with ❤️ by TomPenguin.
