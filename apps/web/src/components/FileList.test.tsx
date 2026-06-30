import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { type ComponentProps } from "react";
import { FileList } from "./FileList";
import type { FileEntry } from "../api/client";

afterEach(cleanup);

const entries: FileEntry[] = [
  { name: "books", type: "dir", size: 0, mtime: 0 },
  { name: "notes.pdf", type: "file", size: 1024, mtime: 0 },
];

function renderList(props: Partial<ComponentProps<typeof FileList>> = {}) {
  return render(
    <FileList
      entries={entries}
      loading={false}
      emptyLabel="empty"
      onOpenDir={() => {}}
      onPreview={() => {}}
      downloadUrl={() => "#"}
      {...props}
    />,
  );
}

describe("FileList", () => {
  it("renders entries with sizes", () => {
    renderList();
    expect(screen.getByText("books/")).toBeTruthy();
    expect(screen.getByText("notes.pdf")).toBeTruthy();
    expect(screen.getByText("1.0 K")).toBeTruthy();
  });

  it("opens a directory when its row is clicked", () => {
    const onOpenDir = vi.fn();
    renderList({ onOpenDir });
    fireEvent.click(screen.getByText("books/"));
    expect(onOpenDir).toHaveBeenCalledWith("books");
  });

  it("previews a pdf when its row is clicked", () => {
    const onPreview = vi.fn();
    renderList({ onPreview });
    fireEvent.click(screen.getByText("notes.pdf"));
    expect(onPreview).toHaveBeenCalledTimes(1);
  });

  it("shows the empty label when there are no entries", () => {
    renderList({ entries: [], emptyLabel: "empty folder" });
    expect(screen.getByText("empty folder")).toBeTruthy();
  });
});
