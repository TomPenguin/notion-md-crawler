import { annotate } from "../utils.js";

describe("annotate", () => {
  test.each([
    [
      "base text",
      {
        code: true,
        bold: false,
        italic: false,
        strikethrough: false,
        underline: false,
      },
      "`base text`",
    ],
  ])("Must be correctly serialized", (text, annotations: any, answer) => {
    expect(annotate(text, annotations)).toBe(answer);
  });
});
