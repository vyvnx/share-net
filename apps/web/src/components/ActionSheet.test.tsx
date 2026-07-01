import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { ActionSheet } from "./ActionSheet";

afterEach(cleanup);

describe("ActionSheet", () => {
  it("renders the title and each action label", () => {
    render(
      <ActionSheet
        title="notes.pdf"
        actions={[{ label: "preview" }, { label: "download", href: "/dl" }]}
        onClose={() => {}}
      />,
    );
    expect(screen.getByText("notes.pdf")).toBeTruthy();
    expect(screen.getByText("preview")).toBeTruthy();
    expect(screen.getByText("download")).toBeTruthy();
  });

  it("fires an action's onClick and then closes", () => {
    const onClick = vi.fn();
    const onClose = vi.fn();
    render(<ActionSheet title="t" actions={[{ label: "preview", onClick }]} onClose={onClose} />);
    fireEvent.click(screen.getByText("preview"));
    expect(onClick).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("closes when the backdrop is clicked", () => {
    const onClose = vi.fn();
    render(<ActionSheet title="t" actions={[{ label: "x" }]} onClose={onClose} />);
    fireEvent.click(screen.getByRole("dialog"));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("closes on Escape", () => {
    const onClose = vi.fn();
    render(<ActionSheet title="t" actions={[{ label: "x" }]} onClose={onClose} />);
    fireEvent.keyDown(window, { key: "Escape" });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("does not close when the inner panel is clicked", () => {
    const onClose = vi.fn();
    render(<ActionSheet title="panel" actions={[{ label: "x" }]} onClose={onClose} />);
    // the title lives inside the panel, whose onClick stops propagation, so the
    // click must not bubble up to the backdrop's onClose.
    fireEvent.click(screen.getByText("panel"));
    expect(onClose).not.toHaveBeenCalled();
  });
});
