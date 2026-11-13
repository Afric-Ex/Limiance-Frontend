function pad(value: number) {
  return String(value).padStart(2, "0");
}

export function timestampSlug(date: Date) {
  const day = `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}`;
  const time = `${pad(date.getHours())}${pad(date.getMinutes())}${pad(date.getSeconds())}`;
  return `${day}-${time}`;
}

/** `limiance-{parts joined by -}-{timestamp}.png`, safe for any filesystem. */
export function snapshotFilename(parts: readonly string[], date: Date) {
  const safe = parts
    .map((part) => part.replace(/\//g, "").replace(/[^A-Za-z0-9-]+/g, "-").replace(/^-+|-+$/g, ""))
    .filter(Boolean)
    .join("-");
  return `limiance-${safe}-${timestampSlug(date)}.png`;
}
