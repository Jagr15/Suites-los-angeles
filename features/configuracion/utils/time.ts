import { parseAbsoluteToLocal } from "@internationalized/date";

function isBlank(value?: string | null) {
  return !value || !value.trim();
}

function normalizeToIso(value: string) {
  const trimmed = value.trim();
  if (/^\d{2}:\d{2}$/.test(trimmed)) {
    return `1970-01-01T${trimmed}:00.000Z`;
  }
  if (/^\d{2}:\d{2}:\d{2}$/.test(trimmed)) {
    return `1970-01-01T${trimmed}.000Z`;
  }
  return trimmed;
}

export function parseTimeToCalendarDate(value?: string | null) {
  if (isBlank(value)) return null;
  const iso = normalizeToIso(value!);
  try {
    return parseAbsoluteToLocal(iso);
  } catch {
    return null;
  }
}

export function toHHmm(value: unknown) {
  if (!value || typeof (value as any).toDate !== "function") return undefined;
  const date = (value as any).toDate();
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) return undefined;
  const hh = String(date.getHours()).padStart(2, "0");
  const mm = String(date.getMinutes()).padStart(2, "0");
  return `${hh}:${mm}`;
}

