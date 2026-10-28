/**
 * Central Date & Time Utility for DzBuild
 * Strictly enforces Africa/Algiers timezone (UTC+1) across the entire application.
 */

export const ALGIERS_TIMEZONE = "Africa/Algiers";

/**
 * Safely parses any date representation into a valid JavaScript Date object.
 * If a string lacks timezone information ("Z" or offset), it treats it as UTC.
 */
export const parseDate = (v: any): Date => {
  if (!v) return new Date();
  if (v instanceof Date) return isNaN(v.getTime()) ? new Date() : v;
  if (typeof v === "number") return new Date(v);
  
  // Firestore Timestamp object
  if (typeof v === "object") {
    if (typeof v.toDate === "function") {
      try {
        const d = v.toDate();
        if (d instanceof Date && !isNaN(d.getTime())) return d;
      } catch {}
    }
    if (typeof v.seconds === "number") {
      return new Date(v.seconds * 1000);
    }
    if (typeof v._seconds === "number") {
      return new Date(v._seconds * 1000);
    }
  }

  if (typeof v === "string") {
    let trimmed = v.trim();
    if (!trimmed) return new Date();

    // Numeric epoch timestamp string
    if (/^\d{10,13}$/.test(trimmed)) {
      return new Date(Number(trimmed));
    }

    // French format "DD/MM/YYYY" or "DD/MM/YYYY HH:mm" or "DD/MM/YYYY HH:mm:ss"
    if (/^\d{1,2}\/\d{1,2}\/\d{4}/.test(trimmed)) {
      const [dPart, tPart] = trimmed.split(" ");
      const [day, month, year] = dPart.split("/").map(Number);
      let [hh, mm, ss] = [0, 0, 0];
      if (tPart) {
        const parts = tPart.split(":").map(Number);
        hh = parts[0] || 0;
        mm = parts[1] || 0;
        ss = parts[2] || 0;
      }
      return new Date(Date.UTC(year, month - 1, day, hh, mm, ss));
    }

    // Replace slashes with hyphens in date part ("YYYY/MM/DD" -> "YYYY-MM-DD")
    trimmed = trimmed.replace(/\//g, "-");

    // If lacks "Z" and lacks "+HH:mm" / "-HH:mm" offset, treat as UTC
    if (!/(Z|[+-]\d{2}:?\d{2})$/i.test(trimmed)) {
      trimmed = trimmed.replace(" ", "T") + "Z";
    }

    const d = new Date(trimmed);
    return isNaN(d.getTime()) ? new Date() : d;
  }

  return new Date();
};

/**
 * Format full date and time in Africa/Algiers timezone
 * e.g., "18/10/2026 17:42:47" or "18/10/2026 17:42"
 */
export const formatDateTime = (v: any, seconds: boolean = true): string => {
  try {
    return new Intl.DateTimeFormat("fr-DZ", {
      timeZone: ALGIERS_TIMEZONE,
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      ...(seconds ? { second: "2-digit" } : {}),
      hour12: false,
    }).format(parseDate(v));
  } catch (err) {
    const d = parseDate(v);
    return d.toISOString();
  }
};

/**
 * Format date only in Africa/Algiers timezone
 * e.g., "18/10/2026"
 */
export const formatDate = (v: any): string => {
  try {
    return new Intl.DateTimeFormat("fr-DZ", {
      timeZone: ALGIERS_TIMEZONE,
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }).format(parseDate(v));
  } catch (err) {
    const d = parseDate(v);
    return d.toISOString().split("T")[0];
  }
};

/**
 * Format time only in Africa/Algiers timezone
 * e.g., "17:42:47" or "17:42"
 */
export const formatTime = (v: any, seconds: boolean = true): string => {
  try {
    return new Intl.DateTimeFormat("fr-DZ", {
      timeZone: ALGIERS_TIMEZONE,
      hour: "2-digit",
      minute: "2-digit",
      ...(seconds ? { second: "2-digit" } : {}),
      hour12: false,
    }).format(parseDate(v));
  } catch (err) {
    return "--:--";
  }
};

/**
 * Decomposes date into Africa/Algiers timezone components (year, month 1-12, day, hour 0-23, etc.)
 */
export const getAlgiersParts = (v: any): {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
  timestamp: number;
  formattedDate: string; // YYYY-MM-DD
  formattedTime: string; // HH:mm:ss
} => {
  const d = parseDate(v);
  const ts = d.getTime();

  try {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone: ALGIERS_TIMEZONE,
      year: "numeric",
      month: "numeric",
      day: "numeric",
      hour: "numeric",
      minute: "numeric",
      second: "numeric",
      hour12: false,
    }).formatToParts(d);

    const m = Object.fromEntries(parts.map((p) => [p.type, p.value]));
    const year = parseInt(m.year, 10) || d.getUTCFullYear();
    const month = parseInt(m.month, 10) || d.getUTCMonth() + 1;
    const day = parseInt(m.day, 10) || d.getUTCDate();
    const hour = parseInt(m.hour, 10) % 24 || 0;
    const minute = parseInt(m.minute, 10) || 0;
    const second = parseInt(m.second, 10) || 0;

    const pad = (n: number) => String(n).padStart(2, "0");
    const formattedDate = `${year}-${pad(month)}-${pad(day)}`;
    const formattedTime = `${pad(hour)}:${pad(minute)}:${pad(second)}`;

    return {
      year,
      month,
      day,
      hour,
      minute,
      second,
      timestamp: ts,
      formattedDate,
      formattedTime,
    };
  } catch {
    const pad = (n: number) => String(n).padStart(2, "0");
    // Fallback UTC+1
    const algiersDate = new Date(ts + 3600000);
    const year = algiersDate.getUTCFullYear();
    const month = algiersDate.getUTCMonth() + 1;
    const day = algiersDate.getUTCDate();
    const hour = algiersDate.getUTCHours();
    const minute = algiersDate.getUTCMinutes();
    const second = algiersDate.getUTCSeconds();

    return {
      year,
      month,
      day,
      hour,
      minute,
      second,
      timestamp: ts,
      formattedDate: `${year}-${pad(month)}-${pad(day)}`,
      formattedTime: `${pad(hour)}:${pad(minute)}:${pad(second)}`,
    };
  }
};

/**
 * Standard Order Date/Time formatter compatible with legacy formatOrderDateTime callers.
 * Returns dateStr ("18/10/2026"), timeStr ("17:42:47"), and timestamp in ms.
 */
export const formatOrderDateTime = (
  orderOrTimestamp: any
): { dateStr: string; timeStr: string; timestamp: number } => {
  if (!orderOrTimestamp) {
    const now = new Date();
    return {
      dateStr: formatDate(now),
      timeStr: formatTime(now, true),
      timestamp: now.getTime(),
    };
  }

  let targetValue = orderOrTimestamp;

  if (typeof orderOrTimestamp === "object" && !(orderOrTimestamp instanceof Date)) {
    // Check createdAt first, then date, then timestamp
    targetValue =
      orderOrTimestamp.createdAt ||
      orderOrTimestamp.created_at ||
      orderOrTimestamp.date ||
      orderOrTimestamp.timestamp ||
      orderOrTimestamp.updatedAt ||
      orderOrTimestamp;
  }

  const d = parseDate(targetValue);
  return {
    dateStr: formatDate(d),
    timeStr: formatTime(d, true),
    timestamp: d.getTime(),
  };
};

/**
 * Stable comparator to sort orders by creation date descending
 */
export const compareOrders = (a: any, b: any): number => {
  const tsA = formatOrderDateTime(a).timestamp;
  const tsB = formatOrderDateTime(b).timestamp;
  if (tsB !== tsA) {
    return tsB - tsA;
  }
  const idA = String(a.id || a.orderNumber || "");
  const idB = String(b.id || b.orderNumber || "");
  return idB.localeCompare(idA);
};
