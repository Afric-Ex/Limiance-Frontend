const MONTHS = [
  "january",
  "february",
  "march",
  "april",
  "may",
  "june",
  "july",
  "august",
  "september",
  "october",
  "november",
  "december",
];

export const parseDate = (value: unknown): Date | null => {
  if (!value) return null;

  // Some endpoints return epoch timestamps (often as numeric strings). Go's
  // zero time (`-62135596800000`) and `0` mean "not set", so reject them.
  const isNumeric =
    typeof value === "number" ||
    (typeof value === "string" && /^-?\d+$/.test(value.trim()));
  if (isNumeric) {
    const numeric = Number(value);
    // Values below 1e9 cannot be epoch timestamps; `0` (and Go's negative
    // zero time) mean "not set", and short bare numbers must not reach
    // `new Date`, which would interpret them as years.
    if (!Number.isFinite(numeric) || numeric < 1_000_000_000) return null;
    // 10-digit values are seconds; 13-digit values are milliseconds.
    const ms = numeric < 1_000_000_000_000 ? numeric * 1000 : numeric;
    const epoch = new Date(ms);
    return Number.isNaN(epoch.getTime()) || epoch.getUTCFullYear() < 1970
      ? null
      : epoch;
  }

  const str = String(value).trim();
  const direct = new Date(str);
  if (!Number.isNaN(direct.getTime())) {
    return direct.getUTCFullYear() < 1970 ? null : direct;
  }
  // Handles Go-style backend format like "2026-10-15 13:39:35.123262 +0000 UTC"
  // (Safari rejects it in `new Date`, so parse the parts manually).
  const go = str.match(
    /^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2}):(\d{2})(?:\.(\d+))?\s*([+-])(\d{2}):?(\d{2})/
  );
  if (go) {
    const [, year, month, day, hour, minute, second, frac, sign, offHour, offMinute] = go;
    const ms = Number((frac ?? "0").slice(0, 3).padEnd(3, "0"));
    const utc = Date.UTC(+year, +month - 1, +day, +hour, +minute, +second, ms);
    const offset = (sign === "-" ? -1 : 1) * (Number(offHour) * 60 + Number(offMinute)) * 60000;
    return new Date(utc - offset);
  }
  // Handles backend format like "Monday 21 September 2026 12:29:06PM"
  const m = str.match(/^[A-Za-z]+,?\s+(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})\s+(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(AM|PM)?$/i);
  if (!m) return null;
  const [, day, monthName, year, hour, minute, second, ap] = m;
  const month = MONTHS.indexOf(monthName.toLowerCase());
  if (month === -1) return null;
  let h = Number(hour);
  if (ap) {
    const isPm = ap.toUpperCase() === "PM";
    if (isPm && h < 12) h += 12;
    if (!isPm && h === 12) h = 0;
  }
  return new Date(Number(year), month, Number(day), h, Number(minute), Number(second ?? 0));
};
