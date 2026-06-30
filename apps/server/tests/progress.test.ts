import { describe, it, expect, beforeEach, afterEach } from "vitest";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { openProgressStore, type ProgressStore } from "../src/store/progress";

let tmp: string;
let store: ProgressStore;

beforeEach(() => {
  tmp = fs.mkdtempSync(path.join(os.tmpdir(), "progress-"));
  store = openProgressStore(path.join(tmp, "progress.db"));
});

afterEach(() => {
  store.close();
  fs.rmSync(tmp, { recursive: true, force: true });
});

describe("ProgressStore", () => {
  it("returns undefined for an unknown key", () => {
    expect(store.get("books/x.pdf")).toBeUndefined();
  });

  it("stores and reads back a page", () => {
    store.set("books/x.pdf", 42);
    expect(store.get("books/x.pdf")).toBe(42);
  });

  it("overwrites the page on repeat set", () => {
    store.set("books/x.pdf", 10);
    store.set("books/x.pdf", 11);
    expect(store.get("books/x.pdf")).toBe(11);
  });

  it("persists across reopen", () => {
    store.set("books/x.pdf", 7);
    store.close();
    const again = openProgressStore(path.join(tmp, "progress.db"));
    expect(again.get("books/x.pdf")).toBe(7);
    again.close();
  });
});
