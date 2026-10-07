import { describe, expect, it } from "vitest";

import {
  addDays,
  daysBetween,
  formatGameDate,
  gameDate,
  isIsoDate,
  msUntilNextGameDay,
} from "./date";

describe("gameDate", () => {
  it("rolls over at midnight in São Paulo, not UTC", () => {
    // 02:59 UTC = 23:59 in São Paulo (UTC-3), still the previous day.
    expect(gameDate(new Date("2026-10-07T02:59:00Z"))).toBe("2026-10-06");
    expect(gameDate(new Date("2026-10-07T03:00:00Z"))).toBe("2026-10-07");
  });
});

describe("date helpers", () => {
  it("adds days across month and year boundaries", () => {
    expect(addDays("2026-12-31", 1)).toBe("2027-01-01");
    expect(addDays("2026-03-01", -1)).toBe("2026-02-28");
  });

  it("counts days between dates", () => {
    expect(daysBetween("2026-10-06", "2027-01-04")).toBe(90);
    expect(daysBetween("2026-10-06", "2026-10-05")).toBe(-1);
  });

  it("validates ISO dates", () => {
    expect(isIsoDate("2026-10-06")).toBe(true);
    expect(isIsoDate("2026-02-30")).toBe(false);
    expect(isIsoDate("06/10/2026")).toBe(false);
    expect(isIsoDate("../../etc")).toBe(false);
  });
});

describe("formatGameDate", () => {
  it("formats as dd/mm/yyyy", () => {
    expect(formatGameDate("2026-10-06")).toBe("06/10/2026");
  });
});

describe("msUntilNextGameDay", () => {
  it("counts down to midnight in São Paulo", () => {
    // 23:00 in São Paulo = 02:00 UTC next day.
    expect(msUntilNextGameDay(new Date("2026-10-07T02:00:00Z"))).toBe(60 * 60 * 1000);
    // Midnight exactly: a full day until the next one.
    expect(msUntilNextGameDay(new Date("2026-10-07T03:00:00Z"))).toBe(24 * 60 * 60 * 1000);
  });
});
