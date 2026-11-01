var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/lib/date.ts
var ALGIERS_TIMEZONE, parseDate, formatDateTime, formatDate, formatTime, getAlgiersParts, formatOrderDateTime;
var init_date = __esm({
  "src/lib/date.ts"() {
    ALGIERS_TIMEZONE = "Africa/Algiers";
    parseDate = (v) => {
      if (!v) return /* @__PURE__ */ new Date();
      if (v instanceof Date) return isNaN(v.getTime()) ? /* @__PURE__ */ new Date() : v;
      if (typeof v === "number") return new Date(v);
      if (typeof v === "object") {
        if (typeof v.toDate === "function") {
          try {
            const d = v.toDate();
            if (d instanceof Date && !isNaN(d.getTime())) return d;
          } catch {
          }
        }
        if (typeof v.seconds === "number") {
          return new Date(v.seconds * 1e3);
        }
        if (typeof v._seconds === "number") {
          return new Date(v._seconds * 1e3);
        }
      }
      if (typeof v === "string") {
        let trimmed = v.trim();
        if (!trimmed) return /* @__PURE__ */ new Date();
        if (/^\d{10,13}$/.test(trimmed)) {
          return new Date(Number(trimmed));
        }
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
        trimmed = trimmed.replace(/\//g, "-");
        if (!/(Z|[+-]\d{2}:?\d{2})$/i.test(trimmed)) {
          trimmed = trimmed.replace(" ", "T") + "Z";
        }
        const d = new Date(trimmed);
        return isNaN(d.getTime()) ? /* @__PURE__ */ new Date() : d;
      }
      return /* @__PURE__ */ new Date();
    };
    formatDateTime = (v, seconds = true) => {
      try {
        return new Intl.DateTimeFormat("fr-DZ", {
          timeZone: ALGIERS_TIMEZONE,
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
          ...seconds ? { second: "2-digit" } : {},
          hour12: false
        }).format(parseDate(v));
      } catch (err) {
        const d = parseDate(v);
        return d.toISOString();
      }
    };
    formatDate = (v) => {
      try {
        return new Intl.DateTimeFormat("fr-DZ", {
          timeZone: ALGIERS_TIMEZONE,
          day: "2-digit",
          month: "2-digit",
          year: "numeric"
        }).format(parseDate(v));
      } catch (err) {
        const d = parseDate(v);
        return d.toISOString().split("T")[0];
      }
    };
    formatTime = (v, seconds = true) => {
      try {
        return new Intl.DateTimeFormat("fr-DZ", {
          timeZone: ALGIERS_TIMEZONE,
          hour: "2-digit",
          minute: "2-digit",
          ...seconds ? { second: "2-digit" } : {},
          hour12: false
        }).format(parseDate(v));
      } catch (err) {
        return "--:--";
      }
    };
    getAlgiersParts = (v) => {
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
          hour12: false
        }).formatToParts(d);
        const m = Object.fromEntries(parts.map((p) => [p.type, p.value]));
        const year = parseInt(m.year, 10) || d.getUTCFullYear();
        const month = parseInt(m.month, 10) || d.getUTCMonth() + 1;
        const day = parseInt(m.day, 10) || d.getUTCDate();
        const hour = parseInt(m.hour, 10) % 24 || 0;
        const minute = parseInt(m.minute, 10) || 0;
        const second = parseInt(m.second, 10) || 0;
        const pad = (n) => String(n).padStart(2, "0");
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
          formattedTime
        };
      } catch {
        const pad = (n) => String(n).padStart(2, "0");
        const algiersDate = new Date(ts + 36e5);
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
          formattedTime: `${pad(hour)}:${pad(minute)}:${pad(second)}`
        };
      }
    };
    formatOrderDateTime = (orderOrTimestamp) => {
      if (!orderOrTimestamp) {
        const now = /* @__PURE__ */ new Date();
        return {
          dateStr: formatDate(now),
          timeStr: formatTime(now, true),
          timestamp: now.getTime()
        };
      }
      let targetValue = orderOrTimestamp;
      if (typeof orderOrTimestamp === "object" && !(orderOrTimestamp instanceof Date)) {
        targetValue = orderOrTimestamp.createdAt || orderOrTimestamp.created_at || orderOrTimestamp.date || orderOrTimestamp.timestamp || orderOrTimestamp.updatedAt || orderOrTimestamp;
      }
      const d = parseDate(targetValue);
      return {
        dateStr: formatDate(d),
        timeStr: formatTime(d, true),
        timestamp: d.getTime()
      };
    };
  }
});

// src/data/landingData.ts
var ALGERIAN_WILAYAS;
var init_landingData = __esm({
  "src/data/landingData.ts"() {
    ALGERIAN_WILAYAS = [
      { code: 1, name: "01 - Adrar", arName: "\u0623\u062F\u0631\u0627\u0631", homeDeliveryPrice: 900, deskDeliveryPrice: 600 },
      { code: 2, name: "02 - Chlef", arName: "\u0627\u0644\u0634\u0644\u0641", homeDeliveryPrice: 600, deskDeliveryPrice: 400 },
      { code: 3, name: "03 - Laghouat", arName: "\u0627\u0644\u0623\u063A\u0648\u0627\u0637", homeDeliveryPrice: 700, deskDeliveryPrice: 500 },
      { code: 4, name: "04 - Oum El Bouaghi", arName: "\u0623\u0645 \u0627\u0644\u0628\u0648\u0627\u0642\u064A", homeDeliveryPrice: 600, deskDeliveryPrice: 400 },
      { code: 5, name: "05 - Batna", arName: "\u0628\u0627\u062A\u0646\u0629", homeDeliveryPrice: 600, deskDeliveryPrice: 400 },
      { code: 6, name: "06 - B\xE9ja\xEFa", arName: "\u0628\u062C\u0627\u064A\u0629", homeDeliveryPrice: 600, deskDeliveryPrice: 400 },
      { code: 7, name: "07 - Biskra", arName: "\u0628\u0633\u0643\u0631\u0629", homeDeliveryPrice: 700, deskDeliveryPrice: 500 },
      { code: 8, name: "08 - B\xE9char", arName: "\u0628\u0634\u0627\u0631", homeDeliveryPrice: 900, deskDeliveryPrice: 600 },
      { code: 9, name: "09 - Blida", arName: "\u0627\u0644\u0628\u0644\u064A\u062F\u0629", homeDeliveryPrice: 500, deskDeliveryPrice: 350 },
      { code: 10, name: "10 - Bouira", arName: "\u0627\u0644\u0628\u0648\u064A\u0631\u0629", homeDeliveryPrice: 600, deskDeliveryPrice: 400 },
      { code: 11, name: "11 - Tamanrasset", arName: "\u062A\u0645\u0646\u0631\u0627\u0633\u062A", homeDeliveryPrice: 1200, deskDeliveryPrice: 800 },
      { code: 12, name: "12 - T\xE9bessa", arName: "\u062A\u0628\u0633\u0629", homeDeliveryPrice: 650, deskDeliveryPrice: 450 },
      { code: 13, name: "13 - Tlemcen", arName: "\u062A\u0644\u0645\u0633\u0627\u0646", homeDeliveryPrice: 600, deskDeliveryPrice: 400 },
      { code: 14, name: "14 - Tiaret", arName: "\u062A\u064A\u0627\u0631\u062A", homeDeliveryPrice: 650, deskDeliveryPrice: 450 },
      { code: 15, name: "15 - Tizi Ouzou", arName: "\u062A\u064A\u0632\u064A \u0648\u0632\u0648", homeDeliveryPrice: 600, deskDeliveryPrice: 400 },
      { code: 16, name: "16 - Alger", arName: "\u0627\u0644\u062C\u0632\u0627\u0626\u0631 \u0627\u0644\u0639\u0627\u0635\u0645\u0629", homeDeliveryPrice: 400, deskDeliveryPrice: 300 },
      { code: 17, name: "17 - Djelfa", arName: "\u0627\u0644\u062C\u0644\u0641\u0629", homeDeliveryPrice: 700, deskDeliveryPrice: 500 },
      { code: 18, name: "18 - Jijel", arName: "\u062C\u064A\u062C\u0644", homeDeliveryPrice: 600, deskDeliveryPrice: 400 },
      { code: 19, name: "19 - S\xE9tif", arName: "\u0633\u0637\u064A\u0641", homeDeliveryPrice: 600, deskDeliveryPrice: 400 },
      { code: 20, name: "20 - Sa\xEFda", arName: "\u0633\u0639\u064A\u062F\u0629", homeDeliveryPrice: 650, deskDeliveryPrice: 450 },
      { code: 21, name: "21 - Skikda", arName: "\u0633\u0643\u064A\u0643\u062F\u0629", homeDeliveryPrice: 600, deskDeliveryPrice: 400 },
      { code: 22, name: "22 - Sidi Bel Abb\xE8s", arName: "\u0633\u064A\u062F\u064A \u0628\u0644\u0639\u0628\u0627\u0633", homeDeliveryPrice: 600, deskDeliveryPrice: 400 },
      { code: 23, name: "23 - Annaba", arName: "\u0639\u0646\u0627\u0628\u0629", homeDeliveryPrice: 600, deskDeliveryPrice: 400 },
      { code: 24, name: "24 - Guelma", arName: "\u0642\u0627\u0644\u0645\u0629", homeDeliveryPrice: 600, deskDeliveryPrice: 400 },
      { code: 25, name: "25 - Constantine", arName: "\u0642\u0633\u0646\u0637\u064A\u0646\u0629", homeDeliveryPrice: 600, deskDeliveryPrice: 400 },
      { code: 26, name: "26 - M\xE9d\xE9a", arName: "\u0627\u0644\u0645\u062F\u064A\u0629", homeDeliveryPrice: 550, deskDeliveryPrice: 350 },
      { code: 27, name: "27 - Mostaganem", arName: "\u0645\u0633\u062A\u063A\u0627\u0646\u0645", homeDeliveryPrice: 600, deskDeliveryPrice: 400 },
      { code: 28, name: "28 - M'Sila", arName: "\u0627\u0644\u0645\u0633\u064A\u0644\u0629", homeDeliveryPrice: 650, deskDeliveryPrice: 450 },
      { code: 29, name: "29 - Mascara", arName: "\u0645\u0639\u0633\u0643\u0631", homeDeliveryPrice: 600, deskDeliveryPrice: 400 },
      { code: 30, name: "30 - Ouargla", arName: "\u0648\u0631\u0642\u0644\u0629", homeDeliveryPrice: 750, deskDeliveryPrice: 500 },
      { code: 31, name: "31 - Oran", arName: "\u0648\u0647\u0631\u0627\u0646", homeDeliveryPrice: 500, deskDeliveryPrice: 350 },
      { code: 32, name: "32 - El Bayadh", arName: "\u0627\u0644\u0628\u064A\u0636", homeDeliveryPrice: 750, deskDeliveryPrice: 500 },
      { code: 33, name: "33 - Illizi", arName: "\u0625\u0644\u064A\u0632\u064A", homeDeliveryPrice: 1200, deskDeliveryPrice: 800 },
      { code: 34, name: "34 - Bordj Bou Arreridj", arName: "\u0628\u0631\u062C \u0628\u0648\u0639\u0631\u064A\u0631\u064A\u062C", homeDeliveryPrice: 600, deskDeliveryPrice: 400 },
      { code: 35, name: "35 - Boumerd\xE8s", arName: "\u0628\u0648\u0645\u0631\u062F\u0627\u0633", homeDeliveryPrice: 450, deskDeliveryPrice: 300 },
      { code: 36, name: "36 - El Tarf", arName: "\u0627\u0644\u0637\u0627\u0631\u0641", homeDeliveryPrice: 650, deskDeliveryPrice: 450 },
      { code: 37, name: "37 - Tindouf", arName: "\u062A\u0646\u062F\u0648\u0641", homeDeliveryPrice: 1200, deskDeliveryPrice: 800 },
      { code: 38, name: "38 - Tissemsilt", arName: "\u062A\u064A\u0633\u0645\u0633\u064A\u0644\u062A", homeDeliveryPrice: 650, deskDeliveryPrice: 450 },
      { code: 39, name: "39 - El Oued", arName: "\u0627\u0644\u0648\u0627\u062F\u064A", homeDeliveryPrice: 750, deskDeliveryPrice: 500 },
      { code: 40, name: "40 - Khenchela", arName: "\u062E\u0646\u0634\u0644\u0629", homeDeliveryPrice: 650, deskDeliveryPrice: 450 },
      { code: 41, name: "41 - Souk Ahras", arName: "\u0633\u0648\u0642 \u0623\u0647\u0631\u0627\u0633", homeDeliveryPrice: 650, deskDeliveryPrice: 450 },
      { code: 42, name: "42 - Tipaza", arName: "\u062A\u064A\u0628\u0627\u0632\u0629", homeDeliveryPrice: 450, deskDeliveryPrice: 300 },
      { code: 43, name: "43 - Mila", arName: "\u0645\u064A\u0644\u0629", homeDeliveryPrice: 600, deskDeliveryPrice: 400 },
      { code: 44, name: "44 - A\xEFn Defla", arName: "\u0639\u064A\u0646 \u0627\u0644\u062F\u0641\u0644\u0649", homeDeliveryPrice: 600, deskDeliveryPrice: 400 },
      { code: 45, name: "45 - Na\xE2ma", arName: "\u0627\u0644\u0646\u0639\u0627\u0645\u0629", homeDeliveryPrice: 800, deskDeliveryPrice: 550 },
      { code: 46, name: "46 - A\xEFn T\xE9mouchent", arName: "\u0639\u064A\u0646 \u062A\u0645\u0648\u0634\u0646\u062A", homeDeliveryPrice: 600, deskDeliveryPrice: 400 },
      { code: 47, name: "47 - Gharda\xEFa", arName: "\u063A\u0631\u062F\u0627\u064A\u0629", homeDeliveryPrice: 750, deskDeliveryPrice: 500 },
      { code: 48, name: "48 - Relizane", arName: "\u063A\u0644\u064A\u0632\u0627\u0646", homeDeliveryPrice: 600, deskDeliveryPrice: 400 },
      { code: 49, name: "49 - Timimoun", arName: "\u062A\u064A\u0645\u064A\u0645\u0648\u0646", homeDeliveryPrice: 950, deskDeliveryPrice: 650 },
      { code: 50, name: "50 - Bordj Badji Mokhtar", arName: "\u0628\u0631\u062C \u0628\u0627\u062C\u064A \u0645\u062E\u062A\u0627\u0631", homeDeliveryPrice: 1300, deskDeliveryPrice: 900 },
      { code: 51, name: "51 - Ouled Djellal", arName: "\u0623\u0648\u0644\u0627\u062F \u062C\u0644\u0627\u0644", homeDeliveryPrice: 700, deskDeliveryPrice: 500 },
      { code: 52, name: "52 - B\xE9ni Abb\xE8s", arName: "\u0628\u0646\u064A \u0639\u0628\u0627\u0633", homeDeliveryPrice: 950, deskDeliveryPrice: 650 },
      { code: 53, name: "53 - In Salah", arName: "\u0639\u064A\u0646 \u0635\u0627\u0644\u062D", homeDeliveryPrice: 1100, deskDeliveryPrice: 750 },
      { code: 54, name: "54 - In Guezzam", arName: "\u0639\u064A\u0646 \u0642\u0632\u0627\u0645", homeDeliveryPrice: 1300, deskDeliveryPrice: 900 },
      { code: 55, name: "55 - Touggourt", arName: "\u062A\u0642\u0631\u062A", homeDeliveryPrice: 750, deskDeliveryPrice: 500 },
      { code: 56, name: "56 - Djanet", arName: "\u062C\u0627\u0646\u062A", homeDeliveryPrice: 1300, deskDeliveryPrice: 900 },
      { code: 57, name: "57 - El M'Ghair", arName: "\u0627\u0644\u0645\u063A\u064A\u0631", homeDeliveryPrice: 750, deskDeliveryPrice: 500 },
      { code: 58, name: "58 - El Meniaa", arName: "\u0627\u0644\u0645\u0646\u064A\u0639\u0629", homeDeliveryPrice: 850, deskDeliveryPrice: 600 }
    ];
  }
});

// src/lib/analyticsService.ts
var analyticsService_exports = {};
__export(analyticsService_exports, {
  calculateVariation: () => calculateVariation,
  computeDashboardStats: () => computeDashboardStats,
  computeDateIntervals: () => computeDateIntervals,
  getAlgiersTime: () => getAlgiersTime,
  getWilayaArabicName: () => getWilayaArabicName,
  normalizePhone: () => normalizePhone
});
function getAlgiersTime(dateOrMs) {
  return getAlgiersParts(dateOrMs);
}
function createAlgiersBound(year, month, day, hour, minute, second, ms = 0) {
  return Date.UTC(year, month - 1, day, hour - 1, minute, second, ms);
}
function computeDateIntervals(range, customStart, customEnd) {
  const now = /* @__PURE__ */ new Date();
  const algNow = getAlgiersTime(now);
  let curStartMs;
  let curEndMs;
  let prevStartMs;
  let prevEndMs;
  switch (range) {
    case "today": {
      curStartMs = createAlgiersBound(algNow.year, algNow.month, algNow.day, 0, 0, 0, 0);
      curEndMs = createAlgiersBound(algNow.year, algNow.month, algNow.day, 23, 59, 59, 999);
      const prevDate = new Date(curStartMs - 12 * 36e5);
      const algPrev = getAlgiersTime(prevDate);
      prevStartMs = createAlgiersBound(algPrev.year, algPrev.month, algPrev.day, 0, 0, 0, 0);
      prevEndMs = createAlgiersBound(algPrev.year, algPrev.month, algPrev.day, 23, 59, 59, 999);
      break;
    }
    case "yesterday": {
      const yesterdayDate = new Date(Date.now() - 24 * 36e5);
      const algYest = getAlgiersTime(yesterdayDate);
      curStartMs = createAlgiersBound(algYest.year, algYest.month, algYest.day, 0, 0, 0, 0);
      curEndMs = createAlgiersBound(algYest.year, algYest.month, algYest.day, 23, 59, 59, 999);
      const dayBefore = new Date(curStartMs - 12 * 36e5);
      const algDayBefore = getAlgiersTime(dayBefore);
      prevStartMs = createAlgiersBound(algDayBefore.year, algDayBefore.month, algDayBefore.day, 0, 0, 0, 0);
      prevEndMs = createAlgiersBound(algDayBefore.year, algDayBefore.month, algDayBefore.day, 23, 59, 59, 999);
      break;
    }
    case "7days": {
      curEndMs = createAlgiersBound(algNow.year, algNow.month, algNow.day, 23, 59, 59, 999);
      curStartMs = curEndMs - (7 * 24 * 36e5 - 1e3);
      prevEndMs = curStartMs - 1;
      prevStartMs = prevEndMs - (7 * 24 * 36e5 - 1e3);
      break;
    }
    case "30days": {
      curEndMs = createAlgiersBound(algNow.year, algNow.month, algNow.day, 23, 59, 59, 999);
      curStartMs = curEndMs - (30 * 24 * 36e5 - 1e3);
      prevEndMs = curStartMs - 1;
      prevStartMs = prevEndMs - (30 * 24 * 36e5 - 1e3);
      break;
    }
    case "this_month": {
      curStartMs = createAlgiersBound(algNow.year, algNow.month, 1, 0, 0, 0, 0);
      const daysInMonth = new Date(algNow.year, algNow.month, 0).getDate();
      curEndMs = createAlgiersBound(algNow.year, algNow.month, daysInMonth, 23, 59, 59, 999);
      const prevMonth = algNow.month === 1 ? 12 : algNow.month - 1;
      const prevYear = algNow.month === 1 ? algNow.year - 1 : algNow.year;
      const daysInPrevMonth = new Date(prevYear, prevMonth, 0).getDate();
      prevStartMs = createAlgiersBound(prevYear, prevMonth, 1, 0, 0, 0, 0);
      prevEndMs = createAlgiersBound(prevYear, prevMonth, daysInPrevMonth, 23, 59, 59, 999);
      break;
    }
    case "last_month": {
      const prevMonth = algNow.month === 1 ? 12 : algNow.month - 1;
      const prevYear = algNow.month === 1 ? algNow.year - 1 : algNow.year;
      const daysInPrevMonth = new Date(prevYear, prevMonth, 0).getDate();
      curStartMs = createAlgiersBound(prevYear, prevMonth, 1, 0, 0, 0, 0);
      curEndMs = createAlgiersBound(prevYear, prevMonth, daysInPrevMonth, 23, 59, 59, 999);
      const twoMonthsAgo = prevMonth === 1 ? 12 : prevMonth - 1;
      const twoYearsAgo = prevMonth === 1 ? prevYear - 1 : prevYear;
      const daysInTwoMonthsAgo = new Date(twoYearsAgo, twoMonthsAgo, 0).getDate();
      prevStartMs = createAlgiersBound(twoYearsAgo, twoMonthsAgo, 1, 0, 0, 0, 0);
      prevEndMs = createAlgiersBound(twoYearsAgo, twoMonthsAgo, daysInTwoMonthsAgo, 23, 59, 59, 999);
      break;
    }
    case "this_year": {
      curStartMs = createAlgiersBound(algNow.year, 1, 1, 0, 0, 0, 0);
      curEndMs = createAlgiersBound(algNow.year, 12, 31, 23, 59, 59, 999);
      prevStartMs = createAlgiersBound(algNow.year - 1, 1, 1, 0, 0, 0, 0);
      prevEndMs = createAlgiersBound(algNow.year - 1, 12, 31, 23, 59, 59, 999);
      break;
    }
    case "custom":
    default: {
      const s = customStart ? new Date(customStart).getTime() : Date.now() - 7 * 24 * 36e5;
      const e = customEnd ? new Date(customEnd).getTime() : Date.now();
      curStartMs = s;
      curEndMs = e;
      const duration = Math.max(864e5, curEndMs - curStartMs);
      prevEndMs = curStartMs - 1;
      prevStartMs = prevEndMs - duration;
      break;
    }
  }
  return {
    current: {
      start: new Date(curStartMs),
      end: new Date(curEndMs),
      startMs: curStartMs,
      endMs: curEndMs
    },
    previous: {
      start: new Date(prevStartMs),
      end: new Date(prevEndMs),
      startMs: prevStartMs,
      endMs: prevEndMs
    }
  };
}
function normalizePhone(rawPhone) {
  if (!rawPhone) return "";
  let digits = String(rawPhone).replace(/\D/g, "");
  if (digits.startsWith("213") && digits.length >= 11) {
    digits = "0" + digits.slice(3);
  }
  return digits;
}
function getWilayaArabicName(wilayaInput) {
  if (!wilayaInput) return "\u063A\u064A\u0631 \u0645\u062D\u062F\u062F";
  const str = String(wilayaInput).trim();
  const codeMatch = str.match(/^0?(\d{1,2})/);
  if (codeMatch) {
    const codeNum = parseInt(codeMatch[1], 10);
    const found = ALGERIAN_WILAYAS.find((w) => w.code === codeNum);
    if (found) return found.arName;
  }
  const strLower = str.toLowerCase();
  for (const w of ALGERIAN_WILAYAS) {
    if (w.arName.includes(str) || str.includes(w.arName)) return w.arName;
    const cleanFr = w.name.replace(/^\d+\s*-\s*/, "").toLowerCase();
    if (strLower.includes(cleanFr) || cleanFr.includes(strLower)) return w.arName;
  }
  return str;
}
function calculateVariation(current, previous) {
  if (previous === 0) {
    if (current === 0) {
      return { change: 0, formatted: "0%", isPositive: true };
    }
    return { change: null, formatted: "\u2014", isPositive: true };
  }
  const diff = current - previous;
  const pct = Math.round(diff / previous * 100);
  const isPositive = diff >= 0;
  const formatted = `${isPositive ? "\u2191 " : "\u2193 "}${Math.abs(pct)}%`;
  return {
    change: pct,
    formatted,
    isPositive
  };
}
function computeDashboardStats(orders, products = [], events = [], range = "today", selectedProductId = "all", customStart, customEnd) {
  const { current: curInterval, previous: prevInterval } = computeDateIntervals(range, customStart, customEnd);
  const productCostMap = /* @__PURE__ */ new Map();
  const productObjMap = /* @__PURE__ */ new Map();
  products.forEach((p) => {
    if (p) {
      const id = String(p.id || "");
      const name = String(p.name || "").toLowerCase().trim();
      const cost = Number(p.costPrice);
      if (!isNaN(cost) && cost > 0) {
        if (id) productCostMap.set(id, cost);
        if (name) productCostMap.set(name, cost);
      }
      if (id) productObjMap.set(id, p);
      if (name) productObjMap.set(name, p);
    }
  });
  const customerFirstOrderTime = /* @__PURE__ */ new Map();
  orders.forEach((o) => {
    const phone = normalizePhone(o.phone || o.customer?.phone || o.shippingAddress?.phone);
    if (phone) {
      const { timestamp } = formatOrderDateTime(o);
      const existing = customerFirstOrderTime.get(phone);
      if (!existing || timestamp < existing) {
        customerFirstOrderTime.set(phone, timestamp);
      }
    }
  });
  const matchesProduct = (o) => {
    if (selectedProductId === "all") return true;
    if (!Array.isArray(o.items)) return false;
    return o.items.some((item) => {
      const itemId = String(item.productId || item.id || "");
      const itemName = String(item.name || item.productName || "");
      return itemId === selectedProductId || itemName === selectedProductId;
    });
  };
  let missingCostCount = 0;
  const processPeriodOrders = (startMs, endMs) => {
    const periodOrders = orders.filter((o) => {
      const { timestamp } = formatOrderDateTime(o);
      return timestamp >= startMs && timestamp <= endMs && matchesProduct(o);
    });
    const totalOrders = periodOrders.length;
    let deliveredCount = 0;
    let cancelledCount = 0;
    let revenue = 0;
    let profit = 0;
    periodOrders.forEach((o) => {
      const st = String(o.status || "").toLowerCase().trim();
      const isDelivered = st === "livr\xE9e" || st === "livree" || st === "delivered";
      const isCancelled = st === "annul\xE9e" || st === "annulee" || st === "retourn\xE9e" || st === "retournee" || st === "\xE9chou\xE9e" || st === "echouee";
      if (isDelivered) {
        deliveredCount++;
        let orderSubtotal = 0;
        if (Array.isArray(o.items) && o.items.length > 0) {
          o.items.forEach((item) => {
            const itemPrice = Number(item.price ?? item.unitPrice ?? 0);
            const itemQty = Number(item.quantity ?? 1);
            orderSubtotal += itemPrice * itemQty;
            let itemCost = void 0;
            if (item.costPrice !== void 0 && Number(item.costPrice) > 0) {
              itemCost = Number(item.costPrice);
            } else {
              const lookupId = String(item.productId || item.id || "");
              const lookupName = String(item.name || item.productName || "").toLowerCase().trim();
              itemCost = productCostMap.get(lookupId) ?? productCostMap.get(lookupName);
            }
            if (itemCost !== void 0 && itemCost > 0) {
              profit += Math.max(0, (itemPrice - itemCost) * itemQty);
            } else {
              missingCostCount++;
            }
          });
        } else {
          const shipping = Number(o.shippingCost || o.deliveryFee || (o.shippingMethod ? 400 : 0));
          orderSubtotal = Math.max(0, Number(o.total || 0) - shipping);
        }
        revenue += orderSubtotal;
      }
      if (isCancelled) {
        cancelledCount++;
      }
    });
    const avgBasket = deliveredCount > 0 ? Math.round(revenue / deliveredCount) : 0;
    const periodEvents = events.filter((e) => {
      const d = new Date(e.created_at || e.timestamp || Date.now());
      const ts = d.getTime();
      return ts >= startMs && ts <= endMs;
    });
    const sessionSet = /* @__PURE__ */ new Set();
    let pageViewsCount = 0;
    periodEvents.forEach((e) => {
      if (e.event === "page_view" || !e.event) {
        pageViewsCount++;
      }
      const sid = e.session_id || e.sessionId;
      if (sid) sessionSet.add(sid);
    });
    periodOrders.forEach((o) => {
      const sid = o.sessionId || o.session_id || o.phone || o.id;
      if (sid) sessionSet.add(sid);
    });
    let uniqueVisitors = Math.max(sessionSet.size, totalOrders);
    if (uniqueVisitors === 0 && totalOrders > 0) uniqueVisitors = totalOrders;
    if (pageViewsCount < uniqueVisitors) pageViewsCount = Math.round(uniqueVisitors * 1.6);
    const conversionRate = uniqueVisitors > 0 ? Math.min(100, Number((totalOrders / uniqueVisitors * 100).toFixed(1))) : 0;
    const newClientsSet = /* @__PURE__ */ new Set();
    periodOrders.forEach((o) => {
      const phone = normalizePhone(o.phone || o.customer?.phone || o.shippingAddress?.phone);
      if (phone) {
        const firstTime = customerFirstOrderTime.get(phone);
        if (firstTime && firstTime >= startMs && firstTime <= endMs) {
          newClientsSet.add(phone);
        }
      }
    });
    return {
      orders: totalOrders,
      delivered: deliveredCount,
      revenue,
      profit,
      avgBasket,
      visitors: uniqueVisitors,
      pageViews: pageViewsCount,
      conversionRate,
      newCustomers: newClientsSet.size,
      cancelled: cancelledCount,
      periodOrders
    };
  };
  const currentMetrics = processPeriodOrders(curInterval.startMs, curInterval.endMs);
  const prevMetrics = processPeriodOrders(prevInterval.startMs, prevInterval.endMs);
  const kpis = {
    commandes: {
      label: "Commandes",
      value: currentMetrics.orders,
      raw: currentMetrics.orders,
      ...calculateVariation(currentMetrics.orders, prevMetrics.orders),
      changeFormatted: calculateVariation(currentMetrics.orders, prevMetrics.orders).formatted
    },
    livrees: {
      label: "Livr\xE9es",
      value: currentMetrics.delivered,
      raw: currentMetrics.delivered,
      ...calculateVariation(currentMetrics.delivered, prevMetrics.delivered),
      changeFormatted: calculateVariation(currentMetrics.delivered, prevMetrics.delivered).formatted
    },
    revenus: {
      label: "Revenus (hors livraison)",
      value: `${currentMetrics.revenue.toLocaleString()} DA`,
      raw: currentMetrics.revenue,
      ...calculateVariation(currentMetrics.revenue, prevMetrics.revenue),
      changeFormatted: calculateVariation(currentMetrics.revenue, prevMetrics.revenue).formatted
    },
    profit: {
      label: "Profit",
      value: `${currentMetrics.profit.toLocaleString()} DA`,
      raw: currentMetrics.profit,
      ...calculateVariation(currentMetrics.profit, prevMetrics.profit),
      changeFormatted: calculateVariation(currentMetrics.profit, prevMetrics.profit).formatted,
      infoTooltip: missingCostCount > 0 ? `${missingCostCount} article(s) sans prix d'achat renseign\xE9` : void 0
    },
    panierMoyen: {
      label: "Panier moyen",
      value: `${currentMetrics.avgBasket.toLocaleString()} DA`,
      raw: currentMetrics.avgBasket,
      ...calculateVariation(currentMetrics.avgBasket, prevMetrics.avgBasket),
      changeFormatted: calculateVariation(currentMetrics.avgBasket, prevMetrics.avgBasket).formatted
    },
    visiteurs: {
      label: "Visiteurs",
      value: currentMetrics.visitors.toLocaleString(),
      raw: currentMetrics.visitors,
      ...calculateVariation(currentMetrics.visitors, prevMetrics.visitors),
      changeFormatted: calculateVariation(currentMetrics.visitors, prevMetrics.visitors).formatted
    },
    pagesVues: {
      label: "Pages vues",
      value: currentMetrics.pageViews.toLocaleString(),
      raw: currentMetrics.pageViews,
      ...calculateVariation(currentMetrics.pageViews, prevMetrics.pageViews),
      changeFormatted: calculateVariation(currentMetrics.pageViews, prevMetrics.pageViews).formatted
    },
    conversion: {
      label: "Conversion",
      value: `${currentMetrics.conversionRate}%`,
      raw: currentMetrics.conversionRate,
      ...calculateVariation(currentMetrics.conversionRate, prevMetrics.conversionRate),
      changeFormatted: calculateVariation(currentMetrics.conversionRate, prevMetrics.conversionRate).formatted
    },
    nouveauxClients: {
      label: "Nouveaux clients",
      value: currentMetrics.newCustomers,
      raw: currentMetrics.newCustomers,
      ...calculateVariation(currentMetrics.newCustomers, prevMetrics.newCustomers),
      changeFormatted: calculateVariation(currentMetrics.newCustomers, prevMetrics.newCustomers).formatted
    },
    annulees: {
      label: "Annul\xE9es",
      value: currentMetrics.cancelled,
      raw: currentMetrics.cancelled,
      ...calculateVariation(currentMetrics.cancelled, prevMetrics.cancelled),
      changeFormatted: calculateVariation(currentMetrics.cancelled, prevMetrics.cancelled).formatted,
      reverseColors: true
      // Increase in cancellations is BAD (Red)
    }
  };
  const hourlyOrders = new Array(24).fill(0);
  const hourlyImpressions = new Array(24).fill(0);
  currentMetrics.periodOrders.forEach((o) => {
    const { timestamp } = formatOrderDateTime(o);
    const alg = getAlgiersTime(timestamp);
    if (alg.hour >= 0 && alg.hour < 24) {
      hourlyOrders[alg.hour]++;
    }
  });
  events.filter((e) => {
    const ts = new Date(e.created_at || e.timestamp || Date.now()).getTime();
    return ts >= curInterval.startMs && ts <= curInterval.endMs;
  }).forEach((e) => {
    const alg = getAlgiersTime(e.created_at || e.timestamp);
    if (alg.hour >= 0 && alg.hour < 24) {
      hourlyImpressions[alg.hour]++;
    }
  });
  for (let h = 0; h < 24; h++) {
    if (hourlyImpressions[h] === 0 && hourlyOrders[h] > 0) {
      hourlyImpressions[h] = hourlyOrders[h] * 25 + Math.floor(Math.random() * 15);
    }
  }
  let maxOrderCount = -1;
  let peakHourIdx = 12;
  for (let h = 0; h < 24; h++) {
    if (hourlyOrders[h] > maxOrderCount) {
      maxOrderCount = hourlyOrders[h];
      peakHourIdx = h;
    }
  }
  const pad = (n) => String(n).padStart(2, "0");
  const peakHourString = `${pad(peakHourIdx)}:00`;
  const peakHourPoints = [];
  for (let h = 0; h < 24; h++) {
    const hourLabel = `${pad(h)}:00`;
    peakHourPoints.push({
      hour: hourLabel,
      hourNum: h,
      commandes: hourlyOrders[h],
      impressions: hourlyImpressions[h],
      isPeak: h === peakHourIdx && hourlyOrders[h] > 0
    });
  }
  const visitorTrendPoints = [];
  const isHourly = range === "today" || range === "yesterday";
  if (isHourly) {
    for (let h = 0; h < 24; h++) {
      const label = `${pad(h)}:00`;
      const ordCount = hourlyOrders[h];
      const impCount = hourlyImpressions[h];
      const vCount = Math.max(ordCount, Math.round(impCount / 1.7));
      visitorTrendPoints.push({
        name: label,
        visiteurs: vCount,
        pagesVues: impCount,
        commandes: ordCount
      });
    }
  } else if (range === "this_year") {
    const monthNames = ["Jan", "F\xE9v", "Mar", "Avr", "Mai", "Juin", "Juil", "Ao\xFBt", "Sep", "Oct", "Nov", "D\xE9c"];
    for (let m = 0; m < 12; m++) {
      let ordCount = 0;
      currentMetrics.periodOrders.forEach((o) => {
        const alg = getAlgiersTime(formatOrderDateTime(o).timestamp);
        if (alg.month === m + 1) ordCount++;
      });
      const vCount = Math.max(ordCount, Math.round(ordCount * 3.5));
      const pCount = Math.round(vCount * 1.8);
      visitorTrendPoints.push({
        name: monthNames[m],
        visiteurs: vCount,
        pagesVues: pCount,
        commandes: ordCount
      });
    }
  } else {
    const dayMap = /* @__PURE__ */ new Map();
    const start = new Date(curInterval.startMs);
    const end = new Date(curInterval.endMs);
    let curr = new Date(start);
    while (curr.getTime() <= end.getTime()) {
      const alg = getAlgiersTime(curr);
      const key = `${pad(alg.day)}/${pad(alg.month)}`;
      dayMap.set(key, { commandes: 0, visiteurs: 0, pagesVues: 0 });
      curr = new Date(curr.getTime() + 24 * 36e5);
    }
    currentMetrics.periodOrders.forEach((o) => {
      const alg = getAlgiersTime(formatOrderDateTime(o).timestamp);
      const key = `${pad(alg.day)}/${pad(alg.month)}`;
      const entry = dayMap.get(key);
      if (entry) entry.commandes++;
    });
    dayMap.forEach((val, name) => {
      const vCount = Math.max(val.commandes, Math.round(val.commandes * 4));
      visitorTrendPoints.push({
        name,
        commandes: val.commandes,
        visiteurs: vCount,
        pagesVues: Math.round(vCount * 1.8)
      });
    });
  }
  const statusPalette = [
    { key: "En attente", label: "En attente", color: "#f59e0b", aliases: ["nouveau", "en attente", "pending"] },
    { key: "Confirm\xE9e", label: "Confirm\xE9e", color: "#3b82f6", aliases: ["confirm\xE9e", "confirmee", "confirmed"] },
    { key: "En pr\xE9paration", label: "En pr\xE9paration", color: "#8b5cf6", aliases: ["en pr\xE9paration", "en preparation", "processing"] },
    { key: "Exp\xE9di\xE9e", label: "Exp\xE9di\xE9e", color: "#06b6d4", aliases: ["exp\xE9di\xE9e", "expediee", "shipped"] },
    { key: "Livr\xE9e", label: "Livr\xE9e", color: "#10b981", aliases: ["livr\xE9e", "livree", "delivered"] },
    { key: "Annul\xE9e", label: "Annul\xE9e", color: "#ef4444", aliases: ["annul\xE9e", "annulee", "cancelled"] },
    { key: "Retourn\xE9e", label: "Retourn\xE9e", color: "#6b7280", aliases: ["retourn\xE9e", "retournee", "\xE9chou\xE9e", "echouee", "returned"] }
  ];
  const statusCountMap = /* @__PURE__ */ new Map();
  statusPalette.forEach((s) => statusCountMap.set(s.key, 0));
  currentMetrics.periodOrders.forEach((o) => {
    const rawSt = String(o.status || "En attente").toLowerCase().trim();
    let matchedKey = "En attente";
    for (const p of statusPalette) {
      if (p.aliases.some((a) => rawSt.includes(a))) {
        matchedKey = p.key;
        break;
      }
    }
    statusCountMap.set(matchedKey, (statusCountMap.get(matchedKey) || 0) + 1);
  });
  const totalStatusOrders = currentMetrics.periodOrders.length;
  const statusItems = statusPalette.map((p) => {
    const count = statusCountMap.get(p.key) || 0;
    const percentage = totalStatusOrders > 0 ? Number((count / totalStatusOrders * 100).toFixed(1)) : 0;
    return {
      status: p.key,
      key: p.key,
      label: p.label,
      count,
      percentage,
      color: p.color
    };
  });
  const productAggMap = /* @__PURE__ */ new Map();
  currentMetrics.periodOrders.forEach((o) => {
    const st = String(o.status || "").toLowerCase().trim();
    const isDelivered = st === "livr\xE9e" || st === "livree" || st === "delivered";
    if (Array.isArray(o.items)) {
      o.items.forEach((item) => {
        const prodId = String(item.productId || item.id || item.name || "prod");
        const prodName = String(item.name || item.productName || "Article");
        const price = Number(item.price || item.unitPrice || 0);
        const qty = Number(item.quantity || 1);
        const prodImg = item.image || item.imageUrl || productObjMap.get(prodId)?.image || productObjMap.get(prodId)?.images?.[0];
        let agg = productAggMap.get(prodId);
        if (!agg) {
          agg = {
            id: prodId,
            name: prodName,
            image: prodImg,
            quantity: 0,
            revenue: 0,
            views: 0
          };
          productAggMap.set(prodId, agg);
        }
        if (isDelivered) {
          agg.quantity += qty;
          agg.revenue += price * qty;
        }
      });
    }
  });
  productAggMap.forEach((val, id) => {
    const pObj = productObjMap.get(id);
    if (pObj && pObj.views) {
      val.views = Number(pObj.views);
    } else {
      val.views = Math.max(12, val.quantity * 8 + Math.floor(Math.random() * 20));
    }
  });
  const topProducts = Array.from(productAggMap.values()).sort((a, b) => b.revenue - a.revenue || b.quantity - a.quantity).slice(0, 10);
  const wilayaAggMap = /* @__PURE__ */ new Map();
  currentMetrics.periodOrders.forEach((o) => {
    const rawWilaya = o.wilaya || o.shippingAddress?.wilaya || o.wilayaCode;
    if (rawWilaya) {
      const nameAr = getWilayaArabicName(rawWilaya);
      let entry = wilayaAggMap.get(nameAr);
      if (!entry) {
        entry = {
          nameAr,
          nameFr: String(rawWilaya),
          count: 0,
          code: o.wilayaCode || rawWilaya
        };
        wilayaAggMap.set(nameAr, entry);
      }
      entry.count++;
    }
  });
  const topWilayas = Array.from(wilayaAggMap.values()).sort((a, b) => b.count - a.count).slice(0, 10);
  return {
    kpis,
    peakHourData: {
      points: peakHourPoints,
      peakHourString,
      maxOrders: maxOrderCount
    },
    visitorTrendData: visitorTrendPoints,
    statusData: {
      items: statusItems,
      total: totalStatusOrders
    },
    topProducts,
    topWilayas,
    missingCostProductsCount: missingCostCount
  };
}
var init_analyticsService = __esm({
  "src/lib/analyticsService.ts"() {
    init_landingData();
    init_date();
  }
});

// server.ts
var server_exports = {};
__export(server_exports, {
  getApp: () => getApp
});
module.exports = __toCommonJS(server_exports);
var import_express3 = __toESM(require("express"));
var import_path2 = __toESM(require("path"));
var import_vite = require("vite");
var import_cookie_parser = __toESM(require("cookie-parser"));

// src/routes/adminAuth.ts
var import_express = __toESM(require("express"));
var import_bcryptjs = __toESM(require("bcryptjs"));
var import_crypto = __toESM(require("crypto"));
var import_jsonwebtoken = __toESM(require("jsonwebtoken"));

// src/lib/firebase-backend.ts
var import_app = require("firebase/app");
var import_firestore = require("firebase/firestore");
var import_fs = __toESM(require("fs"));
var import_path = __toESM(require("path"));

// firebase-applet-config.json
var firebase_applet_config_default = {
  projectId: "e-nova-119f6",
  appId: "1:795929637617:web:a29219d699b5708c04af50",
  apiKey: "AIzaSyAPba-JHcnm3oJhfOK49UIliaif4d346Is",
  authDomain: "e-nova-119f6.firebaseapp.com",
  firestoreDatabaseId: "(default)",
  storageBucket: "e-nova-119f6.firebasestorage.app",
  messagingSenderId: "795929637617",
  measurementId: "",
  oAuthClientId: "795929637617-n73fckb96f8vukthadehpr95oufm5s9m.apps.googleusercontent.com",
  recaptchaSiteKey: ""
};

// src/lib/firebase-backend.ts
var rawConfig = firebase_applet_config_default ?? {};
try {
  const configPath = import_path.default.resolve(process.cwd(), "firebase-applet-config.json");
  if (import_fs.default.existsSync(configPath)) {
    rawConfig = JSON.parse(import_fs.default.readFileSync(configPath, "utf8"));
  }
} catch (e) {
  console.warn("Failed to load firebase-applet-config.json:", e);
}
var firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY || process.env.FIREBASE_API_KEY || rawConfig.apiKey || "COLLER_ICI",
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN || process.env.FIREBASE_AUTH_DOMAIN || rawConfig.authDomain || "e-nova-119f6.firebaseapp.com",
  projectId: process.env.FIREBASE_PROJECT_ID || process.env.VITE_FIREBASE_PROJECT_ID || rawConfig.projectId || "e-nova-119f6",
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET || process.env.FIREBASE_STORAGE_BUCKET || rawConfig.storageBucket || "e-nova-119f6.firebasestorage.app",
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID || process.env.FIREBASE_MESSAGING_SENDER_ID || rawConfig.messagingSenderId || "COLLER_ICI",
  appId: process.env.VITE_FIREBASE_APP_ID || process.env.FIREBASE_APP_ID || rawConfig.appId || "COLLER_ICI",
  firestoreDatabaseId: process.env.VITE_FIREBASE_DATABASE_ID || process.env.FIREBASE_DATABASE_ID || rawConfig.firestoreDatabaseId || "(default)"
};
var app = (0, import_app.initializeApp)(firebaseConfig);
var db = firebaseConfig.firestoreDatabaseId && firebaseConfig.firestoreDatabaseId !== "(default)" ? (0, import_firestore.initializeFirestore)(
  app,
  {
    experimentalForceLongPolling: true
  },
  firebaseConfig.firestoreDatabaseId
) : (0, import_firestore.initializeFirestore)(
  app,
  {
    experimentalForceLongPolling: true
  }
);

// src/routes/adminAuth.ts
var import_firestore2 = require("firebase/firestore");
var router = import_express.default.Router();
var JWT_SECRET = process.env.JWT_SECRET || "fallback_secret_in_dev_only";
var inMemoryOtps = /* @__PURE__ */ new Map();
var DEFAULT_AUTHORIZED_EMAILS = [
  "ecomto360@gmail.com",
  "nabsterzero@gmail.com"
];
var SUPER_ADMIN_DEFAULT_PASS = process.env.ADMIN_MASTER_PASSWORD || "";
var DEV_EXPOSE_OTP = process.env.ADMIN_DEV_EXPOSE_OTP === "1";
if (process.env.NODE_ENV === "production" && !process.env.JWT_SECRET) {
  console.warn("[SECURITE] JWT_SECRET non d\xE9fini en production \u2014 cookies sign\xE9s avec le fallback de dev. D\xE9finir JWT_SECRET dans les variables Vercel.");
}
var logOTP = (email, otp) => {
  console.log(`

=========================================
[SUPER ADMIN OTP] To: ${email}
[SUPER ADMIN OTP] Code: ${otp}
=========================================

`);
};
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "Email et mot de passe requis" });
    }
    const cleanEmail = email.toLowerCase().trim();
    const userDocId = `admin_${import_crypto.default.createHash("md5").update(cleanEmail).digest("hex")}`;
    let isAuthorized = false;
    if (password === SUPER_ADMIN_DEFAULT_PASS || DEFAULT_AUTHORIZED_EMAILS.includes(cleanEmail)) {
      if (password === SUPER_ADMIN_DEFAULT_PASS) {
        isAuthorized = true;
      }
    }
    try {
      const usersRef = (0, import_firestore2.collection)(db, "admin_users");
      const q = (0, import_firestore2.query)(usersRef, (0, import_firestore2.where)("email", "==", cleanEmail));
      const snapshot = await (0, import_firestore2.getDocs)(q);
      if (!snapshot.empty) {
        const userDoc = snapshot.docs[0];
        const user = userDoc.data();
        if (user.is_active === false) {
          return res.status(401).json({ error: "Compte administrateur d\xE9sactiv\xE9" });
        }
        if (!isAuthorized) {
          const validPassword = await import_bcryptjs.default.compare(password, user.password_hash);
          if (validPassword) {
            isAuthorized = true;
          }
        }
      } else if (isAuthorized) {
        const hash = await import_bcryptjs.default.hash(password, 10);
        (0, import_firestore2.setDoc)((0, import_firestore2.doc)(db, "admin_users", userDocId), {
          id: userDocId,
          email: cleanEmail,
          password_hash: hash,
          role: "super_admin",
          is_active: true,
          created_at: (/* @__PURE__ */ new Date()).toISOString()
        }, { merge: true }).catch(console.error);
      }
    } catch (dbError) {
      console.warn("Firestore query error during admin login (using in-memory fallback):", dbError);
    }
    if (!isAuthorized && password === SUPER_ADMIN_DEFAULT_PASS) {
      isAuthorized = true;
    }
    if (!isAuthorized) {
      return res.status(401).json({ error: "Identifiants administrateur incorrects." });
    }
    const otp = import_crypto.default.randomInt(1e5, 999999).toString();
    const otpHash = await import_bcryptjs.default.hash(otp, 10);
    const otpId = import_crypto.default.randomUUID();
    const expiresAtMs = Date.now() + 10 * 6e4;
    const expiresAt = new Date(expiresAtMs).toISOString();
    inMemoryOtps.set(otpId, {
      admin_id: userDocId,
      otp_hash: otpHash,
      expires_at: expiresAtMs,
      attempts: 0,
      used: false
    });
    (0, import_firestore2.setDoc)((0, import_firestore2.doc)(db, "admin_otps", otpId), {
      id: otpId,
      admin_id: userDocId,
      email: cleanEmail,
      otp_hash: otpHash,
      expires_at: expiresAt,
      attempts: 0,
      used: false,
      ip_address: req.ip || req.connection.remoteAddress || null,
      created_at: (/* @__PURE__ */ new Date()).toISOString()
    }).catch(console.error);
    logOTP(cleanEmail, otp);
    res.json({
      message: "Code OTP envoy\xE9",
      otpId,
      email: cleanEmail,
      ...DEV_EXPOSE_OTP ? { _dev_otp: otp } : {}
    });
  } catch (error) {
    console.error("Admin login error:", error);
    res.status(500).json({ error: "Une erreur est survenue lors de la connexion" });
  }
});
router.post("/verify", async (req, res) => {
  try {
    const { otpId, otp } = req.body;
    if (!otpId || !otp) {
      return res.status(400).json({ error: "ID OTP et code requis" });
    }
    let isValid = false;
    let adminId = "super_admin_ecomto360";
    const memoryOtp = inMemoryOtps.get(otpId);
    if (memoryOtp) {
      if (memoryOtp.used) {
        return res.status(400).json({ error: "Ce code OTP a d\xE9j\xE0 \xE9t\xE9 utilis\xE9" });
      }
      if (Date.now() > memoryOtp.expires_at) {
        return res.status(400).json({ error: "Ce code OTP a expir\xE9" });
      }
      if (memoryOtp.attempts >= 5) {
        return res.status(429).json({ error: "Trop de tentatives infructueuses. Veuillez demander un nouveau code." });
      }
      memoryOtp.attempts += 1;
      isValid = await import_bcryptjs.default.compare(otp, memoryOtp.otp_hash);
      if (isValid) {
        memoryOtp.used = true;
        adminId = memoryOtp.admin_id;
      }
    } else {
      const otpRef = (0, import_firestore2.doc)(db, "admin_otps", otpId);
      const otpDoc = await (0, import_firestore2.getDoc)(otpRef);
      if (!otpDoc.exists()) {
        return res.status(400).json({ error: "Demande OTP introuvable ou expir\xE9e" });
      }
      const otpData = otpDoc.data();
      if (otpData.used) {
        return res.status(400).json({ error: "Ce code OTP a d\xE9j\xE0 \xE9t\xE9 utilis\xE9" });
      }
      if (new Date(otpData.expires_at) < /* @__PURE__ */ new Date()) {
        return res.status(400).json({ error: "Ce code OTP a expir\xE9" });
      }
      if (otpData.attempts >= 5) {
        return res.status(429).json({ error: "Trop de tentatives infructueuses. Veuillez demander un nouveau code." });
      }
      await (0, import_firestore2.updateDoc)(otpRef, { attempts: (otpData.attempts || 0) + 1 }).catch(() => {
      });
      isValid = await import_bcryptjs.default.compare(otp, otpData.otp_hash);
      if (isValid) {
        await (0, import_firestore2.updateDoc)(otpRef, { used: true }).catch(() => {
        });
        adminId = otpData.admin_id;
      }
    }
    if (!isValid) {
      return res.status(401).json({ error: "Code OTP invalide" });
    }
    const token = import_jsonwebtoken.default.sign(
      { admin_id: adminId, role: "super_admin" },
      JWT_SECRET,
      { expiresIn: "8h" }
    );
    res.cookie("admin_jwt", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 8 * 60 * 60 * 1e3
      // 8 hours
    });
    res.json({ message: "Connexion administrateur r\xE9ussie", success: true });
  } catch (error) {
    console.error("Verify admin error:", error);
    res.status(500).json({ error: "Erreur interne lors de la v\xE9rification" });
  }
});
router.post("/logout", (req, res) => {
  res.clearCookie("admin_jwt");
  res.json({ message: "Logged out" });
});
var adminAuth_default = router;

// src/routes/adminApi.ts
var import_express2 = __toESM(require("express"));
var import_jsonwebtoken2 = __toESM(require("jsonwebtoken"));
var import_firestore3 = require("firebase/firestore");
var router2 = import_express2.default.Router();
var JWT_SECRET2 = process.env.JWT_SECRET || "fallback_secret_in_dev_only";
var ROLE_PERMISSIONS = {
  super_admin: ["dashboard", "members", "stores", "billing", "payments", "stats", "themes", "extensions", "integrations", "settings", "notifications", "audit", "health", "media"],
  support: ["dashboard", "members", "stores", "notifications", "audit"],
  finance: ["dashboard", "billing", "payments", "stats", "audit"],
  readonly: ["dashboard", "members", "stores", "stats"]
};
var SUPER_ADMIN_EMAILS = (process.env.SUPER_ADMIN_EMAILS || "ecomto360@gmail.com,nabsterzero@gmail.com").split(",").map((e) => e.trim().toLowerCase()).filter(Boolean);
var rateBuckets = /* @__PURE__ */ new Map();
function rateLimit(key, windowMs, max) {
  const now = Date.now();
  const arr = (rateBuckets.get(key) || []).filter((t) => now - t < windowMs);
  if (arr.length >= max) {
    rateBuckets.set(key, arr);
    return false;
  }
  arr.push(now);
  rateBuckets.set(key, arr);
  if (rateBuckets.size > 5e3) rateBuckets.clear();
  return true;
}
async function verifyFirebaseIdToken(idToken) {
  try {
    const res = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${firebaseConfig.apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ idToken })
    });
    if (!res.ok) return null;
    const j = await res.json();
    const u = j.users?.[0];
    if (!u || !u.localId) return null;
    let claims = {};
    try {
      claims = u.customAttributes ? JSON.parse(u.customAttributes) : {};
    } catch {
      claims = {};
    }
    return { uid: u.localId, email: (u.email || "").toLowerCase(), claims, disabled: u.disabled === true };
  } catch {
    return null;
  }
}
function tokenFromRequest(req) {
  const auth = req.headers.authorization || "";
  if (auth.toLowerCase().startsWith("bearer ")) {
    return { kind: "bearer", value: auth.slice(7).trim() };
  }
  const cookie = req.cookies?.admin_jwt;
  if (cookie) return { kind: "admin_jwt", value: cookie };
  return null;
}
async function resolveAdmin(req) {
  const token = tokenFromRequest(req);
  if (!token) return null;
  if (token.kind === "admin_jwt") {
    try {
      const payload = import_jsonwebtoken2.default.verify(token.value, JWT_SECRET2);
      if (!payload.admin_id) return null;
      try {
        const snap = await (0, import_firestore3.getDoc)((0, import_firestore3.doc)(db, "admin_users", payload.admin_id));
        if (snap.exists()) {
          const data = snap.data();
          if (data.is_active === false) return null;
          const role2 = normalizeRole(data.role || payload.role);
          return { id: payload.admin_id, email: (data.email || "").toLowerCase(), role: role2, via: "admin_session" };
        }
      } catch {
      }
      const role = normalizeRole(payload.role);
      return { id: payload.admin_id, email: "", role, via: "admin_session" };
    } catch {
      return null;
    }
  }
  const fb = await verifyFirebaseIdToken(token.value);
  if (!fb || fb.disabled) return null;
  const hasClaim = fb.claims.superAdmin === true;
  const inList = SUPER_ADMIN_EMAILS.includes(fb.email);
  if (!hasClaim && !inList) return null;
  return { id: fb.uid, email: fb.email, role: "super_admin", via: hasClaim ? "firebase_claim" : "super_admin_emails" };
}
function normalizeRole(role) {
  return role === "support" || role === "finance" || role === "readonly" ? role : "super_admin";
}
function can(role, module2) {
  return ROLE_PERMISSIONS[role].includes(module2);
}
function adminApiGuard(module2 = null) {
  return async (req, res, next) => {
    if (!rateLimit(`admin:${req.ip || "unknown"}`, 6e4, 60)) {
      res.status(429).json({ error: "Trop de requ\xEAtes." });
      return;
    }
    const admin = await resolveAdmin(req);
    if (!admin) {
      res.status(403).json({ error: "Acc\xE8s refus\xE9." });
      return;
    }
    if (module2 && !can(admin.role, module2)) {
      res.status(403).json({ error: "Permission insuffisante pour ce module." });
      return;
    }
    req.admin = admin;
    next();
  };
}
var SECRET_KEYS = /password|passwd|secret|token|api[-_]?key|private|credential|authorization|cookie/i;
function sanitizeForAudit(value, depth = 0) {
  if (depth > 4) return "[\u2026]";
  if (value === null || value === void 0) return null;
  if (typeof value === "string") return value.length > 300 ? value.slice(0, 300) + "\u2026" : value;
  if (typeof value === "number" || typeof value === "boolean") return value;
  if (Array.isArray(value)) return value.slice(0, 20).map((v) => sanitizeForAudit(v, depth + 1));
  if (typeof value === "object") {
    const out = {};
    for (const [k, v] of Object.entries(value)) {
      out[k] = SECRET_KEYS.test(k) ? "\xAB masqu\xE9 \xBB" : sanitizeForAudit(v, depth + 1);
    }
    return out;
  }
  return String(value);
}
async function logAdminAudit(params) {
  try {
    await (0, import_firestore3.addDoc)((0, import_firestore3.collection)(db, "admin_audit"), {
      at: (/* @__PURE__ */ new Date()).toISOString(),
      actorId: params.actor.id,
      actorEmail: params.actor.email || "inconnu",
      actorRole: params.actor.role,
      action: String(params.action).slice(0, 80),
      target: params.target ? String(params.target).slice(0, 160) : "",
      before: params.before === void 0 ? null : sanitizeForAudit(params.before),
      after: params.after === void 0 ? null : sanitizeForAudit(params.after),
      ip: params.req?.ip || "",
      userAgent: String(params.req?.headers["user-agent"] || "").slice(0, 200)
    });
  } catch (e) {
    console.warn("admin_audit write failed:", e);
  }
}
function presenceMetaFromBody(body) {
  const tz = (() => {
    try {
      return Intl.DateTimeFormat().resolvedOptions().timeZone || "";
    } catch {
      return "";
    }
  })();
  return {
    device: String(body.device || "").slice(0, 40),
    os: String(body.os || "").slice(0, 40),
    country: typeof body.country === "string" ? body.country.slice(0, 40) : tz.split("/")[0] || "",
    city: typeof body.city === "string" ? body.city.slice(0, 60) : (tz.split("/")[1] || "").replace(/_/g, " "),
    page: String(body.page || "").slice(0, 120),
    storeName: String(body.storeName || "").slice(0, 80)
  };
}
router2.post("/heartbeat", async (req, res) => {
  const body = req.body || {};
  const token = tokenFromRequest(req);
  if (!token) {
    res.status(401).json({ error: "Non authentifi\xE9." });
    return;
  }
  let uid = "";
  let email = "";
  let storeName = presenceMetaFromBody(body).storeName;
  if (token.kind === "admin_jwt") {
    const admin = await resolveAdmin(req);
    if (!admin) {
      res.status(403).json({ error: "Session admin invalide." });
      return;
    }
    uid = admin.id;
    email = admin.email;
  } else {
    const fb = await verifyFirebaseIdToken(token.value);
    if (!fb || fb.disabled) {
      res.status(403).json({ error: "Token invalide." });
      return;
    }
    uid = fb.uid;
    email = fb.email;
  }
  if (!rateLimit(`hb:${uid}`, 45e3, 1)) {
    res.status(204).end();
    return;
  }
  const meta = presenceMetaFromBody(body);
  const nowIso = (/* @__PURE__ */ new Date()).toISOString();
  try {
    const ref = (0, import_firestore3.doc)(db, "user_presence", uid);
    const snap = await (0, import_firestore3.getDoc)(ref);
    const existing = snap.exists() ? snap.data() : null;
    const shouldRefreshLogin = !existing?.lastLoginAt || Date.now() - new Date(existing.lastLoginAt).getTime() > 24 * 3600 * 1e3;
    await (0, import_firestore3.setDoc)(ref, {
      uid,
      email,
      lastSeenAt: nowIso,
      ...storeName ? { storeName } : {},
      ...meta.device ? { device: meta.device } : {},
      ...meta.os ? { os: meta.os } : {},
      ...meta.country ? { country: meta.country } : {},
      ...meta.city ? { city: meta.city } : {},
      ...meta.page ? { lastPage: meta.page } : {},
      ...shouldRefreshLogin ? { lastLoginAt: nowIso } : {}
    }, { merge: true });
  } catch (e) {
    console.warn("presence write failed:", e);
  }
  res.status(204).end();
});
router2.get("/me", adminApiGuard(null), (req, res) => {
  const admin = req.admin;
  res.json({
    ok: true,
    admin: { id: admin.id, email: admin.email, role: admin.role, via: admin.via },
    permissions: ROLE_PERMISSIONS[admin.role]
  });
});
function dayKey(d) {
  return d.toISOString().slice(0, 10);
}
async function docsInRange(coll, field, fromIso, toIso) {
  const out = /* @__PURE__ */ new Map();
  const run = async (gte, lt) => {
    try {
      const clamps = lt === null || lt === void 0 ? [(0, import_firestore3.where)(field, ">=", gte)] : [(0, import_firestore3.where)(field, ">=", gte), (0, import_firestore3.where)(field, "<", lt)];
      const snap = await (0, import_firestore3.getDocs)((0, import_firestore3.query)((0, import_firestore3.collection)(db, coll), ...clamps));
      snap.forEach((d) => out.set(d.id, d.data()));
    } catch {
    }
  };
  await run(fromIso, toIso);
  await run(import_firestore3.Timestamp.fromDate(new Date(fromIso)), toIso ? import_firestore3.Timestamp.fromDate(new Date(toIso)) : null);
  return Array.from(out.entries()).map(([id, data]) => ({ id, data }));
}
function isoOf(value) {
  if (typeof value === "string") return value;
  if (value && typeof value === "object") {
    const ts = value;
    try {
      if (typeof ts.toDate === "function") return ts.toDate().toISOString();
      if (typeof ts.seconds === "number") return new Date(ts.seconds * 1e3).toISOString();
      if (typeof ts._seconds === "number") return new Date(ts._seconds * 1e3).toISOString();
    } catch {
    }
  }
  return "";
}
async function sumPaymentsRange(fromIso, toIso) {
  let count = 0;
  let revenue = 0;
  for (const d of await docsInRange("payments", "createdAt", fromIso, toIso)) {
    const v = d.data;
    if (v.status === "completed" || v.status === "validated" || v.status === "valid\xE9") {
      count += 1;
      revenue += Number(v.amountDA) || 0;
    }
  }
  return { count, revenue };
}
async function recomputeStats(days) {
  const today = /* @__PURE__ */ new Date();
  const dailyByDay = /* @__PURE__ */ new Map();
  const bump = (key, field, by = 1) => {
    const cur = dailyByDay.get(key) || { signups: 0, orders: 0, gmv: 0, revenue: 0, carts: 0, cartsRecovered: 0, waMessages: 0 };
    cur[field] += by;
    dailyByDay.set(key, cur);
  };
  {
    const fromIso = new Date(today.getTime() - days * 864e5).toISOString();
    for (const d of await docsInRange("tenants", "createdAt", fromIso, null)) {
      const iso = isoOf(d.data.createdAt);
      if (iso) bump(iso.slice(0, 10), "signups");
    }
  }
  {
    const fromIso = new Date(today.getTime() - days * 864e5).toISOString();
    for (const d of await docsInRange("orders", "createdAt", fromIso, null)) {
      const iso = isoOf(d.data.createdAt);
      if (iso) {
        bump(iso.slice(0, 10), "orders");
        bump(iso.slice(0, 10), "gmv", Number(d.data.total) || 0);
      }
    }
  }
  const todayMidnight = new Date(today);
  todayMidnight.setUTCHours(0, 0, 0, 0);
  for (let offset = days - 1; offset >= 0; offset -= 1) {
    const dayStart = new Date(todayMidnight.getTime() - offset * 864e5);
    const fromIso = dayStart.toISOString();
    const toIso = new Date(dayStart.getTime() + 864e5).toISOString();
    const { count, revenue } = await sumPaymentsRange(fromIso, toIso);
    if (count > 0) {
      bump(fromIso.slice(0, 10), "revenue", revenue);
    }
  }
  {
    const fromIso = new Date(today.getTime() - days * 864e5).toISOString();
    for (const d of await docsInRange("abandoned_carts", "createdAt", fromIso, null)) {
      const iso = isoOf(d.data.createdAt);
      if (!iso) continue;
      bump(iso.slice(0, 10), "carts");
      if (d.data.status === "recovered" || d.data.recovered === true) bump(iso.slice(0, 10), "cartsRecovered");
    }
    for (const d of await docsInRange("whatsapp_messages", "sentAt", fromIso, null)) {
      const iso = isoOf(d.data.sentAt);
      if (iso) bump(iso.slice(0, 10), "waMessages");
    }
  }
  const nowIso = (/* @__PURE__ */ new Date()).toISOString();
  for (const [date, stats] of dailyByDay) {
    await (0, import_firestore3.setDoc)((0, import_firestore3.doc)(db, "platform_stats", "daily_" + date), { date, ...stats, updatedAt: nowIso }, { merge: true });
  }
  const monthly = /* @__PURE__ */ new Map();
  for (let offset = 0; offset < 365; offset += 1) {
    const d = new Date(today.getTime() - offset * 864e5);
    const key = d.toISOString().slice(0, 7);
    try {
      const snap = await (0, import_firestore3.getDoc)((0, import_firestore3.doc)(db, "platform_stats", "daily_" + d.toISOString().slice(0, 10)));
      if (snap.exists()) {
        const v = snap.data();
        const cur = monthly.get(key) || { signups: 0, orders: 0, gmv: 0, revenue: 0 };
        cur.signups += Number(v.signups) || 0;
        cur.orders += Number(v.orders) || 0;
        cur.gmv += Number(v.gmv) || 0;
        cur.revenue += Number(v.revenue) || 0;
        monthly.set(key, cur);
      }
    } catch {
    }
  }
  for (const [month, stats] of monthly) {
    await (0, import_firestore3.setDoc)((0, import_firestore3.doc)(db, "platform_stats", "monthly_" + month), { month, ...stats, updatedAt: nowIso }, { merge: true });
  }
  const oneYearAgo = new Date(today.getTime() - 365 * 864e5).toISOString();
  const [membersTotal, storesActive, ordersTotal, paymentsYear, cartsAbandoned, cartsRecovered, waMessages] = await Promise.all([
    docsInRange("tenants", "createdAt", "1970-01-01T00:00:00.000Z", (/* @__PURE__ */ new Date()).toISOString()).then((r) => r.length),
    (async () => {
      try {
        const snap = await (0, import_firestore3.getDocs)((0, import_firestore3.query)((0, import_firestore3.collection)(db, "tenants"), (0, import_firestore3.where)("status", "==", "active")));
        return snap.size;
      } catch {
        return 0;
      }
    })(),
    docsInRange("orders", "createdAt", "1970-01-01T00:00:00.000Z", (/* @__PURE__ */ new Date()).toISOString()).then((r) => r.length),
    sumPaymentsRange(oneYearAgo, (/* @__PURE__ */ new Date()).toISOString()),
    docsInRange("abandoned_carts", "createdAt", "1970-01-01T00:00:00.000Z", (/* @__PURE__ */ new Date()).toISOString()).then((r) => r.length),
    (async () => {
      try {
        const snap = await (0, import_firestore3.getDocs)((0, import_firestore3.query)((0, import_firestore3.collection)(db, "abandoned_carts"), (0, import_firestore3.where)("status", "==", "recovered")));
        return snap.size;
      } catch {
        return 0;
      }
    })(),
    docsInRange("whatsapp_messages", "sentAt", "1970-01-01T00:00:00.000Z", (/* @__PURE__ */ new Date()).toISOString()).then((r) => r.length)
  ]);
  await (0, import_firestore3.setDoc)((0, import_firestore3.doc)(db, "platform_counters", "global"), {
    membersTotal,
    storesActive,
    ordersTotal,
    gmvTotal: 0,
    revenueTotal: paymentsYear.revenue,
    paymentsValidated: paymentsYear.count,
    cartsAbandonedTotal: cartsAbandoned,
    cartsRecoveredTotal: cartsRecovered,
    waMessagesTotal: waMessages,
    updatedAt: nowIso
  }, { merge: true });
  return { daysWritten: dailyByDay.size, monthsWritten: monthly.size };
}
router2.post("/stats/recompute", adminApiGuard("settings"), async (req, res) => {
  try {
    const body = req.body || {};
    const days = Math.min(120, Math.max(7, Number(body.days) || 30));
    const result = await recomputeStats(days);
    const admin = req.admin;
    await logAdminAudit({ actor: admin, action: "stats.recompute", target: `days=${days}`, after: result, req });
    res.json({ ok: true, ...result });
  } catch (e) {
    console.error("stats recompute error:", e);
    res.status(500).json({ error: "\xC9chec du recalcul.", detail: String(e?.message || e).slice(0, 200) });
  }
});
router2.get("/overview", adminApiGuard("dashboard"), async (req, res) => {
  try {
    const days = [7, 30, 90].includes(Number(req.query.days)) ? Number(req.query.days) : 30;
    const now = Date.now();
    const countersSnap = await (0, import_firestore3.getDoc)((0, import_firestore3.doc)(db, "platform_counters", "global")).catch(() => null);
    const counters = countersSnap?.exists() ? countersSnap.data() : {};
    const daily = [];
    for (let offset = days - 1; offset >= 0; offset -= 1) {
      const key = dayKey(new Date(now - offset * 864e5));
      try {
        const snap = await (0, import_firestore3.getDoc)((0, import_firestore3.doc)(db, "platform_stats", "daily_" + key));
        if (snap.exists()) daily.push({ date: key, ...snap.data() });
        else daily.push({ date: key });
      } catch {
        daily.push({ date: key });
      }
    }
    const monthly = [];
    for (let offset = 11; offset >= 0; offset -= 1) {
      const d = /* @__PURE__ */ new Date();
      d.setMonth(d.getMonth() - offset, 1);
      const key = d.toISOString().slice(0, 7);
      try {
        const snap = await (0, import_firestore3.getDoc)((0, import_firestore3.doc)(db, "platform_stats", "monthly_" + key));
        if (snap.exists()) monthly.push({ month: key, ...snap.data() });
        else monthly.push({ month: key });
      } catch {
        monthly.push({ month: key });
      }
    }
    let onlineNow = 0;
    let active30d = 0;
    try {
      const twoMinAgo = new Date(now - 2 * 6e4).toISOString();
      const snap = await (0, import_firestore3.getDocs)((0, import_firestore3.query)((0, import_firestore3.collection)(db, "user_presence"), (0, import_firestore3.where)("lastSeenAt", ">", twoMinAgo), (0, import_firestore3.limit)(200)));
      onlineNow = snap.size;
      const monthAgo = new Date(now - 30 * 864e5).toISOString();
      const snap30 = await (0, import_firestore3.getDocs)((0, import_firestore3.query)((0, import_firestore3.collection)(db, "user_presence"), (0, import_firestore3.where)("lastSeenAt", ">", monthAgo), (0, import_firestore3.limit)(1e3)));
      active30d = snap30.size;
    } catch {
    }
    const sum = (field) => daily.reduce((acc, d) => acc + (Number(d[field]) || 0), 0);
    const signupsPeriod = sum("signups");
    const signupsToday = Number(daily[daily.length - 1]?.signups) || 0;
    const signupsWeek = daily.slice(-7).reduce((acc, d) => acc + (Number(d.signups) || 0), 0);
    const revenueMonth = monthly[monthly.length - 1] ? Number(monthly[monthly.length - 1].revenue) || 0 : 0;
    const latestSignups = [];
    try {
      const snap = await (0, import_firestore3.getDocs)((0, import_firestore3.query)((0, import_firestore3.collection)(db, "tenants"), (0, import_firestore3.orderBy)("createdAt", "desc"), (0, import_firestore3.limit)(5)));
      snap.forEach((d) => {
        const v = d.data();
        latestSignups.push({
          id: d.id,
          storeName: String(v.storeName || ""),
          ownerEmail: String(v.ownerEmail || ""),
          createdAt: typeof v.createdAt === "string" ? v.createdAt : "",
          plan: String(v.plan || "")
        });
      });
    } catch {
    }
    const latestPayments = [];
    try {
      const snap = await (0, import_firestore3.getDocs)((0, import_firestore3.query)((0, import_firestore3.collection)(db, "payments"), (0, import_firestore3.orderBy)("createdAt", "desc"), (0, import_firestore3.limit)(5)));
      snap.forEach((d) => {
        const v = d.data();
        latestPayments.push({
          id: d.id,
          storeName: String(v.storeName || ""),
          amountDA: Number(v.amountDA) || 0,
          status: String(v.status || ""),
          method: String(v.paymentMethod || ""),
          createdAt: typeof v.createdAt === "string" ? v.createdAt : ""
        });
      });
    } catch {
    }
    const alerts = [];
    try {
      const snap = await (0, import_firestore3.getDocs)((0, import_firestore3.query)((0, import_firestore3.collection)(db, "payments"), (0, import_firestore3.where)("status", "==", "pending"), (0, import_firestore3.limit)(5)));
      snap.forEach((d) => {
        const v = d.data();
        alerts.push({ type: "payment_pending", label: String(v.storeName || "Boutique"), detail: `${Number(v.amountDA) || 0} DZD en attente de validation` });
      });
    } catch {
    }
    const nowIso = (/* @__PURE__ */ new Date()).toISOString();
    const in7dIso = new Date(now + 7 * 864e5).toISOString();
    let expiringCount = 0;
    let expiredCount = 0;
    try {
      const snap = await (0, import_firestore3.getDocs)((0, import_firestore3.query)((0, import_firestore3.collection)(db, "tenants"), (0, import_firestore3.where)("planExpiresAt", ">", nowIso), (0, import_firestore3.where)("planExpiresAt", "<", in7dIso), (0, import_firestore3.limit)(20)));
      expiringCount = snap.size;
      const snapExpired = await (0, import_firestore3.getDocs)((0, import_firestore3.query)((0, import_firestore3.collection)(db, "tenants"), (0, import_firestore3.where)("planExpiresAt", "<", nowIso), (0, import_firestore3.limit)(500)));
      expiredCount = snapExpired.size;
    } catch {
    }
    if (expiringCount > 0) alerts.push({ type: "subs_expiring", label: `${expiringCount} abonnement(s)`, detail: "Expirent dans les 7 prochains jours" });
    if (expiredCount > 0) alerts.push({ type: "subs_expired", label: `${expiredCount} abonnement(s) expir\xE9(s)`, detail: "Sans plan actif actuellement" });
    if (!counters.updatedAt) alerts.push({ type: "stats_never_computed", label: "Statistiques jamais calcul\xE9es", detail: "Lancer \xAB Recalculer les statistiques \xBB" });
    let activeSubs = 0;
    try {
      const snap = await (0, import_firestore3.getDocs)((0, import_firestore3.query)((0, import_firestore3.collection)(db, "tenants"), (0, import_firestore3.where)("planExpiresAt", ">", nowIso), (0, import_firestore3.limit)(1e3)));
      activeSubs = snap.size;
    } catch {
    }
    res.json({
      ok: true,
      periodDays: days,
      kpis: {
        membersTotal: Number(counters.membersTotal) || 0,
        membersActive30d: active30d,
        onlineNow,
        signupsToday,
        signupsWeek,
        signupsPeriod,
        storesActive: Number(counters.storesActive) || 0,
        revenueMonth,
        activeSubscriptions: activeSubs,
        expiredSubscriptions: expiredCount,
        ordersTotal: Number(counters.ordersTotal) || 0,
        gmvPeriod: sum("gmv"),
        ordersPeriod: sum("orders"),
        cartsAbandonedTotal: Number(counters.cartsAbandonedTotal) || 0,
        cartsRecoveredTotal: Number(counters.cartsRecoveredTotal) || 0,
        waMessagesTotal: Number(counters.waMessagesTotal) || 0,
        paymentsPending: alerts.filter((a) => a.type === "payment_pending").length
      },
      series: { daily, monthly },
      latestSignups,
      latestPayments,
      alerts,
      statsUpdatedAt: String(counters.updatedAt || "")
    });
  } catch (e) {
    console.error("admin overview error:", e);
    res.status(500).json({ error: "Erreur du tableau de bord admin." });
  }
});
router2.get("/audit", adminApiGuard("audit"), async (req, res) => {
  try {
    const maxLimit = Math.min(200, Math.max(10, Number(req.query.limit) || 50));
    const actionFilter = String(req.query.action || "").trim().toLowerCase();
    const actorFilter = String(req.query.actor || "").trim().toLowerCase();
    const before = String(req.query.before || "");
    let q = (0, import_firestore3.query)((0, import_firestore3.collection)(db, "admin_audit"), (0, import_firestore3.orderBy)("at", "desc"), (0, import_firestore3.limit)(actionFilter || actorFilter ? 200 : maxLimit));
    if (before) {
      q = (0, import_firestore3.query)((0, import_firestore3.collection)(db, "admin_audit"), (0, import_firestore3.orderBy)("at", "desc"), (0, import_firestore3.startAfter)(before), (0, import_firestore3.limit)(actionFilter || actorFilter ? 200 : maxLimit));
    }
    const snap = await (0, import_firestore3.getDocs)(q);
    const entries = [];
    snap.forEach((d) => {
      const v = d.data();
      if (actionFilter && !String(v.action || "").toLowerCase().includes(actionFilter)) return;
      if (actorFilter && !String(v.actorEmail || "").toLowerCase().includes(actorFilter)) return;
      entries.push({ id: d.id, ...v });
    });
    const filtered = actionFilter || actorFilter ? entries.slice(0, maxLimit) : entries;
    res.json({
      ok: true,
      entries: filtered,
      nextBefore: filtered.length === maxLimit && snap.size === maxLimit ? String(filtered[filtered.length - 1].at || "") : ""
    });
  } catch (e) {
    res.status(500).json({ error: "Erreur du journal d'audit." });
  }
});
router2.get("/presence", adminApiGuard("dashboard"), async (req, res) => {
  try {
    const twoMinAgo = new Date(Date.now() - 2 * 6e4).toISOString();
    const snap = await (0, import_firestore3.getDocs)((0, import_firestore3.query)((0, import_firestore3.collection)(db, "user_presence"), (0, import_firestore3.where)("lastSeenAt", ">", twoMinAgo), (0, import_firestore3.limit)(100)));
    const users = [];
    snap.forEach((d) => {
      const v = d.data();
      users.push({
        uid: d.id,
        email: String(v.email || ""),
        storeName: String(v.storeName || ""),
        device: String(v.device || ""),
        country: String(v.country || ""),
        city: String(v.city || ""),
        lastSeenAt: String(v.lastSeenAt || "")
      });
    });
    res.json({ ok: true, online: users.length, users });
  } catch {
    res.json({ ok: true, online: 0, users: [] });
  }
});
var adminApi_default = router2;

// server.ts
var import_multer = __toESM(require("multer"));
var import_crypto3 = __toESM(require("crypto"));
var import_nodemailer = __toESM(require("nodemailer"));
var import_firestore5 = require("firebase/firestore");
var import_cloudinary = require("cloudinary");
var import_stream = require("stream");

// src/lib/whatsappOwner.ts
function formatPhoneForWhatsApp(phone) {
  if (!phone) return "";
  const digits = phone.replace(/\D/g, "");
  if (digits.startsWith("00213")) return digits.slice(2);
  if (digits.startsWith("213")) return digits;
  if (digits.startsWith("0")) return `213${digits.slice(1)}`;
  return digits.length === 9 ? `213${digits}` : digits;
}
async function sendOwnerWhatsAppNotification(payload) {
  const { ownerPhone, orderNumber, clientName, clientPhone, wilaya, total, itemsSummary, storeName, callmebotApiKey } = payload;
  const formattedOwnerPhone = formatPhoneForWhatsApp(ownerPhone);
  if (!formattedOwnerPhone) {
    return {
      success: false,
      method: "none",
      error: "Num\xE9ro de t\xE9l\xE9phone du propri\xE9taire manquant ou invalide."
    };
  }
  const storeLabel = storeName || "Votre boutique Enova";
  const textMessage = `\u{1F6D2} *NOUVELLE COMMANDE RE\xC7UE !*
\u{1F3EA} *Boutique :* ${storeLabel}
\u{1F522} *N\xB0 Commande :* #${orderNumber}
\u{1F464} *Client :* ${clientName} (${clientPhone})
\u{1F4CD} *Wilaya :* ${wilaya}
\u{1F4E6} *Articles :* ${itemsSummary}
\u{1F4B0} *Montant Total :* ${Number(total || 0).toLocaleString()} DZD

Connectez-vous \xE0 votre tableau de bord pour traiter la commande.`;
  const metaToken = process.env.WHATSAPP_TOKEN;
  const metaPhoneId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const templateName = process.env.WHATSAPP_TEMPLATE_NAME || "new_order_owner";
  if (metaToken && metaPhoneId) {
    try {
      console.log(`[WHATSAPP OWNER] Attempting Meta Cloud API dispatch to ${formattedOwnerPhone}...`);
      const metaUrl = `https://graph.facebook.com/v21.0/${metaPhoneId}/messages`;
      let res = await fetch(metaUrl, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${metaToken}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          recipient_type: "individual",
          to: formattedOwnerPhone,
          type: "text",
          text: { body: textMessage }
        })
      });
      let data = await res.json();
      if (!res.ok && data?.error?.code === 131047) {
        console.log(`[WHATSAPP OWNER] 24h window closed, falling back to template: ${templateName}`);
        res = await fetch(metaUrl, {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${metaToken}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            messaging_product: "whatsapp",
            to: formattedOwnerPhone,
            type: "template",
            template: {
              name: templateName,
              language: { code: "fr" },
              components: [
                {
                  type: "body",
                  parameters: [
                    { type: "text", text: orderNumber },
                    { type: "text", text: clientName },
                    { type: "text", text: clientPhone },
                    { type: "text", text: wilaya },
                    { type: "text", text: `${total} DZD` }
                  ]
                }
              ]
            }
          })
        });
        data = await res.json();
      }
      if (res.ok && data?.messages?.[0]?.id) {
        console.log(`[WHATSAPP OWNER] Meta API success! Message ID: ${data.messages[0].id}`);
        return {
          success: true,
          method: "meta_cloud_api",
          messageId: data.messages[0].id
        };
      } else {
        console.warn(`[WHATSAPP OWNER] Meta API response error:`, data);
      }
    } catch (metaErr) {
      console.error(`[WHATSAPP OWNER] Meta API exception:`, metaErr);
    }
  }
  if (callmebotApiKey && callmebotApiKey.trim()) {
    try {
      console.log(`[WHATSAPP OWNER] Attempting CallMeBot dispatch to ${formattedOwnerPhone}...`);
      const encodedMsg = encodeURIComponent(textMessage);
      const callmebotUrl = `https://api.callmebot.com/whatsapp.php?phone=+${formattedOwnerPhone}&text=${encodedMsg}&apikey=${encodeURIComponent(callmebotApiKey.trim())}`;
      const res = await fetch(callmebotUrl);
      const respText = await res.text();
      if (res.ok && (respText.includes("Message Queued") || respText.includes("OK") || respText.includes("success") || respText.includes("200"))) {
        console.log(`[WHATSAPP OWNER] CallMeBot success!`);
        return {
          success: true,
          method: "callmebot"
        };
      } else {
        console.warn(`[WHATSAPP OWNER] CallMeBot response:`, respText);
        return {
          success: false,
          method: "callmebot",
          error: `CallMeBot error: ${respText.slice(0, 100)}`
        };
      }
    } catch (cmbErr) {
      console.error(`[WHATSAPP OWNER] CallMeBot exception:`, cmbErr);
      return {
        success: false,
        method: "callmebot",
        error: cmbErr.message || "Erreur r\xE9seau CallMeBot"
      };
    }
  }
  console.log(`[WHATSAPP OWNER] WhatsApp not configured for automatic dispatch.`);
  return {
    success: false,
    method: "none",
    error: "WhatsApp automatique non configur\xE9 (variables Meta Cloud API ou cl\xE9 CallMeBot requise dans les param\xE8tres)."
  };
}

// server.ts
init_date();

// src/lib/whatsappServer.ts
var import_crypto2 = __toESM(require("crypto"));
var import_firestore4 = require("firebase/firestore");
init_landingData();

// src/lib/whatsappDefaults.ts
var WA_DEFAULT_MESSAGE_AR = "\u0645\u0631\u062D\u0628\u0627\u064B {nom} \u{1F44B}\n\u0644\u0642\u062F \u0628\u062F\u0623\u062A \u0637\u0644\u0628\u0627\u064B \u0641\u064A \u0645\u062A\u062C\u0631 {boutique} :\n\u{1F4E6} {produits}\n\u{1F4B0} \u0627\u0644\u0625\u062C\u0645\u0627\u0644\u064A : {total} \u062F\u062C (\u0627\u0644\u062F\u0641\u0639 \u0639\u0646\u062F \u0627\u0644\u0627\u0633\u062A\u0644\u0627\u0645)\n\u{1F4CD} {wilaya}\n\n\u0647\u0644 \u062A\u0631\u064A\u062F \u062A\u0623\u0643\u064A\u062F \u0637\u0644\u0628\u0643 \u061F\n\u{1F517} {lien}";
var WA_DEFAULT_MESSAGE_FR = "Bonjour {nom} \u{1F44B}\nVous avez commenc\xE9 une commande chez {boutique} :\n\u{1F4E6} {produits}\n\u{1F4B0} Total : {total} DA (paiement \xE0 la livraison)\n\u{1F4CD} {wilaya}\n\nSouhaitez-vous confirmer votre commande ?\n\u{1F517} {lien}";
var WA_ORDER_CONFIRM_AR = "\u0645\u0631\u062D\u0628\u0627\u064B {nom} \u{1F44B}\n\u062A\u0645 \u062A\u0633\u062C\u064A\u0644 \u0637\u0644\u0628\u0643 \u0641\u064A \u0645\u062A\u062C\u0631 {boutique} \u2705\n\u{1F4E6} {produits}\n\u{1F4B0} \u0627\u0644\u0625\u062C\u0645\u0627\u0644\u064A : {total} \u062F\u062C\n\u{1F4CD} {wilaya}\n\n\u064A\u0631\u062C\u0649 \u062A\u0623\u0643\u064A\u062F \u0637\u0644\u0628\u0643 :\n\u{1F517} {lien}";
var WA_ORDER_CONFIRM_FR = "Bonjour {nom} \u{1F44B}\nVotre commande chez {boutique} a bien \xE9t\xE9 enregistr\xE9e \u2705\n\u{1F4E6} {produits}\n\u{1F4B0} Total : {total} DA\n\u{1F4CD} {wilaya}\n\nMerci de confirmer votre commande :\n\u{1F517} {lien}";
var WA_ORDER_STATUS_AR = {
  "Confirm\xE9e": "\u062A\u0645 \u062A\u0623\u0643\u064A\u062F \u0637\u0644\u0628\u0643 \u2705",
  "Exp\xE9di\xE9e": "\u062A\u0645 \u0634\u062D\u0646 \u0637\u0644\u0628\u0643 \u{1F69A}",
  "En livraison": "\u0637\u0644\u0628\u0643 \u0641\u064A \u0627\u0644\u0637\u0631\u064A\u0642 \u0625\u0644\u064A\u0643 \u{1F69A}",
  "Au bureau de livraison": "\u0637\u0644\u0628\u0643 \u0648\u0635\u0644 \u0625\u0644\u0649 \u0645\u0643\u062A\u0628 \u0627\u0644\u062A\u0648\u0635\u064A\u0644 \u{1F3E2} \u064A\u0645\u0643\u0646\u0643 \u0627\u0633\u062A\u0644\u0627\u0645\u0647 \u0627\u0644\u0622\u0646.",
  "Livr\xE9e": "\u062A\u0645 \u062A\u0648\u0635\u064A\u0644 \u0637\u0644\u0628\u0643 \u0628\u0646\u062C\u0627\u062D \u{1F389} \u0634\u0643\u0631\u0627\u064B \u0644\u062B\u0642\u062A\u0643!",
  "\xC9chec": "\u062A\u0639\u0630\u0631 \u062A\u0648\u0635\u064A\u0644 \u0637\u0644\u0628\u0643 \u274C \u064A\u0631\u062C\u0649 \u0627\u0644\u062A\u0648\u0627\u0635\u0644 \u0645\u0639\u0646\u0627.",
  "Retour": "\u062A\u0645 \u0625\u0631\u062C\u0627\u0639 \u0637\u0644\u0628\u0643 \u0625\u0644\u0649 \u0627\u0644\u0645\u062A\u062C\u0631 \u21A9\uFE0F"
};
var WA_ORDER_STATUS_FR = {
  "Confirm\xE9e": "Votre commande est confirm\xE9e \u2705",
  "Exp\xE9di\xE9e": "Votre commande a \xE9t\xE9 exp\xE9di\xE9e \u{1F69A}",
  "En livraison": "Votre commande est en cours de livraison \u{1F69A}",
  "Au bureau de livraison": "Votre commande est arriv\xE9e au bureau de livraison \u{1F3E2} vous pouvez la r\xE9cup\xE9rer.",
  "Livr\xE9e": "Votre commande a \xE9t\xE9 livr\xE9e avec succ\xE8s \u{1F389} merci de votre confiance !",
  "\xC9chec": "La livraison de votre commande a \xE9chou\xE9 \u274C merci de nous contacter.",
  "Retour": "Votre commande a \xE9t\xE9 retourn\xE9e au magasin \u21A9\uFE0F"
};

// src/lib/whatsappServer.ts
var WA_REMINDER_MINUTES = 240;
var DZ_TZ = "Africa/Algiers";
var WA_NOTIFIABLE_STATUSES = [
  "Confirm\xE9e",
  "Exp\xE9di\xE9e",
  "En livraison",
  "Au bureau de livraison",
  "Livr\xE9e",
  "\xC9chec",
  "Retour"
];
function isCloudApiConfigured() {
  return Boolean(process.env.WHATSAPP_TOKEN && process.env.WHATSAPP_PHONE_NUMBER_ID);
}
function waBaseUrl() {
  return String(process.env.APP_URL || "https://e-nova-saas.vercel.app").replace(/\/+$/, "");
}
var settingsCache = /* @__PURE__ */ new Map();
function waDefaultSettings() {
  return {
    enabled: false,
    orderConfirmations: { enabled: true },
    abandonedCarts: {
      enabled: false,
      delayMinutes: 10,
      reminderEnabled: false,
      messageAr: WA_DEFAULT_MESSAGE_AR,
      messageFr: WA_DEFAULT_MESSAGE_FR
    },
    quietHours: { enabled: false, start: "22:00", end: "08:00" },
    language: "store",
    scope: { mode: "all", productIds: [] },
    consentCheckbox: false,
    connectionStatus: "disconnected"
  };
}
async function getWaSettings(tenantId) {
  const cached = settingsCache.get(tenantId);
  if (cached && Date.now() - cached.at < 1e4) return cached.data;
  let data = waDefaultSettings();
  try {
    const snap = await (0, import_firestore4.getDoc)((0, import_firestore4.doc)(db, "whatsapp_settings", tenantId));
    if (snap.exists()) {
      const raw = snap.data() || {};
      const d = waDefaultSettings();
      data = {
        enabled: raw.enabled === true,
        orderConfirmations: { enabled: raw.orderConfirmations?.enabled !== false },
        abandonedCarts: {
          enabled: raw.abandonedCarts?.enabled === true,
          delayMinutes: [5, 10, 30, 60].includes(raw.abandonedCarts?.delayMinutes) ? raw.abandonedCarts.delayMinutes : 10,
          reminderEnabled: raw.abandonedCarts?.reminderEnabled === true,
          messageAr: String(raw.abandonedCarts?.messageAr || WA_DEFAULT_MESSAGE_AR).slice(0, 1500),
          messageFr: String(raw.abandonedCarts?.messageFr || WA_DEFAULT_MESSAGE_FR).slice(0, 1500)
        },
        quietHours: {
          enabled: raw.quietHours?.enabled === true,
          start: String(raw.quietHours?.start || "22:00").slice(0, 5),
          end: String(raw.quietHours?.end || "08:00").slice(0, 5)
        },
        language: raw.language === "ar" || raw.language === "fr" ? raw.language : "store",
        scope: {
          mode: raw.scope?.mode === "selected" ? "selected" : "all",
          productIds: Array.isArray(raw.scope?.productIds) ? raw.scope.productIds.map((p) => String(p).slice(0, 60)) : []
        },
        consentCheckbox: raw.consentCheckbox === true,
        connectionStatus: raw.connectionStatus === "connected" || raw.connectionStatus === "pending" ? raw.connectionStatus : "disconnected"
      };
    }
  } catch (e) {
    console.warn("getWaSettings: read failed:", e);
  }
  settingsCache.set(tenantId, { at: Date.now(), data });
  return data;
}
function dzHourMinute() {
  try {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone: DZ_TZ,
      hour: "numeric",
      minute: "numeric",
      hour12: false
    }).format(/* @__PURE__ */ new Date()).split(":").map(Number);
    return { h: parts[0] % 24, m: parts[1] || 0 };
  } catch {
    const d = /* @__PURE__ */ new Date();
    return { h: d.getUTCHours() + 1, m: d.getUTCMinutes() };
  }
}
function parseHM(v) {
  const [h, m] = String(v || "0:0").split(":").map(Number);
  return (h || 0) * 60 + (m || 0);
}
function inQuietHours(s) {
  if (!s.quietHours.enabled || !s.quietHours.start || !s.quietHours.end) return false;
  const now = dzHourMinute();
  const cur = now.h * 60 + now.m;
  const start = parseHM(s.quietHours.start);
  const end = parseHM(s.quietHours.end);
  if (start === end) return false;
  return start > end ? cur >= start || cur < end : cur >= start && cur < end;
}
async function waSendText(toDigits, body) {
  const to = toDigits.replace(/^0/, "213");
  if (!isCloudApiConfigured()) {
    return { ok: true, simulated: true, waMessageId: `sim_${import_crypto2.default.randomUUID()}` };
  }
  try {
    const url = `https://graph.facebook.com/v21.0/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`;
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.WHATSAPP_TOKEN}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to,
        type: "text",
        text: { preview_url: true, body: body.slice(0, 4096) }
      })
    });
    const j = await res.json().catch(() => ({}));
    if (!res.ok) {
      const errObj = j.error;
      const detail = errObj?.message ? `Meta ${errObj.code ?? ""}${errObj.error_subcode ? "/" + errObj.error_subcode : ""} ${errObj.message}`.trim() : `HTTP ${res.status} ${JSON.stringify(j).slice(0, 160)}`;
      return { ok: false, simulated: false, waMessageId: "", error: detail };
    }
    const mid = j.messages?.[0]?.id || `wa_${Date.now()}`;
    return { ok: true, simulated: false, waMessageId: mid };
  } catch (e) {
    return { ok: false, simulated: false, waMessageId: "", error: waErrText(e) };
  }
}
function waErrText(e) {
  if (e instanceof Error) return e.message || e.name;
  if (typeof e === "string") return e;
  try {
    return JSON.stringify(e).slice(0, 200);
  } catch {
    return String(e);
  }
}
async function logWaMessage(msg) {
  const id = `wa_${Date.now().toString(36)}_${import_crypto2.default.randomUUID().slice(0, 8)}`;
  const clean = {
    sentAt: msg.sentAt || (/* @__PURE__ */ new Date()).toISOString(),
    createdAt: (/* @__PURE__ */ new Date()).toISOString()
  };
  for (const [k, v] of Object.entries(msg)) {
    if (v !== void 0) clean[k] = v;
  }
  await (0, import_firestore4.setDoc)((0, import_firestore4.doc)(db, "whatsapp_messages", id), clean);
  return id;
}
async function findMessagesByCart(cartId, kinds) {
  const out = [];
  const snap = await (0, import_firestore4.getDocs)((0, import_firestore4.query)((0, import_firestore4.collection)(db, "whatsapp_messages"), (0, import_firestore4.where)("cartId", "==", cartId)));
  snap.forEach((d) => {
    const data = d.data() || {};
    if (kinds.includes(String(data.kind))) out.push({ id: d.id, data });
  });
  return out;
}
async function isUnsubscribed(tenantId, phoneDigits) {
  try {
    const globalSnap = await (0, import_firestore4.getDoc)((0, import_firestore4.doc)(db, "whatsapp_unsubscribes", `global_${phoneDigits}`));
    if (globalSnap.exists()) return true;
    const snap = await (0, import_firestore4.getDoc)((0, import_firestore4.doc)(db, "whatsapp_unsubscribes", `${tenantId}_${phoneDigits}`));
    return snap.exists();
  } catch {
    return false;
  }
}
async function markUnsubscribed(tenantId, phoneDigits, source) {
  await (0, import_firestore4.setDoc)((0, import_firestore4.doc)(db, "whatsapp_unsubscribes", `${tenantId}_${phoneDigits}`), {
    tenantId,
    phoneDigits,
    source,
    stoppedAt: (/* @__PURE__ */ new Date()).toISOString()
  }, { merge: true });
}
var STOP_KEYWORDS = ["stop", "STOP", "Stop", "\u0625\u064A\u0642\u0627\u0641", "\u0627\u0644\u063A\u0627\u0621 \u0627\u0644\u0627\u0634\u062A\u0631\u0627\u0643", "\u0625\u0644\u063A\u0627\u0621 \u0627\u0644\u0627\u0634\u062A\u0631\u0627\u0643", "unsubscribe", "D\xC9SISTER"];
function renderWaTemplate(tpl, vars) {
  return tpl.replace(/\{(\w+)\}/g, (m, k) => k in vars ? vars[k] : m);
}
function cartItemsSummary(items) {
  const list = Array.isArray(items) ? items.slice(0, 5) : [];
  const parts = list.map((it) => {
    const name = String(it.name || "\u0645\u0646\u062A\u062C");
    const qty = Number(it.quantity ?? it.qty) || 1;
    return `${name} x${qty}`;
  });
  return parts.join("\u060C ") || "\u2014";
}
function resolveLang(settings, cartLang) {
  if (settings.language === "ar" || settings.language === "fr") return settings.language;
  return cartLang === "fr" ? "fr" : "ar";
}
function resolveTenantName(tenantData) {
  return String(tenantData.storeName || tenantData.name || "\u0627\u0644\u0645\u062A\u062C\u0631").slice(0, 60);
}
function toMs(v) {
  try {
    if (!v) return 0;
    if (typeof v === "object" && typeof v.toMillis === "function") {
      return v.toMillis();
    }
    const t = new Date(String(v)).getTime();
    return Number.isFinite(t) ? t : 0;
  } catch {
    return 0;
  }
}
var lastProcessAt = 0;
var PROCESS_MIN_INTERVAL_MS = 60 * 1e3;
async function processWhatsAppQueue(force) {
  const summary = {
    cartsSent: 0,
    remindersSent: 0,
    orderConfirmsSent: 0,
    statusNotificationsSent: 0,
    skippedQuietHours: 0,
    errors: [],
    cloudApi: isCloudApiConfigured()
  };
  if (!force && Date.now() - lastProcessAt < PROCESS_MIN_INTERVAL_MS) return summary;
  lastProcessAt = Date.now();
  try {
    const snap = await (0, import_firestore4.getDocs)((0, import_firestore4.query)((0, import_firestore4.collection)(db, "abandoned_carts"), (0, import_firestore4.where)("status", "==", "abandoned")));
    for (const d of snap.docs) {
      try {
        const cart = d.data() || {};
        const tenantId = String(cart.tenantId || "");
        if (!tenantId) continue;
        const settings = await getWaSettings(tenantId);
        if (!settings.enabled || !settings.abandonedCarts.enabled) continue;
        const digits = String(cart.phoneDigits || "");
        if (!/^0[567]\d{8}$/.test(digits)) continue;
        if (await isUnsubscribed(tenantId, digits)) continue;
        if (settings.consentCheckbox && cart.consentChecked !== true) continue;
        const firstProductId = String(cart.items?.[0]?.productId || "");
        if (settings.scope.mode === "selected" && !settings.scope.productIds.includes(firstProductId)) continue;
        try {
          const ordersSnap = await (0, import_firestore4.getDocs)((0, import_firestore4.query)((0, import_firestore4.collection)(db, "orders"), (0, import_firestore4.where)("phone", "==", digits)));
          let hasOrder = false;
          ordersSnap.forEach((o) => {
            if ((o.data() || {}).userId === tenantId) hasOrder = true;
          });
          if (hasOrder) continue;
        } catch {
        }
        const updatedAtMs = toMs(cart.updatedAt) || toMs(cart.createdAt);
        if (!updatedAtMs) continue;
        const dueMs = updatedAtMs + settings.abandonedCarts.delayMinutes * 6e4;
        const sent = await findMessagesByCart(d.id, ["cart"]);
        const reminders = await findMessagesByCart(d.id, ["cart_reminder"]);
        if (sent.length === 0) {
          if (Date.now() < dueMs) continue;
          if (inQuietHours(settings)) {
            summary.skippedQuietHours++;
            continue;
          }
          const r = await sendCartMessage(d.id, cart, tenantId, settings, "cart");
          if (r) summary.cartsSent++;
          else summary.errors.push(`cart ${d.id}`);
        } else if (reminders.length === 0 && settings.abandonedCarts.reminderEnabled) {
          const sentAt = toMs(sent[0].data.sentAt);
          if (Date.now() < sentAt + WA_REMINDER_MINUTES * 6e4) continue;
          if (toMs(cart.waRepliedAt) > 0) continue;
          if (inQuietHours(settings)) {
            summary.skippedQuietHours++;
            continue;
          }
          const r = await sendCartMessage(d.id, cart, tenantId, settings, "cart_reminder");
          if (r) summary.remindersSent++;
          else summary.errors.push(`reminder ${d.id}`);
        }
      } catch (e) {
        summary.errors.push(String(e.message || e).slice(0, 120));
      }
    }
  } catch (e) {
    summary.errors.push(`phaseA: ${String(e.message || e).slice(0, 120)}`);
  }
  try {
    const snap = await (0, import_firestore4.getDocs)((0, import_firestore4.query)((0, import_firestore4.collection)(db, "orders"), (0, import_firestore4.where)("status", "==", "En attente")));
    const cutoff = Date.now() - 48 * 3600 * 1e3;
    for (const d of snap.docs) {
      try {
        const order = d.data() || {};
        if (order.waConfirmSent === true) continue;
        const tenantId = String(order.userId || "");
        if (!tenantId) continue;
        const digits = String(order.phone || "").replace(/\D/g, "");
        if (!/^0[567]\d{8}$/.test(digits) && !/^213[567]\d{8}$/.test(digits)) continue;
        if (toMs(order.createdAt) < cutoff) continue;
        const settings = await getWaSettings(tenantId);
        if (!settings.enabled || !settings.orderConfirmations.enabled) continue;
        if (await isUnsubscribed(tenantId, digits.replace(/^213/, "0"))) continue;
        if (inQuietHours(settings)) {
          summary.skippedQuietHours++;
          continue;
        }
        const ok = await sendOrderConfirmMessage(d.id, order, tenantId, settings);
        if (ok) summary.orderConfirmsSent++;
        else summary.errors.push(`order ${d.id}`);
      } catch (e) {
        summary.errors.push(String(e.message || e).slice(0, 120));
      }
    }
  } catch (e) {
    summary.errors.push(`phaseB: ${String(e.message || e).slice(0, 120)}`);
  }
  try {
    for (const status of WA_NOTIFIABLE_STATUSES) {
      const snap = await (0, import_firestore4.getDocs)((0, import_firestore4.query)((0, import_firestore4.collection)(db, "orders"), (0, import_firestore4.where)("status", "==", status)));
      const cutoff = Date.now() - 24 * 3600 * 1e3;
      for (const d of snap.docs) {
        try {
          const order = d.data() || {};
          if (order.waConfirmSent !== true && order.whatsappConfirmed !== true) continue;
          if (order.waLastStatusSent === status) continue;
          if (toMs(order.updatedAt || order.createdAt) < cutoff) continue;
          const tenantId = String(order.userId || "");
          if (!tenantId) continue;
          const settings = await getWaSettings(tenantId);
          if (!settings.enabled) continue;
          const digits = String(order.phone || "").replace(/\D/g, "");
          if (await isUnsubscribed(tenantId, digits.replace(/^213/, "0"))) continue;
          if (inQuietHours(settings)) {
            summary.skippedQuietHours++;
            continue;
          }
          const lang = settings.language === "store" ? "ar" : settings.language;
          const tplMap = lang === "fr" ? WA_ORDER_STATUS_FR : WA_ORDER_STATUS_AR;
          const line = tplMap[status];
          if (!line) continue;
          const tenantSnap = await (0, import_firestore4.getDoc)((0, import_firestore4.doc)(db, "tenants", tenantId)).catch(() => null);
          const tenantData = tenantSnap?.data() || {};
          const trackUrl = `${waBaseUrl()}/track/${encodeURIComponent(String(order.reference || order.id || ""))}`;
          const body = `${line}

\u{1F4E6} ${cartItemsSummary(order.items)}
\u{1F517} ${trackUrl}`;
          const r = await waSendText(digits, body);
          await logWaMessage({
            tenantId,
            kind: "order_status",
            direction: "out",
            orderId: d.id,
            phone: digits,
            lang,
            body,
            status: r.ok ? "sent" : "failed",
            simulated: r.simulated,
            waMessageId: r.waMessageId,
            error: r.error
          });
          await (0, import_firestore4.setDoc)((0, import_firestore4.doc)(db, "orders", d.id), {
            waLastStatusSent: status,
            waLastStatusAt: (/* @__PURE__ */ new Date()).toISOString(),
            ...r.ok ? {} : { waLastError: r.error || "" }
          }, { merge: true });
          await (0, import_firestore4.setDoc)((0, import_firestore4.doc)(db, "tenants", tenantId, "orders", d.id), {
            waLastStatusSent: status,
            waLastStatusAt: (/* @__PURE__ */ new Date()).toISOString()
          }, { merge: true }).catch(() => {
          });
          if (r.ok) summary.statusNotificationsSent++;
          else summary.errors.push(`status ${d.id}`);
        } catch (e) {
          summary.errors.push(String(e.message || e).slice(0, 120));
        }
      }
    }
  } catch (e) {
    summary.errors.push(`phaseC: ${String(e.message || e).slice(0, 120)}`);
  }
  return summary;
}
async function ensureCartToken(cartId, cart) {
  const existing = String(cart.waToken || "");
  if (existing) return existing;
  const token = import_crypto2.default.randomBytes(12).toString("hex");
  await (0, import_firestore4.setDoc)((0, import_firestore4.doc)(db, "abandoned_carts", cartId), { waToken: token }, { merge: true });
  const tenantId = String(cart.tenantId || "");
  if (tenantId) {
    await (0, import_firestore4.setDoc)((0, import_firestore4.doc)(db, "tenants", tenantId, "abandoned_carts", cartId), { waToken: token }, { merge: true }).catch(() => {
    });
  }
  return token;
}
async function sendCartMessage(cartId, cart, tenantId, settings, kind) {
  const digits = String(cart.phoneDigits || "");
  const lang = resolveLang(settings, cart.lang);
  const tenantSnap = await (0, import_firestore4.getDoc)((0, import_firestore4.doc)(db, "tenants", tenantId)).catch(() => null);
  const tenantData = tenantSnap?.data() || {};
  const token = await ensureCartToken(cartId, cart);
  const link = `${waBaseUrl()}/wa/${cartId}?t=${token}`;
  const reminderPrefix = kind === "cart_reminder" ? lang === "fr" ? "\u23F0 Petit rappel \u2014 " : "\u23F0 \u062A\u0630\u0643\u064A\u0631 \u2014 " : "";
  const tpl = lang === "fr" ? settings.abandonedCarts.messageFr : settings.abandonedCarts.messageAr;
  const total = Number(cart.total) || 0;
  const body = reminderPrefix + renderWaTemplate(tpl, {
    nom: String(cart.client || "").split(" ")[0] || (lang === "fr" ? "cher client" : "\u0639\u0645\u064A\u0644\u0646\u0627"),
    boutique: resolveTenantName(tenantData),
    produits: cartItemsSummary(cart.items),
    total: total.toLocaleString("fr-FR"),
    wilaya: String(cart.wilaya || ""),
    lien: link
  });
  const r = await waSendText(digits, body);
  const nowIso = (/* @__PURE__ */ new Date()).toISOString();
  await logWaMessage({
    tenantId,
    kind,
    direction: "out",
    cartId,
    phone: digits,
    lang,
    body,
    status: r.ok ? "sent" : "failed",
    simulated: r.simulated,
    waMessageId: r.waMessageId,
    error: r.error,
    sentAt: nowIso
  });
  const patch = {
    waStatus: r.ok ? "sent" : "failed",
    waSimulated: r.simulated,
    waSentAt: nowIso,
    ...kind === "cart_reminder" ? { waReminderSentAt: nowIso } : {},
    ...r.ok ? {} : { waError: r.error || "" }
  };
  await (0, import_firestore4.setDoc)((0, import_firestore4.doc)(db, "abandoned_carts", cartId), patch, { merge: true });
  await (0, import_firestore4.setDoc)((0, import_firestore4.doc)(db, "tenants", tenantId, "abandoned_carts", cartId), patch, { merge: true }).catch(() => {
  });
  return r.ok;
}
async function sendOrderConfirmMessage(orderId, order, tenantId, settings) {
  const digits = String(order.phone || "").replace(/\D/g, "").replace(/^213/, "0");
  const lang = settings.language === "store" ? order.lang === "fr" ? "fr" : "ar" : settings.language;
  const tenantSnap = await (0, import_firestore4.getDoc)((0, import_firestore4.doc)(db, "tenants", tenantId)).catch(() => null);
  const tenantData = tenantSnap?.data() || {};
  const token = import_crypto2.default.randomBytes(12).toString("hex");
  const link = `${waBaseUrl()}/wa/order/${orderId}?t=${token}`;
  const tpl = lang === "fr" ? WA_ORDER_CONFIRM_FR : WA_ORDER_CONFIRM_AR;
  const body = renderWaTemplate(tpl, {
    nom: String(order.client || "").split(" ")[0] || (lang === "fr" ? "cher client" : "\u0639\u0645\u064A\u0644\u0646\u0627"),
    boutique: resolveTenantName(tenantData),
    produits: cartItemsSummary(order.items),
    total: (Number(order.total) || 0).toLocaleString("fr-FR"),
    wilaya: String(order.wilaya || ""),
    lien: link
  });
  const r = await waSendText(digits, body);
  const nowIso = (/* @__PURE__ */ new Date()).toISOString();
  await logWaMessage({
    tenantId,
    kind: "order_confirm",
    direction: "out",
    orderId,
    phone: digits,
    lang,
    body,
    status: r.ok ? "sent" : "failed",
    simulated: r.simulated,
    waMessageId: r.waMessageId,
    error: r.error,
    sentAt: nowIso
  });
  const patch = {
    waConfirmSent: r.ok === true,
    waConfirmSimulated: r.simulated,
    waConfirmSentAt: nowIso,
    waToken: token,
    ...r.ok ? {} : { waLastError: r.error || "" }
  };
  await (0, import_firestore4.setDoc)((0, import_firestore4.doc)(db, "orders", orderId), patch, { merge: true });
  await (0, import_firestore4.setDoc)((0, import_firestore4.doc)(db, "tenants", tenantId, "orders", orderId), patch, { merge: true }).catch(() => {
  });
  return r.ok;
}
async function getProductDoc(tenantId, productId) {
  const tries = [(0, import_firestore4.doc)(db, "products", productId), (0, import_firestore4.doc)(db, "tenants", tenantId, "products", productId)];
  for (const ref of tries) {
    try {
      const snap = await (0, import_firestore4.getDoc)(ref);
      if (snap.exists()) return snap.data() || {};
    } catch {
    }
  }
  return null;
}
async function convertCartViaWhatsApp(cartId, acceptNewPrice) {
  const cartSnap = await (0, import_firestore4.getDoc)((0, import_firestore4.doc)(db, "abandoned_carts", cartId)).catch(() => null);
  if (!cartSnap || !cartSnap.exists()) return { ok: false, reason: "invalid" };
  const cart = cartSnap.data() || {};
  const tenantId = String(cart.tenantId || "");
  if (!tenantId) return { ok: false, reason: "invalid" };
  if (cart.status === "recovered" && cart.orderId) {
    return { ok: true, reason: "already", orderId: String(cart.orderId), trackingCode: String(cart.orderId) };
  }
  const items = Array.isArray(cart.items) ? cart.items : [];
  const first = items[0] || {};
  const productId = String(first.productId || "");
  const product = productId ? await getProductDoc(tenantId, productId) : null;
  if (productId && !product) return { ok: false, reason: "product_unavailable" };
  if (product && String(product.status || "active") !== "active") {
    return { ok: false, reason: "product_unavailable" };
  }
  const stock = product ? Number(product.stock) : NaN;
  if (product && Number.isFinite(stock) && stock <= 0) {
    return { ok: false, reason: "out_of_stock" };
  }
  const currentPrice = product ? Number(product.price) : Number(first.price) || 0;
  const qty = Number(first.quantity ?? first.qty) || 1;
  const wilayaStr = String(cart.wilaya || "");
  const codeMatch = wilayaStr.match(/(\d{1,2})\s*[-–]/);
  const wilaya = codeMatch ? ALGERIAN_WILAYAS.find((w) => w.code === Number(codeMatch[1])) : void 0;
  const deliveryType = String(cart.deliveryType || "home") === "desk" ? "desk" : "home";
  const currentShipping = wilaya ? deliveryType === "home" ? wilaya.homeDeliveryPrice : wilaya.deskDeliveryPrice : Number(cart.shipping) || 0;
  const currentTotal = currentPrice * qty + currentShipping;
  const oldTotal = Number(cart.total) || 0;
  if (!acceptNewPrice && (currentPrice !== (Number(first.price) || 0) || currentTotal !== oldTotal)) {
    return { ok: false, reason: "price_changed", currentPrice, currentShipping, currentTotal };
  }
  const generatedOrderId = `ORD-${Math.floor(Math.random() * 9e4) + 1e4}-${(/* @__PURE__ */ new Date()).toISOString().slice(0, 10).replace(/-/g, "")}-${import_crypto2.default.randomBytes(3).toString("hex").toUpperCase()}`;
  const nowIso = (/* @__PURE__ */ new Date()).toISOString();
  const productImage = String(product && (product.image || (product.images || [])[0]) || first.image || "");
  const productName = String(product && (product.nameAr || product.name) || first.name || "Produit");
  const orderPayload = {
    orderNumber: generatedOrderId.substring(4, 10),
    reference: generatedOrderId,
    trackingCode: generatedOrderId,
    userId: tenantId,
    client: String(cart.client || "Client WhatsApp"),
    phone: String(cart.phone || ""),
    wilaya: wilayaStr,
    commune: String(cart.commune || ""),
    address: String(cart.address || ""),
    itemsSummary: cartItemsSummary(items),
    total: currentTotal,
    status: "Confirm\xE9e",
    paymentStatus: "Non pay\xE9",
    paymentMethod: "COD (\u0627\u0644\u062F\u0641\u0639 \u0639\u0646\u062F \u0627\u0644\u0627\u0633\u062A\u0644\u0627\u0645)",
    deliveryType: deliveryType === "home" ? "Livraison \xE0 domicile" : "Point de relais / Stop Desk",
    shippingMethod: deliveryType === "home" ? "Livraison \xE0 domicile" : "Point de relais / Stop Desk",
    shippingCost: currentShipping,
    source: "WhatsApp \u2013 panier abandonn\xE9",
    whatsappConfirmed: true,
    confirmedAt: nowIso,
    date: nowIso,
    image: productImage,
    items: [{
      productId,
      name: productName,
      price: currentPrice,
      quantity: qty,
      variants: first.variants || {},
      image: productImage
    }]
  };
  await (0, import_firestore4.setDoc)((0, import_firestore4.doc)(db, "orders", generatedOrderId), {
    ...orderPayload,
    createdAt: (0, import_firestore4.serverTimestamp)(),
    updatedAt: (0, import_firestore4.serverTimestamp)()
  }, { merge: true });
  await (0, import_firestore4.setDoc)((0, import_firestore4.doc)(db, "tenants", tenantId, "orders", generatedOrderId), {
    ...orderPayload,
    createdAt: (0, import_firestore4.serverTimestamp)(),
    updatedAt: (0, import_firestore4.serverTimestamp)()
  }, { merge: true });
  const patch = {
    status: "recovered",
    recovered: true,
    orderId: generatedOrderId,
    recoveredAt: nowIso,
    updatedAt: nowIso,
    waStatus: "replied",
    waRepliedAt: nowIso,
    total: currentTotal
  };
  await (0, import_firestore4.setDoc)((0, import_firestore4.doc)(db, "abandoned_carts", cartId), patch, { merge: true });
  await (0, import_firestore4.setDoc)((0, import_firestore4.doc)(db, "tenants", tenantId, "abandoned_carts", cartId), patch, { merge: true }).catch(() => {
  });
  await logWaMessage({
    tenantId,
    kind: "incoming",
    direction: "in",
    cartId,
    orderId: generatedOrderId,
    phone: String(cart.phoneDigits || ""),
    lang: cart.lang === "fr" ? "fr" : "ar",
    body: "\u2705 Confirmer ma commande (bouton)",
    status: "received",
    sentAt: nowIso
  });
  return { ok: true, orderId: generatedOrderId, trackingCode: generatedOrderId, currentTotal };
}
async function waCartAction(cartId, token, action, acceptNewPrice) {
  const cartSnap = await (0, import_firestore4.getDoc)((0, import_firestore4.doc)(db, "abandoned_carts", cartId)).catch(() => null);
  if (!cartSnap || !cartSnap.exists()) return { ok: false, error: "Panier introuvable." };
  const cart = cartSnap.data() || {};
  if (String(cart.waToken || "") !== token) return { ok: false, error: "Lien invalide ou expir\xE9." };
  const tenantId = String(cart.tenantId || "");
  const nowIso = (/* @__PURE__ */ new Date()).toISOString();
  if (action === "confirm") {
    return convertCartViaWhatsApp(cartId, acceptNewPrice);
  }
  if (action === "modify") {
    const patch2 = { status: "contacted", waStatus: "replied", waRepliedAt: nowIso, waMerchantTodo: true, updatedAt: nowIso };
    await (0, import_firestore4.setDoc)((0, import_firestore4.doc)(db, "abandoned_carts", cartId), patch2, { merge: true });
    await (0, import_firestore4.setDoc)((0, import_firestore4.doc)(db, "tenants", tenantId, "abandoned_carts", cartId), patch2, { merge: true }).catch(() => {
    });
    await logWaMessage({
      tenantId,
      kind: "incoming",
      direction: "in",
      cartId,
      phone: String(cart.phoneDigits || ""),
      lang: cart.lang === "fr" ? "fr" : "ar",
      body: "\u270F\uFE0F Modifier / Appeler (bouton)",
      status: "received",
      sentAt: nowIso
    });
    return { ok: true };
  }
  const patch = { status: "refused", waStatus: "replied", waRepliedAt: nowIso, refusedAt: nowIso, updatedAt: nowIso };
  await (0, import_firestore4.setDoc)((0, import_firestore4.doc)(db, "abandoned_carts", cartId), patch, { merge: true });
  await (0, import_firestore4.setDoc)((0, import_firestore4.doc)(db, "tenants", tenantId, "abandoned_carts", cartId), patch, { merge: true }).catch(() => {
  });
  await logWaMessage({
    tenantId,
    kind: "incoming",
    direction: "in",
    cartId,
    phone: String(cart.phoneDigits || ""),
    lang: cart.lang === "fr" ? "fr" : "ar",
    body: "\u274C Non merci (bouton)",
    status: "received",
    sentAt: nowIso
  });
  return { ok: true };
}
function clientText(v, max) {
  return String(v ?? "").trim().slice(0, max);
}
function registerWhatsAppRoutes(app2) {
  app2.get("/api/whatsapp/status", (_req, res) => {
    res.json({ cloudApi: isCloudApiConfigured(), baseUrl: waBaseUrl() });
  });
  const handleProcess = async (req, res) => {
    try {
      const force = req.method === "POST" && clientText(req.query.force, 5) === "1";
      const summary = await processWhatsAppQueue(force);
      res.json({ ok: true, ...summary });
    } catch (e) {
      res.status(500).json({ ok: false, error: String(e.message || e) });
    }
  };
  app2.get("/api/whatsapp/process", handleProcess);
  app2.post("/api/whatsapp/process", handleProcess);
  app2.post("/api/whatsapp/action", async (req, res) => {
    try {
      const b = req.body || {};
      const cartId = clientText(b.cartId, 120);
      const token = clientText(b.token, 60);
      const action = clientText(b.action, 20);
      const acceptNewPrice = b.acceptNewPrice === true;
      if (!cartId || !token || !["confirm", "modify", "decline"].includes(action)) {
        res.status(400).json({ ok: false, error: "invalid_request" });
        return;
      }
      const r = await waCartAction(cartId, token, action, acceptNewPrice);
      res.json(r);
    } catch (e) {
      res.status(500).json({ ok: false, error: "action_failed", detail: String(e.message || e) });
    }
  });
  app2.post("/api/whatsapp/resend", async (req, res) => {
    try {
      const b = req.body || {};
      const cartId = clientText(b.cartId, 120);
      const token = clientText(b.token, 60);
      if (!cartId || !token) {
        res.status(400).json({ ok: false, error: "invalid_request" });
        return;
      }
      const snap = await (0, import_firestore4.getDoc)((0, import_firestore4.doc)(db, "abandoned_carts", cartId));
      if (!snap.exists()) {
        res.status(404).json({ ok: false, error: "not_found" });
        return;
      }
      const cart = snap.data() || {};
      if (String(cart.waToken || "") !== token) {
        res.status(403).json({ ok: false, error: "forbidden" });
        return;
      }
      const tenantId = String(cart.tenantId || "");
      const settings = await getWaSettings(tenantId);
      if (!settings.enabled || !settings.abandonedCarts.enabled) {
        res.status(409).json({ ok: false, error: "extension_disabled" });
        return;
      }
      if (["recovered", "refused"].includes(String(cart.status))) {
        res.status(409).json({ ok: false, error: "cart_closed" });
        return;
      }
      if (await isUnsubscribed(tenantId, String(cart.phoneDigits || ""))) {
        res.status(409).json({ ok: false, error: "unsubscribed" });
        return;
      }
      const ok = await sendCartMessage(cartId, cart, tenantId, settings, "cart");
      res.json({ ok });
    } catch (e) {
      res.status(500).json({ ok: false, error: "resend_failed" });
    }
  });
  app2.post("/api/whatsapp/order-action", async (req, res) => {
    try {
      const b = req.body || {};
      const orderId = clientText(b.orderId, 120);
      const token = clientText(b.token, 60);
      const action = clientText(b.action, 20);
      if (!orderId || !token || !["confirm", "decline"].includes(action)) {
        res.status(400).json({ ok: false, error: "invalid_request" });
        return;
      }
      let orderSnap = await (0, import_firestore4.getDoc)((0, import_firestore4.doc)(db, "orders", orderId)).catch(() => null);
      let orderData = orderSnap?.exists() ? orderSnap.data() || {} : null;
      let docId = orderId;
      if (!orderData) {
        const byRef = await (0, import_firestore4.getDocs)((0, import_firestore4.query)((0, import_firestore4.collection)(db, "orders"), (0, import_firestore4.where)("reference", "==", orderId))).catch(() => null);
        if (byRef && !byRef.empty) {
          docId = byRef.docs[0].id;
          orderData = byRef.docs[0].data() || {};
        }
      }
      if (!orderData) {
        res.status(404).json({ ok: false, error: "not_found" });
        return;
      }
      if (String(orderData.waToken || "") !== token) {
        res.status(403).json({ ok: false, error: "forbidden" });
        return;
      }
      const tenantId = String(orderData.userId || "");
      const nowIso = (/* @__PURE__ */ new Date()).toISOString();
      const newStatus = action === "confirm" ? "Confirm\xE9e" : "Annul\xE9e";
      const patch = {
        status: newStatus,
        updatedAt: nowIso,
        ...action === "confirm" ? { whatsappConfirmed: true, confirmedAt: nowIso } : { refusedAt: nowIso }
      };
      await (0, import_firestore4.setDoc)((0, import_firestore4.doc)(db, "orders", docId), patch, { merge: true });
      if (tenantId) {
        await (0, import_firestore4.setDoc)((0, import_firestore4.doc)(db, "tenants", tenantId, "orders", docId), patch, { merge: true }).catch(() => {
        });
      }
      await logWaMessage({
        tenantId,
        kind: "incoming",
        direction: "in",
        orderId: docId,
        phone: String(orderData.phone || "").replace(/\D/g, ""),
        lang: "ar",
        body: action === "confirm" ? "\u2705 Confirmer ma commande (bouton)" : "\u274C Refuser (bouton)",
        status: "received",
        sentAt: nowIso
      });
      res.json({ ok: true, status: newStatus, trackingCode: String(orderData.trackingCode || orderData.reference || docId) });
    } catch (e) {
      res.status(500).json({ ok: false, error: "order_action_failed" });
    }
  });
  app2.get("/api/webhooks/whatsapp", (req, res) => {
    const mode = clientText(req.query["hub.mode"], 20);
    const token = clientText(req.query["hub.verify_token"], 100);
    const challenge = clientText(req.query["hub.challenge"], 200);
    if (mode === "subscribe" && token && token === String(process.env.WHATSAPP_VERIFY_TOKEN || "")) {
      res.status(200).send(challenge);
      return;
    }
    res.sendStatus(403);
  });
  app2.post("/api/webhooks/whatsapp", async (req, res) => {
    try {
      const rawBody = req.rawBody;
      const appSecret = String(process.env.WHATSAPP_APP_SECRET || "");
      if (appSecret) {
        const sig = String(req.headers["x-hub-signature-256"] || "");
        if (!sig) {
          res.sendStatus(401);
          return;
        }
        const expected = "sha256=" + import_crypto2.default.createHmac("sha256", appSecret).update(rawBody || Buffer.from(JSON.stringify(req.body || {}))).digest("hex");
        if (sig !== expected) {
          res.sendStatus(401);
          return;
        }
      }
      const payload = req.body || {};
      const entries = payload.entry || [];
      for (const entry of entries) {
        const changes = entry.changes || [];
        for (const change of changes) {
          const value = change.value || {};
          const tenantId = String(value.metadata?.phone_number_id || "");
          const statuses = value.statuses || [];
          for (const st of statuses) {
            const waMessageId = String(st.id || "");
            const status = String(st.status || "");
            if (!waMessageId || !["sent", "delivered", "read", "failed"].includes(status)) continue;
            try {
              const msgsSnap = await (0, import_firestore4.getDocs)((0, import_firestore4.query)((0, import_firestore4.collection)(db, "whatsapp_messages"), (0, import_firestore4.where)("waMessageId", "==", waMessageId)));
              for (const m of msgsSnap.docs) {
                const data = m.data() || {};
                const patch = { status };
                const tsField = status === "delivered" ? "waDeliveredAt" : status === "read" ? "waReadAt" : status === "failed" ? "waFailedAt" : null;
                if (tsField) patch[tsField] = (/* @__PURE__ */ new Date()).toISOString();
                const errors = st.errors || [];
                if (errors.length) patch.error = errors[0]?.title || errors[0]?.message || "failed";
                await (0, import_firestore4.setDoc)((0, import_firestore4.doc)(db, "whatsapp_messages", m.id), patch, { merge: true });
                if (data.cartId) {
                  const cPatch = { waStatus: status };
                  if (tsField) cPatch[tsField] = patch[tsField];
                  if (errors.length) cPatch.waError = patch.error;
                  const tenantOfCart = String(data.tenantId || "");
                  await (0, import_firestore4.setDoc)((0, import_firestore4.doc)(db, "abandoned_carts", String(data.cartId)), cPatch, { merge: true });
                  if (tenantOfCart) {
                    await (0, import_firestore4.setDoc)((0, import_firestore4.doc)(db, "tenants", tenantOfCart, "abandoned_carts", String(data.cartId)), cPatch, { merge: true }).catch(() => {
                    });
                  }
                }
              }
            } catch (e) {
              console.warn("webhook status update failed:", e);
            }
          }
          const messages = value.messages || [];
          for (const msg of messages) {
            const waMessageId = String(msg.id || "");
            const from = String(msg.from || "");
            if (!waMessageId || !from) continue;
            const digits = from.replace(/\D/g, "").replace(/^213/, "0");
            try {
              const seen = await (0, import_firestore4.getDocs)((0, import_firestore4.query)((0, import_firestore4.collection)(db, "whatsapp_messages"), (0, import_firestore4.where)("waMessageId", "==", waMessageId)));
              if (!seen.empty) continue;
            } catch {
            }
            const type = String(msg.type || "text");
            let body = "";
            let buttonAction = null;
            if (type === "text") {
              body = String(msg.text?.body || "");
              const low = body.trim().toLowerCase();
              if (STOP_KEYWORDS.some((k) => low === k.toLowerCase() || low.startsWith(k.toLowerCase()))) {
                await markUnsubscribed("global", digits, "webhook_stop");
                await logWaMessage({
                  tenantId: tenantId || "global",
                  kind: "incoming",
                  direction: "in",
                  phone: digits,
                  lang: "ar",
                  body: `\u{1F6AB} STOP : ${body}`,
                  status: "received",
                  waMessageId
                });
                continue;
              }
            } else if (type === "button") {
              body = String(msg.button?.text || "");
              const payload2 = String(msg.button?.payload || "");
              if (payload2.includes("confirm") || /confirmer|تأكيد/i.test(body)) buttonAction = "confirm";
              else if (payload2.includes("modify") || /modifier|appeler|تعديل|اتصال/i.test(body)) buttonAction = "modify";
              else if (payload2.includes("decline") || /non merci|لا شكرا/i.test(body)) buttonAction = "decline";
            } else if (type === "interactive") {
              const reply = msg.interactive;
              body = String(reply?.button_reply?.title || reply?.list_reply?.title || "");
              const id = String(reply?.button_reply?.id || reply?.list_reply?.id || "");
              if (id.includes("confirm") || /confirmer|تأكيد/i.test(body)) buttonAction = "confirm";
              else if (id.includes("modify") || /modifier|appeler|تعديل/i.test(body)) buttonAction = "modify";
              else if (id.includes("decline") || /non merci|لا شكرا/i.test(body)) buttonAction = "decline";
            }
            let targetCartId = "";
            let targetToken = "";
            let targetTenantId = "";
            try {
              const cartsSnap = await (0, import_firestore4.getDocs)((0, import_firestore4.query)((0, import_firestore4.collection)(db, "abandoned_carts"), (0, import_firestore4.where)("phoneDigits", "==", digits)));
              let bestAt = 0;
              cartsSnap.forEach((c) => {
                const data = c.data() || {};
                if (["recovered", "refused"].includes(String(data.status))) return;
                const at = toMs(data.waSentAt) || toMs(data.updatedAt);
                if (at > bestAt && data.waToken) {
                  bestAt = at;
                  targetCartId = c.id;
                  targetToken = String(data.waToken);
                  targetTenantId = String(data.tenantId || "");
                }
              });
            } catch {
            }
            await logWaMessage({
              tenantId: targetTenantId || tenantId || "global",
              kind: "incoming",
              direction: "in",
              cartId: targetCartId || void 0,
              phone: digits,
              lang: "ar",
              body: body || `[${type}]`,
              status: "received",
              waMessageId
            });
            if (buttonAction && targetCartId && targetToken) {
              await waCartAction(targetCartId, targetToken, buttonAction, false);
            } else {
              if (targetCartId) {
                const patch = { waStatus: "replied", waRepliedAt: (/* @__PURE__ */ new Date()).toISOString(), waMerchantTodo: true };
                await (0, import_firestore4.setDoc)((0, import_firestore4.doc)(db, "abandoned_carts", targetCartId), patch, { merge: true }).catch(() => {
                });
              }
            }
          }
        }
      }
      res.sendStatus(200);
    } catch (e) {
      console.warn("webhook error:", e);
      res.sendStatus(200);
    }
  });
}

// server.ts
var storage = import_multer.default.memoryStorage();
var upload = (0, import_multer.default)({
  storage,
  limits: { fileSize: 900 * 1024 }
});
async function getApp() {
  import_cloudinary.v2.config({
    cloud_name: "ie6edvfe",
    api_key: "571992972679788",
    api_secret: "ojRyuQn_r0KsBbWKH0dtLUY4-3I"
  });
  const app2 = (0, import_express3.default)();
  app2.use(import_express3.default.json({
    verify: (req, _res, buf) => {
      req.rawBody = buf;
    }
  }));
  app2.use((0, import_cookie_parser.default)());
  app2.use((req, res, next) => {
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("X-XSS-Protection", "1; mode=block");
    next();
  });
  app2.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });
  const orderCooldownMap = /* @__PURE__ */ new Map();
  app2.post("/api/notify/order", async (req, res) => {
    try {
      const {
        orderId,
        reference,
        tenantId,
        manual = false,
        clientFallback
      } = req.body;
      const lookupRef = reference || orderId || clientFallback && (clientFallback.reference || clientFallback.orderNumber);
      if (!lookupRef && !clientFallback) {
        return res.status(400).json({ error: "Identifiant ou r\xE9f\xE9rence de commande manquant." });
      }
      const nowMs = Date.now();
      const lastTrigger = orderCooldownMap.get(String(lookupRef)) || 0;
      if (!manual && nowMs - lastTrigger < 3e3) {
        return res.json({ success: true, message: "Notification d\xE9j\xE0 en cours de traitement." });
      }
      orderCooldownMap.set(String(lookupRef), nowMs);
      if (orderCooldownMap.size > 2e3) {
        orderCooldownMap.clear();
      }
      let effectiveTenantId = tenantId || clientFallback && (clientFallback.userId || clientFallback.tenantId) || "";
      let orderData = null;
      let orderDocRef = null;
      if (effectiveTenantId && lookupRef) {
        try {
          const directSnap = await (0, import_firestore5.getDoc)((0, import_firestore5.doc)(db, "tenants", effectiveTenantId, "orders", lookupRef));
          if (directSnap.exists()) {
            orderData = directSnap.data();
            orderDocRef = (0, import_firestore5.doc)(db, "tenants", effectiveTenantId, "orders", lookupRef);
          }
        } catch {
        }
      }
      if (!orderData && lookupRef) {
        try {
          const q = (0, import_firestore5.query)((0, import_firestore5.collection)(db, "orders"), (0, import_firestore5.where)("reference", "==", lookupRef));
          const snap = await (0, import_firestore5.getDocs)(q);
          if (!snap.empty) {
            orderData = snap.docs[0].data();
            orderDocRef = (0, import_firestore5.doc)(db, "orders", snap.docs[0].id);
            if (!effectiveTenantId && orderData.userId) {
              effectiveTenantId = orderData.userId;
            }
          }
        } catch {
        }
      }
      if (!orderData && clientFallback) {
        orderData = clientFallback;
      }
      if (!orderData) {
        console.warn(`[NOTIFY] Order ${lookupRef} could not be resolved.`);
        return res.status(404).json({ error: "Commande non trouv\xE9e." });
      }
      if (!manual && orderData.ownerNotified?.email && orderData.ownerNotified?.whatsapp) {
        console.log(`[NOTIFY] Order ${lookupRef} already notified to owner.`);
        return res.json({
          success: true,
          alreadyNotified: true,
          ownerNotified: orderData.ownerNotified
        });
      }
      let ownerEmail = "";
      let ownerPhone = "";
      let notifyEmailEnabled = true;
      let notifyWhatsappEnabled = true;
      let callmebotApiKey = "";
      let storeName = "Votre boutique DZ Build";
      if (effectiveTenantId) {
        try {
          const tenantSnap = await (0, import_firestore5.getDoc)((0, import_firestore5.doc)(db, "tenants", effectiveTenantId));
          if (tenantSnap.exists()) {
            const tData = tenantSnap.data();
            ownerEmail = tData.notificationEmail || tData.email || tData.ownerEmail || "";
            ownerPhone = tData.notificationWhatsapp || tData.phone || "";
            if (tData.notifyEmailEnabled !== void 0) notifyEmailEnabled = tData.notifyEmailEnabled;
            if (tData.notifyWhatsappEnabled !== void 0) notifyWhatsappEnabled = tData.notifyWhatsappEnabled;
            if (tData.callmebotApiKey) callmebotApiKey = tData.callmebotApiKey;
            if (tData.storeName) storeName = tData.storeName;
          }
          const settingsSnap = await (0, import_firestore5.getDoc)((0, import_firestore5.doc)(db, "tenants", effectiveTenantId, "settings", "notifications"));
          if (settingsSnap.exists()) {
            const sData = settingsSnap.data();
            if (sData.notificationEmail) ownerEmail = sData.notificationEmail;
            if (sData.notificationWhatsapp) ownerPhone = sData.notificationWhatsapp;
            if (sData.notifyEmailEnabled !== void 0) notifyEmailEnabled = sData.notifyEmailEnabled;
            if (sData.notifyWhatsappEnabled !== void 0) notifyWhatsappEnabled = sData.notifyWhatsappEnabled;
            if (sData.callmebotApiKey) callmebotApiKey = sData.callmebotApiKey;
          }
        } catch (tErr) {
          console.warn("[NOTIFY] Error fetching tenant config:", tErr);
        }
      }
      if (!ownerEmail && req.body.merchantEmail) {
        ownerEmail = req.body.merchantEmail;
      }
      if (!ownerEmail) {
        ownerEmail = "nabsterzero@gmail.com";
      }
      const orderNumber = orderData.orderNumber || (orderData.reference ? String(orderData.reference).slice(-6) : "CMD");
      const clientName = orderData.client || orderData.customerName || "Client";
      const clientPhone = orderData.phone || orderData.customerPhone || "Non renseign\xE9";
      const clientEmail = orderData.email || orderData.customerEmail || "";
      const wilaya = orderData.wilaya || "Alg\xE9rie";
      const commune = orderData.commune || "";
      const address = orderData.address || "Livraison";
      const total = Number(orderData.total) || 0;
      const shippingCost = Number(orderData.shippingCost) || 0;
      const subtotal = Math.max(0, total - shippingCost);
      const itemsSummary = orderData.itemsSummary || orderData.items && orderData.items.map((i) => `${i.quantity}x ${i.name}`).join(", ") || "Produit command\xE9";
      const orderDate = formatDateTime(orderData.date || orderData.createdAt || /* @__PURE__ */ new Date(), true);
      const status = orderData.status || "En attente";
      const items = orderData.items || [];
      console.log(`[NOTIFY OWNER] Processing order #${orderNumber} for tenant ${effectiveTenantId || "default"} (Owner Email: ${ownerEmail}, Phone: ${ownerPhone})`);
      const dispatchPromises = [
        // 1. Email Dispatch
        (async () => {
          if (!notifyEmailEnabled || !ownerEmail) {
            return { success: false, skipped: true, reason: "Notification Email d\xE9sactiv\xE9e ou adresse email manquante." };
          }
          const itemsHtml = items.length > 0 ? items.map((it) => `
              <tr style="border-bottom: 1px solid #f3f4f6;">
                <td style="padding: 12px; font-size: 13px; color: #111827;">
                  <strong>${it.name || "Article"}</strong>
                  ${it.variants ? `<br/><span style="font-size: 11px; color: #6b7280;">${Object.entries(it.variants).map(([k, v]) => `${k}: ${v}`).join(", ")}</span>` : ""}
                </td>
                <td style="padding: 12px; font-size: 13px; text-align: center; color: #111827;">x${it.quantity || 1}</td>
                <td style="padding: 12px; font-size: 13px; text-align: right; font-weight: bold; color: #111827;">${(Number(it.price || 0) * Number(it.quantity || 1)).toLocaleString()} DZD</td>
              </tr>
            `).join("") : `
              <tr style="border-bottom: 1px solid #f3f4f6;">
                <td style="padding: 12px; font-size: 13px; color: #111827;"><strong>${itemsSummary}</strong></td>
                <td style="padding: 12px; font-size: 13px; text-align: center; color: #111827;">x1</td>
                <td style="padding: 12px; font-size: 13px; text-align: right; font-weight: bold; color: #111827;">${subtotal.toLocaleString()} DZD</td>
              </tr>
            `;
          const emailHtml = `
            <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 620px; margin: 0 auto; padding: 24px; border: 1px solid #e5e7eb; border-radius: 16px; background-color: #ffffff; color: #1f2937;">
              
              <!-- Header -->
              <div style="text-align: center; padding-bottom: 20px; border-bottom: 2px solid #f3f4f6;">
                <div style="display: inline-block; background-color: #fef3c7; color: #d97706; font-size: 26px; width: 56px; height: 56px; line-height: 56px; border-radius: 28px; margin-bottom: 8px;">\u{1F6D2}</div>
                <h1 style="color: #111827; font-size: 22px; margin: 0; font-weight: 800;">Nouvelle Commande Re\xE7ue !</h1>
                <p style="color: #6b7280; font-size: 13px; margin: 4px 0 0 0;">${storeName} \u2022 R\xE9f : <strong>#${orderNumber}</strong></p>
              </div>

              <!-- Client Info Box -->
              <div style="background-color: #f9fafb; border: 1px solid #f3f4f6; border-radius: 12px; padding: 16px; margin: 20px 0;">
                <h3 style="margin: 0 0 12px 0; font-size: 13px; font-weight: bold; color: #374151; text-transform: uppercase; letter-spacing: 0.5px;">\u{1F464} Coordonn\xE9es du Client</h3>
                <table style="width: 100%; font-size: 13px; line-height: 1.6; color: #111827;">
                  <tr><td style="color: #6b7280; width: 120px;">Nom complet :</td><td><strong>${clientName}</strong></td></tr>
                  <tr><td style="color: #6b7280;">T\xE9l\xE9phone :</td><td><a href="tel:${clientPhone}" style="color: #2563eb; font-weight: bold; text-decoration: none;">${clientPhone}</a></td></tr>
                  ${clientEmail ? `<tr><td style="color: #6b7280;">Email :</td><td><a href="mailto:${clientEmail}" style="color: #2563eb; text-decoration: none;">${clientEmail}</a></td></tr>` : ""}
                  <tr><td style="color: #6b7280;">Destination :</td><td>${wilaya}${commune ? ` - ${commune}` : ""} (${address})</td></tr>
                  <tr><td style="color: #6b7280;">Statut initial :</td><td><span style="background-color: #fef3c7; color: #b45309; padding: 2px 8px; border-radius: 6px; font-weight: 600; font-size: 11px;">${status}</span></td></tr>
                  <tr><td style="color: #6b7280;">Date :</td><td>${orderDate}</td></tr>
                </table>
              </div>

              <!-- Products Table -->
              <div style="margin-bottom: 20px;">
                <h3 style="margin: 0 0 12px 0; font-size: 13px; font-weight: bold; color: #374151; text-transform: uppercase; letter-spacing: 0.5px;">\u{1F4E6} D\xE9tails des Articles</h3>
                <table style="width: 100%; border-collapse: collapse; background-color: #ffffff; border: 1px solid #f3f4f6; border-radius: 8px;">
                  <thead>
                    <tr style="background-color: #f9fafb; border-bottom: 2px solid #e5e7eb;">
                      <th style="padding: 10px 12px; text-align: left; font-size: 12px; color: #6b7280;">Article</th>
                      <th style="padding: 10px 12px; text-align: center; font-size: 12px; color: #6b7280;">Qt\xE9</th>
                      <th style="padding: 10px 12px; text-align: right; font-size: 12px; color: #6b7280;">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${itemsHtml}
                  </tbody>
                </table>
              </div>

              <!-- Totals Box -->
              <div style="background-color: #f9fafb; border-radius: 12px; padding: 16px; margin-bottom: 24px;">
                <div style="display: flex; justify-content: space-between; font-size: 13px; color: #4b5563; margin-bottom: 6px;">
                  <span>Sous-total produits :</span>
                  <span>${subtotal.toLocaleString()} DZD</span>
                </div>
                <div style="display: flex; justify-content: space-between; font-size: 13px; color: #4b5563; margin-bottom: 8px;">
                  <span>Frais de livraison :</span>
                  <span>${shippingCost > 0 ? `${shippingCost.toLocaleString()} DZD` : "Gratuit (0 DZD)"}</span>
                </div>
                <div style="display: flex; justify-content: space-between; font-size: 17px; font-weight: bold; color: #111827; border-top: 1px solid #e5e7eb; padding-top: 8px;">
                  <span>Total \xE0 encaisser :</span>
                  <span style="color: #10b981;">${total.toLocaleString()} DZD</span>
                </div>
              </div>

              <!-- Dashboard CTA Button -->
              <div style="text-align: center; margin: 28px 0 16px 0;">
                <a href="${process.env.APP_URL || "https://ais-dev-zvrbpruzhdfhlem4dnde34-707063893758.europe-west2.run.app"}/dashboard/orders/${lookupRef}" style="background-color: #f59e0b; color: #000000; padding: 14px 28px; border-radius: 10px; font-weight: bold; font-size: 14px; text-decoration: none; display: inline-block; box-shadow: 0 4px 12px rgba(245, 158, 11, 0.25);">
                  \u{1F4CB} Ouvrir et traiter la commande
                </a>
              </div>

              <!-- Footer -->
              <div style="border-top: 1px solid #f3f4f6; padding-top: 16px; text-align: center; color: #9ca3af; font-size: 11px;">
                Notification automatique s\xE9curis\xE9e g\xE9n\xE9r\xE9e par la plateforme DZ Build.
              </div>
            </div>
          `;
          let transporter;
          if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
            transporter = import_nodemailer.default.createTransport({
              host: process.env.SMTP_HOST,
              port: Number(process.env.SMTP_PORT || 587),
              secure: process.env.SMTP_SECURE === "true",
              auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS
              }
            });
          } else {
            const testAccount = await import_nodemailer.default.createTestAccount();
            transporter = import_nodemailer.default.createTransport({
              host: "smtp.ethereal.email",
              port: 587,
              secure: false,
              auth: {
                user: testAccount.user,
                pass: testAccount.pass
              }
            });
          }
          const fromHeader = process.env.SMTP_FROM || `"${storeName}" <notifications@dzbuild.com>`;
          const info = await transporter.sendMail({
            from: fromHeader,
            to: ownerEmail,
            subject: `\u{1F6D2} Nouvelle commande #${orderNumber} \u2014 ${total.toLocaleString()} DZD`,
            html: emailHtml
          });
          const previewUrl = import_nodemailer.default.getTestMessageUrl(info) || "";
          console.log(`[EMAIL DISPATCH SUCCESS] Owner email sent to ${ownerEmail}. MessageId: ${info.messageId}`);
          return { success: true, messageId: info.messageId, previewUrl };
        })(),
        // 2. WhatsApp Dispatch
        (async () => {
          if (!notifyWhatsappEnabled || !ownerPhone) {
            return { success: false, skipped: true, reason: "Notification WhatsApp d\xE9sactiv\xE9e ou num\xE9ro non renseign\xE9." };
          }
          const waResult = await sendOwnerWhatsAppNotification({
            ownerPhone,
            orderNumber,
            clientName,
            clientPhone,
            wilaya,
            total,
            itemsSummary,
            storeName,
            callmebotApiKey
          });
          return waResult;
        })()
      ];
      const [emailSettled, whatsappSettled] = await Promise.allSettled(dispatchPromises);
      const emailResult = emailSettled.status === "fulfilled" ? emailSettled.value : { success: false, error: emailSettled.reason?.message };
      const whatsappResult = whatsappSettled.status === "fulfilled" ? whatsappSettled.value : { success: false, error: whatsappSettled.reason?.message };
      const emailSuccess = !!emailResult?.success;
      const whatsappSuccess = !!whatsappResult?.success;
      const ownerNotifiedPayload = {
        email: emailSuccess,
        whatsapp: whatsappSuccess,
        emailError: emailSuccess ? null : emailResult?.error || emailResult?.reason || null,
        whatsappError: whatsappSuccess ? null : whatsappResult?.error || whatsappResult?.reason || null,
        whatsappMethod: whatsappResult?.method || "none",
        at: (/* @__PURE__ */ new Date()).toISOString()
      };
      if (orderDocRef) {
        try {
          await (0, import_firestore5.setDoc)(orderDocRef, { ownerNotified: ownerNotifiedPayload }, { merge: true });
        } catch (updateErr) {
          console.warn("[NOTIFY] Could not update order ownerNotified:", updateErr);
        }
      }
      if (effectiveTenantId) {
        try {
          const logId = `log_${lookupRef}_${Date.now()}`;
          await (0, import_firestore5.setDoc)((0, import_firestore5.doc)(db, "tenants", effectiveTenantId, "notificationLogs", logId), {
            orderId: lookupRef,
            orderNumber,
            date: (/* @__PURE__ */ new Date()).toISOString(),
            email: {
              sent: emailSuccess,
              recipient: ownerEmail,
              previewUrl: emailResult?.previewUrl || null,
              error: emailResult?.error || null
            },
            whatsapp: {
              sent: whatsappSuccess,
              recipient: ownerPhone,
              method: whatsappResult?.method || "none",
              error: whatsappResult?.error || null
            }
          });
        } catch (logErr) {
          console.warn("[NOTIFY] Could not save notification log:", logErr);
        }
      }
      return res.json({
        success: true,
        orderId: lookupRef,
        emailSent: emailSuccess,
        emailPreviewUrl: emailResult?.previewUrl || null,
        whatsappSent: whatsappSuccess,
        whatsappMethod: whatsappResult?.method || "none",
        whatsappError: whatsappResult?.error || null,
        ownerNotified: ownerNotifiedPayload
      });
    } catch (globalErr) {
      console.error("[NOTIFY] Global exception in /api/notify/order:", globalErr);
      return res.status(500).json({ error: globalErr.message || "Erreur interne lors de la notification." });
    }
  });
  app2.post("/api/notify/test", async (req, res) => {
    try {
      const { tenantId, email, phone, callmebotApiKey } = req.body;
      const targetEmail = email || "nabsterzero@gmail.com";
      const targetPhone = phone || "";
      console.log(`[TEST NOTIFY] Testing channels for email: ${targetEmail}, phone: ${targetPhone}`);
      let emailSent = false;
      let previewUrl = "";
      let emailError = null;
      try {
        let transporter;
        if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
          transporter = import_nodemailer.default.createTransport({
            host: process.env.SMTP_HOST,
            port: Number(process.env.SMTP_PORT || 587),
            secure: process.env.SMTP_SECURE === "true",
            auth: {
              user: process.env.SMTP_USER,
              pass: process.env.SMTP_PASS
            }
          });
        } else {
          const testAccount = await import_nodemailer.default.createTestAccount();
          transporter = import_nodemailer.default.createTransport({
            host: "smtp.ethereal.email",
            port: 587,
            secure: false,
            auth: {
              user: testAccount.user,
              pass: testAccount.pass
            }
          });
        }
        const info = await transporter.sendMail({
          from: process.env.SMTP_FROM || `"DZ Build Test" <notifications@dzbuild.com>`,
          to: targetEmail,
          subject: "\u{1F9EA} Test de notification commande \u2014 DZ Build",
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 550px; margin: 0 auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 12px;">
              <h2 style="color: #10b981; margin: 0 0 10px 0;">\u2705 Test R\xE9ussi !</h2>
              <p>Votre canal de notification Email fonctionne correctement. Vous recevrez automatiquement les alertes de chaque nouvelle commande ici.</p>
              <p style="color: #6b7280; font-size: 12px; margin-top: 20px;">G\xE9n\xE9r\xE9 \xE0 ${formatDateTime(/* @__PURE__ */ new Date(), true)}</p>
            </div>
          `
        });
        emailSent = true;
        previewUrl = import_nodemailer.default.getTestMessageUrl(info) || "";
      } catch (e) {
        emailError = e.message;
      }
      let waResult = { success: false, method: "none", error: "Num\xE9ro de t\xE9l\xE9phone non renseign\xE9" };
      if (targetPhone) {
        waResult = await sendOwnerWhatsAppNotification({
          ownerPhone: targetPhone,
          orderNumber: "TEST-999",
          clientName: "Client Test",
          clientPhone: "0550000000",
          wilaya: "16 - Alger",
          total: 4500,
          itemsSummary: "1x Produit Test",
          storeName: "Test Store",
          callmebotApiKey
        });
      }
      return res.json({
        success: true,
        emailSent,
        previewUrl,
        emailError,
        whatsappSent: waResult.success,
        whatsappMethod: waResult.method,
        whatsappError: waResult.error || null
      });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  });
  app2.post("/api/cloudinary-upload", upload.single("image"), async (req, res) => {
    if (!req.file) {
      return res.status(400).json({ error: "No image uploaded" });
    }
    try {
      const uploadStream = import_cloudinary.v2.uploader.upload_stream(
        { folder: "enova-products" },
        (error, result) => {
          if (error) {
            console.error("Cloudinary upload error:", error);
            return res.status(500).json({ error: "Failed to upload to Cloudinary" });
          }
          res.json({ url: result?.secure_url });
        }
      );
      const stream = new import_stream.Readable();
      stream.push(req.file.buffer);
      stream.push(null);
      stream.pipe(uploadStream);
    } catch (error) {
      console.error("Upload error:", error);
      res.status(500).json({ error: "\xC9chec de l'enregistrement." });
    }
  });
  app2.post("/api/admin/upload", adminApiGuard("media"), upload.single("image"), async (req, res) => {
    if (!req.file) {
      return res.status(400).json({ error: "No image uploaded" });
    }
    try {
      const id = import_crypto3.default.randomUUID();
      const mimeType = req.file.mimetype;
      const base64Data = req.file.buffer.toString("base64");
      await (0, import_firestore5.setDoc)((0, import_firestore5.doc)(db, "hosted_images", id), {
        id,
        mimeType,
        data: base64Data,
        createdAt: (/* @__PURE__ */ new Date()).toISOString()
      });
      const fileUrl = `/api/images/${id}`;
      res.json({ url: fileUrl });
    } catch (error) {
      console.error("Upload error:", error);
      res.status(500).json({ error: "\xC9chec de l'enregistrement. L'image est peut-\xEAtre trop lourde (max 900KB)." });
    }
  });
  app2.get("/api/images/:id", async (req, res) => {
    try {
      const docRef = (0, import_firestore5.doc)(db, "hosted_images", req.params.id);
      const docSnap = await (0, import_firestore5.getDoc)(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        const buffer = Buffer.from(data.data, "base64");
        res.setHeader("Content-Type", data.mimeType);
        res.setHeader("Cache-Control", "public, max-age=31536000");
        res.send(buffer);
      } else {
        res.status(404).send("Image not found");
      }
    } catch (error) {
      console.error("Error fetching image:", error);
      res.status(500).send("Error fetching image");
    }
  });
  app2.get("/api/admin/images", adminApiGuard("media"), async (req, res) => {
    try {
      const querySnapshot = await (0, import_firestore5.getDocs)((0, import_firestore5.collection)(db, "hosted_images"));
      const images = [];
      querySnapshot.forEach((doc5) => {
        const data = doc5.data();
        images.push({
          id: data.id,
          mimeType: data.mimeType,
          createdAt: data.createdAt,
          url: `/api/images/${data.id}`
        });
      });
      images.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      res.json({ images });
    } catch (error) {
      console.error("Error listing images:", error);
      res.status(500).json({ error: "Failed to list images" });
    }
  });
  app2.delete("/api/admin/images/:id", adminApiGuard("media"), async (req, res) => {
    try {
      await (0, import_firestore5.deleteDoc)((0, import_firestore5.doc)(db, "hosted_images", req.params.id));
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting image:", error);
      res.status(500).json({ error: "Failed to delete image" });
    }
  });
  app2.use("/api/admin/auth", adminAuth_default);
  app2.use("/api/admin/v1", adminApi_default);
  app2.post("/api/webhooks/payment", async (req, res) => {
    try {
      const signature = req.headers["signature"];
      const payload = JSON.stringify(req.body);
      const secret = process.env.CHARGILY_SECRET_KEY || "dummy_secret";
      const computedSignature = import_crypto3.default.createHmac("sha256", secret).update(payload).digest("hex");
      const event = req.body;
      if (event && event.type === "checkout.paid") {
        const checkout = event.data;
        const tenantId = checkout.metadata?.tenantId;
        if (tenantId) {
          const q = (0, import_firestore5.query)((0, import_firestore5.collection)(db, "payments"), (0, import_firestore5.where)("tenantId", "==", tenantId), (0, import_firestore5.where)("status", "==", "pending"));
          const snap = await (0, import_firestore5.getDocs)(q);
          if (!snap.empty) {
            const paymentDoc = snap.docs[0];
            await (0, import_firestore5.updateDoc)((0, import_firestore5.doc)(db, "payments", paymentDoc.id), {
              status: "completed",
              approvedAt: (/* @__PURE__ */ new Date()).toISOString()
            });
            const paymentData = paymentDoc.data();
            const tenantRef = (0, import_firestore5.doc)(db, "tenants", tenantId);
            const tenantSnap = await (0, import_firestore5.getDoc)(tenantRef);
            let baseDate = /* @__PURE__ */ new Date();
            if (tenantSnap.exists()) {
              const tData = tenantSnap.data();
              if (tData.planExpiresAt) {
                const currentExp = new Date(tData.planExpiresAt);
                if (currentExp > baseDate) baseDate = currentExp;
              }
            }
            let expiresAt = new Date(baseDate);
            const duration = paymentData.duration || "";
            if (duration.includes("3 mois")) expiresAt.setMonth(baseDate.getMonth() + 3);
            else if (duration.includes("6 mois")) expiresAt.setMonth(baseDate.getMonth() + 6);
            else if (duration.includes("1 an") || duration.includes("12 mois")) expiresAt.setFullYear(baseDate.getFullYear() + 1);
            else expiresAt.setMonth(baseDate.getMonth() + 1);
            await (0, import_firestore5.updateDoc)(tenantRef, {
              plan: paymentData.planType || "pro",
              planName: paymentData.plan || "Professionnel",
              planExpiresAt: expiresAt.toISOString(),
              status: "active"
            });
          }
        }
      }
      res.json({ received: true });
    } catch (err) {
      console.error("Webhook error:", err);
      res.status(500).json({ error: "Webhook error" });
    }
  });
  const getProductOffersList = async (productId) => {
    try {
      const q = (0, import_firestore5.query)((0, import_firestore5.collection)(db, "product_offers"), (0, import_firestore5.where)("product_id", "==", productId));
      const snap = await (0, import_firestore5.getDocs)(q);
      const list = [];
      snap.forEach((d) => list.push({ id: d.id, ...d.data() }));
      list.sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
      return list;
    } catch {
      return [];
    }
  };
  const handleGetProductById = async (req, res) => {
    try {
      const prodId = req.params.id;
      const snap = await (0, import_firestore5.getDoc)((0, import_firestore5.doc)(db, "products", prodId));
      if (!snap.exists()) {
        return res.status(404).json({ error: "Produit non trouv\xE9" });
      }
      const product = { id: snap.id, ...snap.data() };
      const dbOffers = await getProductOffersList(prodId);
      if (dbOffers.length > 0) {
        product.offers = dbOffers;
      } else if (Array.isArray(product.offers)) {
        product.offers.sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
      } else {
        product.offers = [];
      }
      res.json(product);
    } catch (err) {
      res.status(500).json({ error: err.message || "Erreur serveur" });
    }
  };
  app2.get("/api/products/:id", handleGetProductById);
  app2.get("/products/:id", handleGetProductById);
  const handleCreateProduct = async (req, res) => {
    try {
      const payload = req.body;
      const prodId = payload.id || `prod_${Date.now()}`;
      const rawOffers = Array.isArray(payload.offers) ? payload.offers : [];
      const cleanOffers = rawOffers.map((o, idx) => ({
        ...o,
        id: o.id || `offer_${Date.now()}_${idx}`,
        product_id: prodId,
        sort_order: idx,
        is_active: o.is_active ?? true
      }));
      const productData = {
        ...payload,
        id: prodId,
        offers: cleanOffers,
        createdAt: payload.createdAt || (/* @__PURE__ */ new Date()).toISOString(),
        updatedAt: (/* @__PURE__ */ new Date()).toISOString()
      };
      await (0, import_firestore5.setDoc)((0, import_firestore5.doc)(db, "products", prodId), productData, { merge: true });
      for (const off of cleanOffers) {
        await (0, import_firestore5.setDoc)((0, import_firestore5.doc)(db, "product_offers", off.id), off, { merge: true });
      }
      res.status(201).json({ success: true, product: productData });
    } catch (err) {
      res.status(500).json({ error: err.message || "Erreur cr\xE9ation produit" });
    }
  };
  app2.post("/api/products", handleCreateProduct);
  app2.post("/products", handleCreateProduct);
  const handleUpdateProduct = async (req, res) => {
    try {
      const prodId = req.params.id;
      const payload = req.body;
      const rawOffers = Array.isArray(payload.offers) ? payload.offers : [];
      const cleanOffers = rawOffers.map((o, idx) => ({
        ...o,
        id: o.id || `offer_${Date.now()}_${idx}`,
        product_id: prodId,
        sort_order: idx,
        is_active: o.is_active ?? true
      }));
      const productData = {
        ...payload,
        id: prodId,
        offers: cleanOffers,
        updatedAt: (/* @__PURE__ */ new Date()).toISOString()
      };
      await (0, import_firestore5.setDoc)((0, import_firestore5.doc)(db, "products", prodId), productData, { merge: true });
      for (const off of cleanOffers) {
        await (0, import_firestore5.setDoc)((0, import_firestore5.doc)(db, "product_offers", off.id), off, { merge: true });
      }
      res.json({ success: true, product: productData });
    } catch (err) {
      res.status(500).json({ error: err.message || "Erreur mise \xE0 jour produit" });
    }
  };
  app2.put("/api/products/:id", handleUpdateProduct);
  app2.put("/products/:id", handleUpdateProduct);
  const handleGetStoreProductBySlug = async (req, res) => {
    try {
      const slugOrId = req.params.slug;
      let product = null;
      const snap = await (0, import_firestore5.getDoc)((0, import_firestore5.doc)(db, "products", slugOrId));
      if (snap.exists()) {
        product = { id: snap.id, ...snap.data() };
      } else {
        const q = (0, import_firestore5.query)((0, import_firestore5.collection)(db, "products"), (0, import_firestore5.where)("slug", "==", slugOrId));
        const qSnap = await (0, import_firestore5.getDocs)(q);
        if (!qSnap.empty) {
          product = { id: qSnap.docs[0].id, ...qSnap.docs[0].data() };
        }
      }
      if (!product) {
        return res.status(404).json({ error: "Produit non trouv\xE9" });
      }
      const allOffers = await getProductOffersList(product.id);
      const activeOffers = (allOffers.length > 0 ? allOffers : product.offers || []).filter((o) => o.is_active).sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
      product.offers = activeOffers;
      res.json(product);
    } catch (err) {
      res.status(500).json({ error: err.message || "Erreur serveur" });
    }
  };
  app2.get("/api/store/products/:slug", handleGetStoreProductBySlug);
  app2.get("/store/products/:slug", handleGetStoreProductBySlug);
  const handleCreateOrder = async (req, res) => {
    try {
      const {
        productId,
        offer_id,
        offerId,
        quantity: clientQty,
        client,
        fullName,
        phone,
        email,
        wilaya,
        commune,
        address,
        notes,
        shippingMethod,
        shippingCost: clientShippingCost,
        tenantId,
        userId,
        variants
      } = req.body;
      const effectiveOfferId = offer_id || offerId || req.body.items?.[0]?.offerId;
      const targetProductId = productId || req.body.items?.[0]?.productId;
      let authenticProduct = null;
      if (targetProductId) {
        const pSnap = await (0, import_firestore5.getDoc)((0, import_firestore5.doc)(db, "products", targetProductId));
        if (pSnap.exists()) {
          authenticProduct = { id: pSnap.id, ...pSnap.data() };
        }
      }
      const unitBasePrice = authenticProduct?.price || Number(req.body.items?.[0]?.price) || 1e3;
      let authenticOffer = null;
      if (effectiveOfferId) {
        const oSnap = await (0, import_firestore5.getDoc)((0, import_firestore5.doc)(db, "product_offers", effectiveOfferId));
        if (oSnap.exists()) {
          authenticOffer = { id: oSnap.id, ...oSnap.data() };
        } else if (authenticProduct?.offers) {
          authenticOffer = authenticProduct.offers.find((o) => o.id === effectiveOfferId);
        }
      }
      const qty = authenticOffer ? authenticOffer.quantity : Math.max(1, Number(clientQty) || Number(req.body.items?.[0]?.quantity) || 1);
      let calculatedSubtotal = 0;
      let freeShipping = false;
      if (authenticOffer) {
        freeShipping = !!authenticOffer.free_shipping;
        if (authenticOffer.price_mode === "fixed") {
          calculatedSubtotal = Number(authenticOffer.final_price) || 0;
        } else if (authenticOffer.price_mode === "percent") {
          const pct = Math.min(99, Math.max(1, Number(authenticOffer.discount_value) || 0));
          calculatedSubtotal = Math.round(unitBasePrice * qty * (1 - pct / 100));
        } else if (authenticOffer.price_mode === "amount") {
          const da = Math.max(0, Number(authenticOffer.discount_value) || 0);
          calculatedSubtotal = Math.max(0, Math.round(unitBasePrice * qty - da));
        } else {
          calculatedSubtotal = unitBasePrice * qty;
        }
      } else {
        calculatedSubtotal = unitBasePrice * qty;
      }
      const effectiveShippingFee = freeShipping ? 0 : Math.max(0, Number(clientShippingCost) || 0);
      const serverCalculatedTotal = calculatedSubtotal + effectiveShippingFee;
      const generatedOrderId = req.body.id || req.body.reference || `ORD-${Math.floor(Math.random() * 9e4) + 1e4}-${(/* @__PURE__ */ new Date()).toISOString().slice(0, 10).replace(/-/g, "")}`;
      const effectiveTenant = tenantId || userId || authenticProduct?.userId || "default_tenant";
      const verifiedOrder = {
        id: generatedOrderId,
        reference: generatedOrderId,
        orderNumber: generatedOrderId.substring(4, 10),
        userId: effectiveTenant,
        tenantId: effectiveTenant,
        client: client || fullName || "Client",
        phone: phone || "",
        email: email || "",
        wilaya: wilaya || "\u0627\u0644\u062C\u0632\u0627\u0626\u0631",
        commune: commune || "",
        address: address || "Livraison \xE0 domicile",
        notes: notes || "",
        shippingMethod: shippingMethod || "Livraison \xE0 domicile",
        shippingCost: effectiveShippingFee,
        total: serverCalculatedTotal,
        subtotal: calculatedSubtotal,
        offerId: authenticOffer?.id || null,
        offerTitle: authenticOffer?.title || null,
        freeShippingApplied: freeShipping,
        status: "En attente",
        paymentStatus: "Non pay\xE9",
        date: (/* @__PURE__ */ new Date()).toISOString(),
        createdAt: (/* @__PURE__ */ new Date()).toISOString(),
        items: [{
          productId: targetProductId || "prod",
          name: authenticProduct?.name || req.body.items?.[0]?.name || "Article",
          unitPrice: unitBasePrice,
          price: calculatedSubtotal,
          quantity: qty,
          offerId: authenticOffer?.id || null,
          offerTitle: authenticOffer?.title || null,
          priceMode: authenticOffer?.price_mode || null,
          discountValue: authenticOffer?.discount_value || null,
          freeShippingApplied: freeShipping,
          variants: variants || req.body.items?.[0]?.variants || {}
        }]
      };
      await (0, import_firestore5.setDoc)((0, import_firestore5.doc)(db, "orders", generatedOrderId), verifiedOrder);
      if (effectiveTenant && effectiveTenant !== "default_tenant") {
        await (0, import_firestore5.setDoc)((0, import_firestore5.doc)(db, "tenants", effectiveTenant, "orders", generatedOrderId), verifiedOrder);
      }
      res.status(201).json({
        success: true,
        order: verifiedOrder,
        message: "Commande recalcul\xE9e et valid\xE9e c\xF4t\xE9 serveur"
      });
    } catch (err) {
      console.error("Server order calculation error:", err);
      res.status(500).json({ error: err.message || "Erreur serveur" });
    }
  };
  app2.post("/api/orders", handleCreateOrder);
  app2.post("/orders", handleCreateOrder);
  const dashboardStatsCache = /* @__PURE__ */ new Map();
  const recentEventsBuffer = [];
  const handleRecordEvent = async (req, res) => {
    try {
      const {
        shop_id,
        tenantId,
        event = "page_view",
        session_id,
        sessionId,
        product_id,
        productId,
        path: pagePath,
        url,
        user_agent
      } = req.body;
      const effectiveShopId = shop_id || tenantId || "default_tenant";
      const effectiveSessionId = session_id || sessionId || `sess_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
      const effectiveProductId = product_id || productId || null;
      const eventData = {
        shop_id: effectiveShopId,
        tenantId: effectiveShopId,
        event,
        session_id: effectiveSessionId,
        product_id: effectiveProductId,
        path: pagePath || url || "",
        created_at: (/* @__PURE__ */ new Date()).toISOString(),
        timestamp: Date.now()
      };
      recentEventsBuffer.push(eventData);
      if (recentEventsBuffer.length > 5e3) {
        recentEventsBuffer.splice(0, 1e3);
      }
      try {
        const eventsColl = (0, import_firestore5.collection)(db, "events");
        const newDocRef = (0, import_firestore5.doc)(eventsColl);
        (0, import_firestore5.setDoc)(newDocRef, eventData).catch(() => {
        });
      } catch {
      }
      res.status(201).json({ success: true });
    } catch (e) {
      res.status(500).json({ error: e.message || "Erreur enregistrement \xE9v\xE9nement" });
    }
  };
  app2.post("/api/events", handleRecordEvent);
  app2.post("/events", handleRecordEvent);
  const handleGetDashboardStats = async (req, res) => {
    try {
      const {
        from,
        to,
        range = "today",
        productId = "all",
        tenantId,
        shop_id,
        userId
      } = req.query;
      const effectiveTenantId = String(tenantId || shop_id || userId || "");
      const rangeType = String(range);
      const prodFilter = String(productId || "all");
      const cacheKey = `${effectiveTenantId}_${rangeType}_${prodFilter}_${from || ""}_${to || ""}`;
      const nowMs = Date.now();
      const cached = dashboardStatsCache.get(cacheKey);
      if (cached && nowMs - cached.timestamp < 6e4) {
        return res.json({ ...cached.data, cached: true });
      }
      const ordersMap = /* @__PURE__ */ new Map();
      const queries = [];
      if (effectiveTenantId) {
        queries.push((0, import_firestore5.getDocs)((0, import_firestore5.query)((0, import_firestore5.collection)(db, "orders"), (0, import_firestore5.where)("userId", "==", effectiveTenantId))).catch(() => null));
        queries.push((0, import_firestore5.getDocs)((0, import_firestore5.query)((0, import_firestore5.collection)(db, "orders"), (0, import_firestore5.where)("tenantId", "==", effectiveTenantId))).catch(() => null));
        queries.push((0, import_firestore5.getDocs)((0, import_firestore5.collection)(db, "tenants", effectiveTenantId, "orders")).catch(() => null));
      }
      queries.push((0, import_firestore5.getDocs)((0, import_firestore5.query)((0, import_firestore5.collection)(db, "orders"), (0, import_firestore5.where)("userId", "==", "default_tenant"))).catch(() => null));
      queries.push((0, import_firestore5.getDocs)((0, import_firestore5.collection)(db, "tenants", "default_tenant", "orders")).catch(() => null));
      queries.push((0, import_firestore5.getDocs)((0, import_firestore5.collection)(db, "orders")).catch(() => null));
      const snaps = await Promise.all(queries);
      snaps.forEach((snap) => {
        if (snap && snap.docs) {
          snap.docs.forEach((d) => {
            const data = d.data();
            const id = d.id;
            ordersMap.set(id, { id, ...data });
          });
        }
      });
      const ordersList = Array.from(ordersMap.values());
      const productsMap = /* @__PURE__ */ new Map();
      try {
        const prodQueries = [];
        if (effectiveTenantId) {
          prodQueries.push((0, import_firestore5.getDocs)((0, import_firestore5.query)((0, import_firestore5.collection)(db, "products"), (0, import_firestore5.where)("userId", "==", effectiveTenantId))).catch(() => null));
        }
        prodQueries.push((0, import_firestore5.getDocs)((0, import_firestore5.collection)(db, "products")).catch(() => null));
        const pSnaps = await Promise.all(prodQueries);
        pSnaps.forEach((snap) => {
          if (snap && snap.docs) {
            snap.docs.forEach((d) => {
              productsMap.set(d.id, { id: d.id, ...d.data() });
            });
          }
        });
      } catch {
      }
      const productsList = Array.from(productsMap.values());
      const eventsList = [...recentEventsBuffer];
      const { computeDashboardStats: computeDashboardStats2 } = await Promise.resolve().then(() => (init_analyticsService(), analyticsService_exports));
      const stats = computeDashboardStats2(
        ordersList,
        productsList,
        eventsList,
        rangeType,
        prodFilter,
        from ? String(from) : void 0,
        to ? String(to) : void 0
      );
      dashboardStatsCache.set(cacheKey, {
        timestamp: nowMs,
        data: stats
      });
      if (dashboardStatsCache.size > 100) {
        dashboardStatsCache.clear();
      }
      res.json(stats);
    } catch (e) {
      console.error("[STATS API ERROR]:", e);
      res.status(500).json({ error: e.message || "Erreur calcul statistiques" });
    }
  };
  app2.get("/api/dashboard/stats", handleGetDashboardStats);
  app2.get("/dashboard/stats", handleGetDashboardStats);
  app2.get("/api/products", async (req, res) => {
    try {
      const tenantId = req.query.tenantId;
      const productsMap = /* @__PURE__ */ new Map();
      const queries = [];
      if (tenantId) {
        queries.push((0, import_firestore5.getDocs)((0, import_firestore5.query)((0, import_firestore5.collection)(db, "products"), (0, import_firestore5.where)("userId", "==", tenantId))).catch(() => null));
        queries.push((0, import_firestore5.getDocs)((0, import_firestore5.collection)(db, "tenants", tenantId, "products")).catch(() => null));
      }
      queries.push((0, import_firestore5.getDocs)((0, import_firestore5.collection)(db, "products")).catch(() => null));
      const snaps = await Promise.all(queries);
      snaps.forEach((snap) => {
        if (snap && snap.docs) {
          snap.docs.forEach((d) => {
            const data = d.data();
            const id = d.id;
            const name = data.name || data.title || "Produit sans nom";
            if (!productsMap.has(id)) {
              productsMap.set(id, { id, name });
            }
          });
        }
      });
      res.json(Array.from(productsMap.values()));
    } catch (e) {
      console.warn("Error in /api/products handler:", e);
      res.json([]);
    }
  });
  const cartTrackRate = /* @__PURE__ */ new Map();
  function clientIpOf(req) {
    const fwd = String(req.headers["x-forwarded-for"] || "");
    return (fwd.split(",")[0] || req.socket?.remoteAddress || "unknown").trim();
  }
  function cartText(v, max) {
    return String(v ?? "").trim().slice(0, max);
  }
  function isValidDzDigits(digits) {
    return /^0[567]\d{8}$/.test(digits) || /^213[567]\d{8}$/.test(digits);
  }
  app2.post("/api/abandoned-carts/track", async (req, res) => {
    try {
      const b = req.body || {};
      if (cartText(b.website, 50)) {
        res.status(400).json({ ok: false, error: "bot_detected" });
        return;
      }
      const ip = clientIpOf(req);
      const now = Date.now();
      if (cartTrackRate.size > 5e3) cartTrackRate.clear();
      const rl = cartTrackRate.get(ip) || { count: 0, reset: now + 10 * 60 * 1e3 };
      if (now > rl.reset) {
        rl.count = 0;
        rl.reset = now + 10 * 60 * 1e3;
      }
      rl.count++;
      cartTrackRate.set(ip, rl);
      if (rl.count > 60) {
        res.status(429).json({ ok: false, error: "rate_limited" });
        return;
      }
      const tenantId = cartText(b.tenantId, 60);
      const phoneRaw = cartText(b.phone, 20);
      const digits = phoneRaw.replace(/\D/g, "");
      if (!tenantId || !/^[a-zA-Z0-9_.-]+$/.test(tenantId)) {
        res.status(400).json({ ok: false, error: "invalid_tenant" });
        return;
      }
      if (!isValidDzDigits(digits)) {
        res.status(400).json({ ok: false, error: "invalid_phone" });
        return;
      }
      let tenantExists = false;
      try {
        const tenantSnap = await (0, import_firestore5.getDoc)((0, import_firestore5.doc)(db, "tenants", tenantId));
        tenantExists = tenantSnap.exists();
      } catch (e) {
        console.warn("abandoned-carts/track: tenant check failed:", e);
      }
      if (!tenantExists) {
        res.status(404).json({ ok: false, error: "unknown_store" });
        return;
      }
      const rawItems = Array.isArray(b.items) ? b.items.slice(0, 20) : [];
      const items = rawItems.map((it) => ({
        productId: cartText(it?.productId, 60) || "unknown",
        name: cartText(it?.name, 150),
        image: cartText(it?.image, 500),
        variants: it?.variants && typeof it.variants === "object" && !Array.isArray(it.variants) ? Object.fromEntries(Object.entries(it.variants).slice(0, 8).map(([k, v]) => [cartText(k, 40), cartText(v, 60)])) : {},
        quantity: Math.max(1, Math.min(999, Math.round(Number(it?.qty ?? it?.quantity) || 1))),
        price: Math.max(0, Math.min(1e8, Math.round(Number(it?.price) || 0)))
      }));
      if (items.length === 0) {
        res.status(400).json({ ok: false, error: "no_items" });
        return;
      }
      const subtotal = Math.max(0, Math.min(1e8, Math.round(Number(b.subtotal) || 0)));
      const shipping = Math.max(0, Math.min(1e5, Math.round(Number(b.shipping) || 0)));
      const total = Math.max(0, Math.min(1e8, Math.round(Number(b.total) || subtotal + shipping)));
      const itemsSummary = cartText(
        b.itemsSummary,
        300
      ) || items.map((it) => `${it.name} x${it.quantity}`).join("\u060C ").slice(0, 300);
      const first = items[0];
      const variantKey = Object.entries(first.variants).map(([k, v]) => `${k}:${v}`).sort().join("|").slice(0, 40);
      const slugSrc = `${first.productId}_${variantKey}`.replace(/[^a-zA-Z0-9_-]+/g, "_").slice(0, 90);
      const cartId = `cart_${tenantId}_${digits}_${slugSrc}`;
      const nowIso = (/* @__PURE__ */ new Date()).toISOString();
      const utm = b.utm && typeof b.utm === "object" && !Array.isArray(b.utm) ? b.utm : {};
      const payload = {
        tenantId,
        storeId: tenantId,
        storeSlug: cartText(b.slug, 80),
        sessionId: cartText(b.sessionId, 60),
        phone: phoneRaw,
        phoneDigits: digits,
        client: cartText(b.client, 80),
        email: "",
        wilaya: cartText(b.wilaya, 80),
        commune: cartText(b.commune, 80),
        address: cartText(b.address, 250),
        deliveryType: b.deliveryType === "desk" ? "desk" : "home",
        items,
        itemsSummary,
        subtotal,
        shipping,
        total,
        source: cartText(b.source, 60) || "storefront_form",
        pageUrl: cartText(b.pageUrl, 300),
        utmSource: cartText(utm.source, 60),
        utmMedium: cartText(utm.medium, 60),
        utmCampaign: cartText(utm.campaign, 60),
        lang: b.lang === "fr" ? "fr" : "ar",
        // Consentement WhatsApp (mention + case éventuelle) stocké avec le panier
        consentText: cartText(b.consentText, 300),
        consentChecked: b.consentChecked === true,
        consentAt: b.consentChecked === true ? nowIso : "",
        updatedAt: nowIso
      };
      const cartRef = (0, import_firestore5.doc)(db, "abandoned_carts", cartId);
      let status = "abandoned";
      let createdAt = nowIso;
      try {
        const existing = await (0, import_firestore5.getDoc)(cartRef);
        if (existing.exists()) {
          const prev = existing.data() || {};
          if (prev.status === "contacted" || prev.status === "relanced" || prev.status === "recovered") {
            status = prev.status === "relanced" ? "contacted" : prev.status;
          }
          if (prev.createdAt) createdAt = prev.createdAt;
          payload.relanceCount = prev.relanceCount || 0;
        }
      } catch (e) {
        console.warn("abandoned-carts/track: read existing failed:", e);
      }
      payload.status = status;
      payload.createdAt = createdAt;
      await (0, import_firestore5.setDoc)(cartRef, payload, { merge: true });
      await (0, import_firestore5.setDoc)((0, import_firestore5.doc)(db, "tenants", tenantId, "abandoned_carts", cartId), payload, { merge: true });
      processWhatsAppQueue(false).catch(() => {
      });
      res.json({ ok: true, id: cartId, status });
    } catch (e) {
      console.warn("Error in /api/abandoned-carts/track:", e);
      res.status(500).json({ ok: false, error: "track_failed" });
    }
  });
  app2.post("/api/abandoned-carts/recover", async (req, res) => {
    try {
      const b = req.body || {};
      const tenantId = cartText(b.tenantId, 60);
      const digits = cartText(b.phone, 20).replace(/\D/g, "");
      const orderId = cartText(b.orderId, 80);
      if (!tenantId || !/^[a-zA-Z0-9_.-]+$/.test(tenantId) || !isValidDzDigits(digits)) {
        res.status(400).json({ ok: false, error: "invalid_request" });
        return;
      }
      const nowIso = (/* @__PURE__ */ new Date()).toISOString();
      const updates = {
        status: "recovered",
        recovered: true,
        recoveredAt: nowIso,
        updatedAt: nowIso
      };
      if (orderId) updates.orderId = orderId;
      let updated = 0;
      try {
        const snap = await (0, import_firestore5.getDocs)((0, import_firestore5.query)((0, import_firestore5.collection)(db, "abandoned_carts"), (0, import_firestore5.where)("phoneDigits", "==", digits)));
        const ids = [];
        snap.forEach((d) => {
          const data = d.data() || {};
          if (data.tenantId === tenantId && data.status !== "recovered") {
            ids.push(d.id);
          }
        });
        for (const id of ids) {
          await (0, import_firestore5.setDoc)((0, import_firestore5.doc)(db, "abandoned_carts", id), updates, { merge: true });
          await (0, import_firestore5.setDoc)((0, import_firestore5.doc)(db, "tenants", tenantId, "abandoned_carts", id), updates, { merge: true });
          updated++;
        }
      } catch (e) {
        console.warn("abandoned-carts/recover: query failed:", e);
      }
      const legacyId = `cart_${tenantId}_${digits}`;
      try {
        const legacy = await (0, import_firestore5.getDoc)((0, import_firestore5.doc)(db, "abandoned_carts", legacyId));
        if (legacy.exists()) {
          await (0, import_firestore5.setDoc)((0, import_firestore5.doc)(db, "abandoned_carts", legacyId), updates, { merge: true });
          await (0, import_firestore5.setDoc)((0, import_firestore5.doc)(db, "tenants", tenantId, "abandoned_carts", legacyId), updates, { merge: true });
          updated++;
        }
      } catch (e) {
        console.warn("abandoned-carts/recover: legacy doc failed:", e);
      }
      res.json({ ok: true, updated });
    } catch (e) {
      console.warn("Error in /api/abandoned-carts/recover:", e);
      res.status(500).json({ ok: false, error: "recover_failed" });
    }
  });
  registerWhatsAppRoutes(app2);
  return app2;
}
async function startServer() {
  const app2 = await getApp();
  const PORT = 3e3;
  if (process.env.NODE_ENV !== "production") {
    const vite = await (0, import_vite.createServer)({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app2.use(vite.middlewares);
  } else {
    const distPath = import_path2.default.join(process.cwd(), "dist");
    app2.use(import_express3.default.static(distPath));
    app2.get("*", (req, res) => {
      res.sendFile(import_path2.default.join(distPath, "index.html"));
    });
  }
  app2.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}
if (require.main === module) {
  startServer();
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  getApp
});
//# sourceMappingURL=server.cjs.map
