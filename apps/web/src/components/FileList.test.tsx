import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { type ComponentProps } from "react";
import { MemoryRouter } from "react-router-dom";
import { FileList } from "./FileList";
import type { FileEntry } from "../api/client";

afterEach(cleanup);

const entries: FileEntry[] = [
  { name: "books", type: "dir", size: 0, mtime: 0 },
  { name: "notes.pdf", type: "file", size: 1024, mtime: 0 },
];

function renderList(props: Partial<ComponentProps<typeof FileList>> = {}) {
  return render(
    <MemoryRouter>
      <FileList
        entries={entries}
        loading={false}
        emptyLabel="empty"
        onOpenDir={() => {}}
        onPreview={() => {}}
        downloadUrl={(name) => `/api/download?path=${encodeURIComponent(name)}`}
        readUrl={(name) => `/read?path=${encodeURIComponent(name)}`}
        {...props}
      />
    </MemoryRouter>,
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

  it("offers a read link for pdfs", () => {
    renderList();
    const read = screen.getByRole("link", { name: /read notes\.pdf/i });
    expect(read.getAttribute("href")).toContain("/read?path=notes.pdf");
  });

  it("download links carry the download attribute", () => {
    renderList();
    const dl = screen.getByRole("link", { name: /download notes\.pdf/i });
    expect(dl.hasAttribute("download")).toBe(true);
  });

  it("opens an action sheet from the overflow button", () => {
    renderList();
    fireEvent.click(screen.getByRole("button", { name: /actions for notes\.pdf/i }));
    expect(screen.getByText("preview")).toBeTruthy();
    expect(screen.getByText("read")).toBeTruthy();
    expect(screen.getByText("download")).toBeTruthy();
  });

  it("opens the sheet when a non-previewable file row is clicked", () => {
    renderList({ entries: [{ name: "data.bin", type: "file", size: 10, mtime: 0 }] });
    fireEvent.click(screen.getByText("data.bin"));
    expect(screen.getByText("download")).toBeTruthy();
  });
});
