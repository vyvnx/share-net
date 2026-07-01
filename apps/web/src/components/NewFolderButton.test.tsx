import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup, waitFor } from "@testing-library/react";
import { NewFolderButton } from "./NewFolderButton";

afterEach(cleanup);

function open() {
  fireEvent.click(screen.getByLabelText("new folder"));
}

describe("NewFolderButton", () => {
  it("opens the input popover and creates a folder with the typed name", async () => {
    const onCreate = vi.fn().mockResolvedValue(undefined);
    render(<NewFolderButton onCreate={onCreate} />);

    open();
    fireEvent.change(screen.getByPlaceholderText("name or a/b/c"), {
      target: { value: "reports/2026" },
    });
    fireEvent.click(screen.getByText("create"));

    await waitFor(() => expect(onCreate).toHaveBeenCalledWith("reports/2026"));
    // popover closes on success.
    expect(screen.queryByPlaceholderText("name or a/b/c")).toBeNull();
  });

  it("trims the name and creates on Enter", async () => {
    const onCreate = vi.fn().mockResolvedValue(undefined);
    render(<NewFolderButton onCreate={onCreate} />);

    open();
    const input = screen.getByPlaceholderText("name or a/b/c");
    fireEvent.change(input, { target: { value: "  docs  " } });
    fireEvent.keyDown(input, { key: "Enter" });

    await waitFor(() => expect(onCreate).toHaveBeenCalledWith("docs"));
  });

  it("keeps the popover open and shows the error when creation fails", async () => {
    const onCreate = vi.fn().mockRejectedValue(new Error("already exists"));
    render(<NewFolderButton onCreate={onCreate} />);

    open();
    fireEvent.change(screen.getByPlaceholderText("name or a/b/c"), {
      target: { value: "dup" },
    });
    fireEvent.click(screen.getByText("create"));

    expect(await screen.findByText("already exists")).toBeTruthy();
    expect(screen.getByPlaceholderText("name or a/b/c")).toBeTruthy();
  });

  it("does not submit an empty name", () => {
    const onCreate = vi.fn();
    render(<NewFolderButton onCreate={onCreate} />);

    open();
    fireEvent.keyDown(screen.getByPlaceholderText("name or a/b/c"), { key: "Enter" });
    expect(onCreate).not.toHaveBeenCalled();
  });
});
