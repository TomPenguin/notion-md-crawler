import { fromLink } from "../../utils.js";
import { audio } from "../defaults.js";

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
