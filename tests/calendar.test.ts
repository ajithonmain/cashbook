import { describe, expect, it } from "vitest";
import { addMonths, combineDayAndTime, monthGrid, startOfDay, toTimeValue, withYear } from "../src/lib/calendar";

describe("monthGrid", () => {
  it("is six Sunday-first weeks with the days in place", () => {
    const grid = monthGrid({ year: 2026, month: 10 });
    expect(grid).toHaveLength(42);
    expect(grid[0]).toBe(1);
    expect(grid[29]).toBe(30);
    expect(grid[30]).toBeNull();
  });
  it("pads the start of a month and knows leap years", () => {
    const grid = monthGrid({ year: 2024, month: 1 });
    expect(grid.slice(0, 5)).toEqual([null, null, null, null, 1]);
    expect(grid.filter((d) => d !== null)).toHaveLength(29);
  });
});

describe("month and year changes", () => {
  it("wraps across years", () => {
    expect(addMonths({ year: 2026, month: 0 }, -1)).toEqual({ year: 2025, month: 11 });
    expect(addMonths({ year: 2026, month: 11 }, 1)).toEqual({ year: 2027, month: 0 });
  });
  it("clamps 29 February", () => {
    expect(withYear(new Date(2024, 1, 29).getTime(), 2025)).toBe(new Date(2025, 1, 28).getTime());
  });
});

describe("day and time", () => {
  it("round-trips through the time input format", () => {
    const ts = new Date(2026, 10, 25, 15, 20).getTime();
    expect(toTimeValue(ts)).toBe("15:20");
    expect(combineDayAndTime(startOfDay(ts), toTimeValue(ts))).toBe(ts);
  });
  it("rejects a blank time", () => {
    expect(combineDayAndTime(0, "")).toBeNull();
  });
});
