import { describe, expect, it } from "vitest";

import {
  createTimeWindowFromDuration,
  isStartBeforeEnd
} from "@/features/analysis/domain/analysis.time-window";

describe("analysis time window rules", () => {
  it("creates a window ending at the provided current time", () => {
    const timeWindow = createTimeWindowFromDuration(60 * 60 * 1_000, new Date("2026-05-13T12:00:00Z"));

    expect(new Date(timeWindow.end).toISOString()).toBe("2026-05-13T12:00:00.000Z");
    expect(new Date(timeWindow.start).toISOString()).toBe("2026-05-13T11:00:00.000Z");
  });

  it("validates start before end", () => {
    expect(isStartBeforeEnd("2026-05-13T11:00", "2026-05-13T12:00")).toBe(true);
    expect(isStartBeforeEnd("2026-05-13T12:00", "2026-05-13T11:00")).toBe(false);
  });
});
