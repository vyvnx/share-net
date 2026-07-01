import { describe, it, expect } from "vitest";
import { resolveOutline, type OutlineSource } from "./outline";

// a fake pdf where getPageIndex just echoes the ref's `num` as the page index.
function fakeDoc(outline: unknown): OutlineSource {
  return {
    getOutline: async () => outline as never,
    getDestination: async (id: string) =>
      id === "c1" ? [{ num: 2, gen: 0 }] : id === "c1a" ? [{ num: 3, gen: 0 }] : null,
    getPageIndex: async (ref: unknown) => (ref as { num: number }).num,
  };
}

describe("resolveOutline", () => {
  it("returns an empty list when there is no outline", async () => {
    expect(await resolveOutline(fakeDoc(null))).toEqual([]);
    expect(await resolveOutline(fakeDoc([]))).toEqual([]);
  });

  it("resolves named + explicit destinations to 1-based pages and tags depth", async () => {
    const items = await resolveOutline(
      fakeDoc([
        { title: "Ch 1", dest: "c1", items: [{ title: "1.1", dest: "c1a", items: [] }] },
        { title: "Ch 2", dest: [{ num: 5, gen: 0 }], items: [] },
      ]),
    );
    expect(items).toEqual([
      { title: "Ch 1", page: 3, depth: 0 },
      { title: "1.1", page: 4, depth: 1 },
      { title: "Ch 2", page: 6, depth: 0 },
    ]);
  });

  it("yields a null page for unresolvable destinations", async () => {
    const items = await resolveOutline(
      fakeDoc([
        { title: "No dest", dest: null, items: [] },
        { title: "Bad name", dest: "missing", items: [] },
      ]),
    );
    expect(items).toEqual([
      { title: "No dest", page: null, depth: 0 },
      { title: "Bad name", page: null, depth: 0 },
    ]);
  });

  it("treats a numeric destination target as a page index", async () => {
    const items = await resolveOutline(fakeDoc([{ title: "P", dest: [7], items: [] }]));
    expect(items).toEqual([{ title: "P", page: 8, depth: 0 }]);
  });
});
