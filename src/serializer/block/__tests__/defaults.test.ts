import { fromLink, fromRichText } from "../../utils.js";
import { audio, bookmark, bulletedListItem } from "../defaults.js";

describe("audio", () => {
  it("should return a markdown anchor tag when a valid block object is provided", () => {
    const block = {
      audio: {
        caption: [{ type: "text", annotations: {}, plain_text: "Audio Title" }],
        type: "external",
        external: { url: "https://www.audio.so" },
      },
    };
    const result = audio(block as any);
    const expected = `[${fromLink(block.audio as any).title}](${
      fromLink(block.audio as any).href
    })`;
    expect(result).toBe(expected);
  });

  it("should set title and href correctly in the markdown anchor tag", () => {
    const block = {
      audio: {
        caption: [],
        type: "file",
        file: { url: "https://www.audio.so/audio.mp3" },
      },
    };
    const result = audio(block as any);
    const { title, href } = fromLink(block.audio as any);
    const expected = `[${title}](${href})`;
    expect(result).toBe(expected);
  });
});

describe("bookmark", () => {
  it("should correctly serialize a block with both bookmark caption and url", () => {
    const block = {
      bookmark: {
        caption: [{ plain_text: "Google", annotations: {}, href: undefined }],
        url: "https://www.google.com",
      },
    };
    expect(bookmark(block as any)).toBe(
      `[${fromRichText(
        block.bookmark.caption as any,
      )}](https://www.google.com)`,
    );
  });

  it("should correctly serialize a block with no caption but with url", () => {
    const block = {
      bookmark: {
        caption: [],
        url: "https://www.google.com",
      },
    };
    expect(bookmark(block as any)).toBe(`[](https://www.google.com)`);
  });

  it("should correctly serialize a block with a caption but no url", () => {
    const block = {
      bookmark: {
        caption: [{ plain_text: "Google", annotations: {}, href: undefined }],
        url: "",
      },
    };
    expect(bookmark(block as any)).toBe(`[Google]()`);
  });

  it("should correctly serialize a block with neither caption nor url", () => {
    const block = {
      bookmark: {
        caption: [],
        url: "",
      },
    };
    expect(bookmark(block as any)).toBe(`[]()`);
  });

  it("should correctly serialize a block with annotated caption and url", () => {
    const block = {
      bookmark: {
        caption: [
          {
            plain_text: "Google",
            annotations: { bold: true },
            href: undefined,
          },
        ],
        url: "https://www.google.com",
      },
    };
    expect(bookmark(block as any)).toBe(`[**Google**](https://www.google.com)`);
  });
});

describe("bulletedListItem", () => {
  it("should prefix the rich text with a bullet symbol", () => {
    const block = {
      bulleted_list_item: {
        rich_text: [
          { plain_text: "Hello, World!", annotations: {}, href: undefined },
        ],
      },
    };
    expect(bulletedListItem(block as any)).toBe("- Hello, World!"); // Assuming that md.bullet uses '-' for bullets
  });

  it("should handle empty list items", () => {
    const block = { bulleted_list_item: { rich_text: [] } };
    expect(bulletedListItem(block as any)).toBe("- "); // Assuming that an empty bullet should still be output
  });

  it("should preserve formatting and annotations of the text", () => {
    const block = {
      bulleted_list_item: {
        rich_text: [
          {
            plain_text: "Hello, World!",
            annotations: { bold: true },
            href: "https://example.com",
          },
        ],
      },
    };
    expect(bulletedListItem(block as any)).toBe(
      "- [**Hello, World!**](https://example.com)",
    );
  });
});
