import { describe, it, expect } from "vitest";
import path from "node:path";
import { safePath, cleanRel } from "../src/security";

const root = path.resolve("/data/shared");

describe("safePath", () => {
  it("resolves a normal relative path", () => {
    expect(safePath(root, "books/calc.pdf")).toBe(path.join(root, "books/calc.pdf"));
  });

  it("allows the root itself", () => {
    expect(safePath(root, "")).toBe(root);
  });

  it("rejects parent traversal", () => {
    expect(() => safePath(root, "../secrets")).toThrow();
    expect(() => safePath(root, "books/../../etc/passwd")).toThrow();
  });

  it("rejects absolute paths outside root", () => {
    expect(() => safePath(root, "/etc/passwd")).toThrow();
  });

  it("rejects null bytes", () => {
    expect(() => safePath(root, "a\0b")).toThrow();
  });
});

describe("cleanRel", () => {
  it("strips traversal and surrounding slashes", () => {
    expect(cleanRel("../../x")).toBe("x");
    expect(cleanRel("/books/")).toBe("books");
    expect(cleanRel("")).toBe("");
  });
});
