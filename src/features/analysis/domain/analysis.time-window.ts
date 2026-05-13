export type TimeWindowPresetId = "last-15-minutes" | "last-hour" | "last-6-hours" | "last-24-hours";

export type TimeWindowValues = {
  start: string;
  end: string;
};

export type TimeWindowPreset = {
  id: TimeWindowPresetId;
  label: string;
  description: string;
  durationMs: number;
};

export const timeWindowPresets: TimeWindowPreset[] = [
  {
    id: "last-15-minutes",
    label: "15 min",
    description: "Recent spike",
    durationMs: 15 * 60 * 1_000
  },
  {
    id: "last-hour",
    label: "1 hour",
    description: "Default incident window",
    durationMs: 60 * 60 * 1_000
  },
  {
    id: "last-6-hours",
    label: "6 hours",
    description: "Extended degradation",
    durationMs: 6 * 60 * 60 * 1_000
  },
  {
    id: "last-24-hours",
    label: "24 hours",
    description: "Daily regression scan",
    durationMs: 24 * 60 * 60 * 1_000
  }
];

export function toDateTimeLocal(date: Date) {
  const timezoneOffsetMs = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - timezoneOffsetMs).toISOString().slice(0, 16);
}

export function createTimeWindowFromDuration(durationMs: number, now = new Date()): TimeWindowValues {
  return {
    start: toDateTimeLocal(new Date(now.getTime() - durationMs)),
    end: toDateTimeLocal(now)
  };
}

export function createDefaultTimeWindow(now = new Date()) {
  return createTimeWindowFromDuration(60 * 60 * 1_000, now);
}

export function isStartBeforeEnd(start: string, end: string) {
  return new Date(start).getTime() < new Date(end).getTime();
}

export function toIsoString(value: string) {
  return new Date(value).toISOString();
}
