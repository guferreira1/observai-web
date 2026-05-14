import { formatDistanceToNow, format } from "date-fns";

export function formatDateTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "Invalid date";
  }

  return format(date, "yyyy-MM-dd HH:mm");
}

export function formatRelativeDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "Invalid date";
  }

  return formatDistanceToNow(date, { addSuffix: true });
}
