import { describe, it, expect } from "vitest";
import { fileExt, humanSize, isPreviewable } from "./format";

describe("humanSize", () => {
  it("formats common sizes", () => {
    expect(humanSize(0)).toBe("0 B");
    expect(humanSize(512)).toBe("512 B");
    expect(humanSize(1024)).toBe("1.0 K");
    expect(humanSize(26_800_000)).toBe("25.6 M");
  });
});

describe("fileExt", () => {
  it("extracts the lowercase extension", () => {
    expect(fileExt("Calculus.PDF")).toBe("pdf");
    expect(fileExt("archive.tar.gz")).toBe("gz");
  });
  it("returns empty for no extension or dotfiles", () => {
    expect(fileExt("README")).toBe("");
    expect(fileExt(".env")).toBe("");
    expect(fileExt("trailing.")).toBe("");
  });
});

describe("isPreviewable", () => {
  it("detects pdfs and images, case-insensitively", () => {
    expect(isPreviewable("a.pdf")).toBe("pdf");
    expect(isPreviewable("b.PNG")).toBe("image");
    expect(isPreviewable("c.jpeg")).toBe("image");
  });
  it("returns null for other types", () => {
    expect(isPreviewable("notes.txt")).toBeNull();
    expect(isPreviewable("archive.zip")).toBeNull();
  });
});
