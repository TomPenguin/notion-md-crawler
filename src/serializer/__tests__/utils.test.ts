import { describe, expect, it } from "vitest";
import {
  annotate,
  fromDate,
  fromLink,
  fromRichText,
  fromUser,
} from "../utils.js";

describe("annotate", () => {
  it.each`
    text      | annotations                            | expected
    ${"base"} | ${[false, false, false, false, false]} | ${"base"}
    ${"base"} | ${[true, false, false, false, false]}  | ${"`base`"}
    ${"base"} | ${[false, true, false, false, false]}  | ${"**base**"}
    ${"base"} | ${[false, false, true, false, false]}  | ${"_base_"}
    ${"base"} | ${[false, false, false, true, false]}  | ${"~~base~~"}
    ${"base"} | ${[false, false, false, false, true]}  | ${"<u>base</u>"}
    ${"base"} | ${[true, true, false, false, false]}   | ${"**`base`**"}
    ${"base"} | ${[true, false, true, false, false]}   | ${"_`base`_"}
    ${"base"} | ${[true, false, false, true, false]}   | ${"~~`base`~~"}
    ${"base"} | ${[true, false, false, false, true]}   | ${"<u>`base`</u>"}
    ${"base"} | ${[false, true, true, false, false]}   | ${"_**base**_"}
    ${"base"} | ${[false, true, false, true, false]}   | ${"~~**base**~~"}
    ${"base"} | ${[false, true, false, false, true]}   | ${"<u>**base**</u>"}
    ${"base"} | ${[false, false, true, true, false]}   | ${"~~_base_~~"}
    ${"base"} | ${[false, false, true, false, true]}   | ${"<u>_base_</u>"}
    ${"base"} | ${[false, false, false, true, true]}   | ${"<u>~~base~~</u>"}
    ${"base"} | ${[true, true, true, false, false]}    | ${"_**`base`**_"}
    ${"base"} | ${[true, true, false, true, false]}    | ${"~~**`base`**~~"}
    ${"base"} | ${[true, true, false, false, true]}    | ${"<u>**`base`**</u>"}
    ${"base"} | ${[true, false, true, true, false]}    | ${"~~_`base`_~~"}
    ${"base"} | ${[true, false, true, false, true]}    | ${"<u>_`base`_</u>"}
    ${"base"} | ${[true, false, false, true, true]}    | ${"<u>~~`base`~~</u>"}
    ${"base"} | ${[false, true, true, true, false]}    | ${"~~_**base**_~~"}
    ${"base"} | ${[false, true, true, false, true]}    | ${"<u>_**base**_</u>"}
    ${"base"} | ${[false, true, false, true, true]}    | ${"<u>~~**base**~~</u>"}
    ${"base"} | ${[false, false, true, true, true]}    | ${"<u>~~_base_~~</u>"}
    ${"base"} | ${[true, true, true, true, false]}     | ${"~~_**`base`**_~~"}
    ${"base"} | ${[true, true, true, false, true]}     | ${"<u>_**`base`**_</u>"}
    ${"base"} | ${[true, true, false, true, true]}     | ${"<u>~~**`base`**~~</u>"}
    ${"base"} | ${[true, false, true, true, true]}     | ${"<u>~~_`base`_~~</u>"}
    ${"base"} | ${[false, true, true, true, true]}     | ${"<u>~~_**base**_~~</u>"}
    ${"base"} | ${[true, true, true, true, true]}      | ${"<u>~~_**`base`**_~~</u>"}
  `("returns $expected", ({ text, annotations, expected }) => {
    const [code, bold, italic, strikethrough, underline] = annotations;
    const _annotations = { code, bold, italic, strikethrough, underline };
    expect(annotate(text, _annotations as any)).toBe(expected);
  });
});

describe("fromRichText", () => {
  it("should return an empty string for an empty richTextObject", () => {
    expect(fromRichText([])).toBe("");
  });

  it("should return the whitespace for plain_text consisting only of whitespace", () => {
    const input = [{ plain_text: "    ", annotations: {}, href: undefined }];
    expect(fromRichText(input as any)).toBe("    ");
  });

  it("should return the plain_text unmodified when no annotations are provided", () => {
    const input = [
      { plain_text: "Hello, World!", annotations: {}, href: undefined },
    ];
    expect(fromRichText(input as any)).toBe("Hello, World!");
  });

  it("should apply bold annotation correctly", () => {
    const input = [
      {
        plain_text: "Hello, World!",
        annotations: { bold: true },
        href: undefined,
      },
    ];
    expect(fromRichText(input as any)).toBe("**Hello, World!**");
  });

  it("should preserve leading and trailing whitespace", () => {
    const input = [
      { plain_text: "   Hello, World!   ", annotations: {}, href: undefined },
    ];
    expect(fromRichText(input as any)).toBe("   Hello, World!   ");
  });

  it("should return only the whitespace if plain_text is whitespace even with annotations/href", () => {
    const input = [
      {
        plain_text: "   ",
        annotations: { bold: true },
        href: "https://example.com",
      },
    ];
    expect(fromRichText(input as any)).toBe("   ");
  });

  it("should embed links correctly when href is provided", () => {
    const input = [
      {
        plain_text: "Hello, World!",
        annotations: {},
        href: "https://example.com",
      },
    ];
    expect(fromRichText(input as any)).toBe(
      "[Hello, World!](https://example.com)",
    );
  });

  it("should process and concatenate multiple richTextObject entries correctly", () => {
    const input = [
      { plain_text: "Hello,", annotations: { bold: true }, href: undefined },
      {
        plain_text: " World!",
        annotations: { italic: true },
        href: "https://example.com",
      },
    ];
    expect(fromRichText(input as any)).toBe(
      "**Hello,** [_World!_](https://example.com)",
    );
  });
});

describe("fromLink", () => {
  it("should return an object with title and href when a valid NotionLinkObject is provided", () => {
    const linkObject = {
      type: "external",
      caption: [{ type: "text", annotations: {}, plain_text: "Notion" }],
      external: { url: "https://www.notion.so" },
    };
    const result = fromLink(linkObject as any);
    expect(result).toEqual({ title: "Notion", href: "https://www.notion.so" });
  });

  it("should get href from external.url when type is external", () => {
    const linkObject = {
      type: "external",
      caption: [],
      external: { url: "https://www.external.so" },
    };
    const result = fromLink(linkObject as any);
    expect(result.href).toBe("https://www.external.so");
  });

  it("should get href from file.url when type is file", () => {
    const linkObject = {
      type: "file",
      caption: [],
      file: { url: "https://www.file.so/file.pdf" },
    };
    const result = fromLink(linkObject as any);
    expect(result.href).toBe("https://www.file.so/file.pdf");
  });

  it("should set title from caption when caption is present", () => {
    const linkObject = {
      type: "external",
      caption: [{ type: "text", annotations: {}, plain_text: "Caption" }],
      external: { url: "https://www.caption.so" },
    };
    const result = fromLink(linkObject as any);
    expect(result.title).toBe("Caption");
  });

  it("should set title from fileName when caption is absent and fileName is available", () => {
    const linkObject = {
      type: "file",
      caption: [],
      file: { url: "https://www.file.so/file.pdf" },
    };
    const result = fromLink(linkObject as any);
    expect(result.title).toBe("file.pdf");
  });

  it('should set title to default "link" when both caption and fileName are absent', () => {
    const linkObject = {
      type: "external",
      caption: [],
      external: { url: "https://www.nocaptionnofile.so" },
    };
    const result = fromLink(linkObject as any);
    expect(result.title).toBe("link");
  });
});

describe("fromUser", () => {
  it("should return '<empty>' when the function is given no user", () => {
    expect(fromUser({} as any)).toBe("<empty>");
  });

  it("should return the name as is when given a person user", () => {
    const user = { name: "John", type: "person" };
    expect(fromUser(user as any)).toBe("John");
  });

  it("should return the name with '[bot]' when given a bot user", () => {
    const user = { name: "BotName", type: "bot" };
    expect(fromUser(user as any)).toBe("BotName[bot]");
  });

  it("should return '<empty>' when the name property does not exist", () => {
    const user = { type: "person" };
    expect(fromUser(user as any)).toBe("<empty>");
  });

  it("should return '<empty>' when the type property does not exist", () => {
    const user = { name: "John" };
    expect(fromUser(user as any)).toBe("<empty>");
  });
});

describe("fromDate", () => {
  it('should return "<empty>" when date is null', () => {
    const date = null;
    expect(fromDate(date as any)).toBe("<empty>");
  });

  it("should return only the start date when the date object has no end date", () => {
    const date = { start: "2023-09-01" };
    expect(fromDate(date as any)).toBe("2023-09-01");
  });

  it("should return both start and end dates when the date object has both", () => {
    const date = { start: "2023-09-01", end: "2023-09-05" };
    expect(fromDate(date as any)).toBe(`(start)2023-09-01, (end): 2023-09-05`);
  });
});
