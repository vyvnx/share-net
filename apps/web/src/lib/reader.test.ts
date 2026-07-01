import { describe, it, expect } from "vitest";
import { fitWidthScale, zoomStep, clampPage, tapZone, swipeDir } from "./reader";

describe("fitWidthScale", () => {
  it("scales the page width to the viewport", () => {
    expect(fitWidthScale(500, 1000)).toBe(2);
    expect(fitWidthScale(1000, 500)).toBe(0.5);
  });
  it("guards against zero width", () => {
    expect(fitWidthScale(0, 1000)).toBe(1);
    expect(fitWidthScale(500, 0)).toBe(1);
  });
});

describe("zoomStep", () => {
  it("steps up and down by 20%", () => {
    expect(zoomStep(1, 1)).toBeCloseTo(1.2);
    expect(zoomStep(1, -1)).toBeCloseTo(0.8333, 3);
  });
  it("clamps to sane bounds", () => {
    expect(zoomStep(10, 1)).toBeLessThanOrEqual(8);
    expect(zoomStep(0.1, -1)).toBeGreaterThanOrEqual(0.2);
  });
});

describe("clampPage", () => {
  it("keeps the page within [1, total]", () => {
    expect(clampPage(0, 10)).toBe(1);
    expect(clampPage(11, 10)).toBe(10);
    expect(clampPage(5, 10)).toBe(5);
  });
  it("returns 1 when there are no pages yet", () => {
    expect(clampPage(5, 0)).toBe(1);
  });
});

describe("tapZone", () => {
  it("returns none when the pointer moved (a pan, not a tap)", () => {
    expect(tapZone(10, 1000, 30)).toBe("none");
  });
  it("left edge is prev, right edge is next", () => {
    expect(tapZone(100, 1000, 2)).toBe("prev");
    expect(tapZone(900, 1000, 2)).toBe("next");
  });
  it("the middle does not turn pages", () => {
    expect(tapZone(500, 1000, 0)).toBe("none");
  });
});

describe("swipeDir", () => {
  it("a rightward horizontal drag turns to the previous page", () => {
    expect(swipeDir(80, 5)).toBe("prev");
  });
  it("a leftward horizontal drag turns to the next page", () => {
    expect(swipeDir(-80, 5)).toBe("next");
  });
  it("ignores drags shorter than the threshold", () => {
    expect(swipeDir(20, 0)).toBe("none");
  });
  it("ignores mostly-vertical drags (a scroll, not a swipe)", () => {
    expect(swipeDir(50, 60)).toBe("none");
  });
});
