/**
 * 仅由 Vite 开发/预览中间件在 Node 中调用：请求高德 Web 服务（避免浏览器直连 CORS）。
 * @see https://lbs.amap.com/api/webservice/guide/api/search
 */

import type { AmapSelectedMcDonaldStore } from "./src/lib/amapSelectedStore.ts";

const PI = Math.PI;
const AXIS = 6378245.0;
const OFFSET = 0.00669342162296594323;

function outOfChina(lat: number, lng: number): boolean {
  return lng < 72.004 || lng > 137.8347 || lat < 0.8293 || lat > 55.8271;
}

function transformLat(x: number, y: number): number {
  let ret =
    -100.0 +
    2.0 * x +
    3.0 * y +
    0.2 * y * y +
    0.1 * x * y +
    0.2 * Math.sqrt(Math.abs(x));
  ret += ((20.0 * Math.sin(6.0 * x * PI) + 20.0 * Math.sin(2.0 * x * PI)) * 2.0) / 3.0;
  ret += ((20.0 * Math.sin(y * PI) + 40.0 * Math.sin((y / 3.0) * PI)) * 2.0) / 3.0;
  ret += ((160.0 * Math.sin((y / 12.0) * PI) + 320 * Math.sin((y * PI) / 30.0)) * 2.0) / 3.0;
  return ret;
}

function transformLon(x: number, y: number): number {
  let ret =
    300.0 +
    x +
    2.0 * y +
    0.1 * x * x +
    0.1 * x * y +
    0.1 * Math.sqrt(Math.abs(x));
  ret += ((20.0 * Math.sin(6.0 * x * PI) + 20.0 * Math.sin(2.0 * x * PI)) * 2.0) / 3.0;
  ret += ((20.0 * Math.sin(x * PI) + 40.0 * Math.sin((x / 3.0) * PI)) * 2.0) / 3.0;
  ret += ((150.0 * Math.sin((x / 12.0) * PI) + 300.0 * Math.sin((x / 30.0) * PI)) * 2.0) / 3.0;
  return ret;
}

export function wgs84ToGcj02(wgsLat: number, wgsLng: number): { lat: number; lng: number } {
  if (outOfChina(wgsLat, wgsLng)) {
    return { lat: wgsLat, lng: wgsLng };
  }
  let dLat = transformLat(wgsLng - 105.0, wgsLat - 35.0);
  let dLng = transformLon(wgsLng - 105.0, wgsLat - 35.0);
  const radLat = (wgsLat / 180.0) * PI;
  let magic = Math.sin(radLat);
  magic = 1 - OFFSET * magic * magic;
  const sqrtMagic = Math.sqrt(magic);
  dLat = (dLat * 180.0) / (((AXIS * (1 - OFFSET)) / (magic * sqrtMagic)) * PI);
  dLng = (dLng * 180.0) / ((AXIS / sqrtMagic) * Math.cos(radLat) * PI);
  return { lat: wgsLat + dLat, lng: wgsLng + dLng };
}

function isRecord(x: unknown): x is Record<string, unknown> {
  return typeof x === "object" && x != null;
}

function isMcDonaldName(name: string): boolean {
  return /麦当劳|金拱门|McDonald'?s?/i.test(name);
}

function parseLocation(loc: string): { lng: number; lat: number } | null {
  const parts = loc.split(",");
  if (parts.length !== 2) return null;
  const lng = Number.parseFloat(parts[0]!);
  const lat = Number.parseFloat(parts[1]!);
  if (!Number.isFinite(lng) || !Number.isFinite(lat)) return null;
  return { lng, lat };
}

function getBizExt(poi: Record<string, unknown>): Record<string, unknown> | null {
  const be = poi.biz_ext;
  if (be && typeof be === "object") return be as Record<string, unknown>;
  if (typeof be === "string") {
    try {
      const p = JSON.parse(be) as unknown;
      return isRecord(p) ? p : null;
    } catch {
      return null;
    }
  }
  return null;
}

function extractOpentimeTodayFromPoi(poi: Record<string, unknown>): string | undefined {
  const direct = poi.opentime_today;
  if (typeof direct === "string" && direct.trim()) return direct.trim();
  const be = getBizExt(poi);
  if (!be) return undefined;
  const ot = be.opentime_today;
  return typeof ot === "string" && ot.trim() ? ot.trim() : undefined;
}

/** 上海当前时刻的「从 0 点起的分钟数」 */
function minutesSinceMidnightShanghai(d: Date): number {
  const s = d.toLocaleTimeString("en-GB", {
    timeZone: "Asia/Shanghai",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  const [h, m] = s.split(":").map((x) => Number.parseInt(x, 10));
  if (!Number.isFinite(h) || !Number.isFinite(m)) return 0;
  return h * 60 + m;
}

/**
 * 根据高德 `opentime_today` 常见文案粗判是否营业中；无法解析时返回 true（不挡最近门店）。
 */
export function isLikelyOpenNowFromAmapOpentime(opentimeToday: string | undefined, now: Date): boolean {
  if (!opentimeToday || !opentimeToday.trim()) return true;
  const t = opentimeToday.trim();
  if (/休息|闭店|停业|暂不营业|已打烊|停止营业/i.test(t)) return false;
  if (/24小时|全天|24h|无休|营业中/i.test(t)) return true;
  const cur = minutesSinceMidnightShanghai(now);
  const range = t.match(/(\d{1,2})[:：](\d{2})\s*[-–~至到]\s*(\d{1,2})[:：](\d{2})/);
  if (!range) return true;
  const a = Number.parseInt(range[1]!, 10) * 60 + Number.parseInt(range[2]!, 10);
  const b = Number.parseInt(range[3]!, 10) * 60 + Number.parseInt(range[4]!, 10);
  if (!Number.isFinite(a) || !Number.isFinite(b)) return true;
  if (b < a) {
    return cur >= a || cur <= b;
  }
  return cur >= a && cur <= b;
}

async function amapGetJson(url: string): Promise<unknown> {
  const res = await fetch(url);
  const text = await res.text();
  try {
    return JSON.parse(text) as unknown;
  } catch {
    throw new Error(`高德接口返回非 JSON：${text.slice(0, 120)}`);
  }
}

async function placeAround(
  key: string,
  gcjLng: number,
  gcjLat: number,
): Promise<Record<string, unknown>[]> {
  const u = new URL("https://restapi.amap.com/v3/place/around");
  u.searchParams.set("key", key);
  u.searchParams.set("location", `${gcjLng},${gcjLat}`);
  u.searchParams.set("keywords", "麦当劳");
  u.searchParams.set("radius", "10000");
  u.searchParams.set("offset", "25");
  u.searchParams.set("extensions", "all");
  const data = await amapGetJson(u.toString());
  if (!isRecord(data)) throw new Error("高德周边搜索响应无效");
  if (String(data.status) !== "1") {
    throw new Error(`高德周边搜索失败：${String(data.info ?? data.infocode ?? "unknown")}`);
  }
  const pois = data.pois;
  if (!Array.isArray(pois)) return [];
  return pois.filter(isRecord);
}

async function placeDetail(key: string, id: string): Promise<Record<string, unknown> | null> {
  const u = new URL("https://restapi.amap.com/v3/place/detail");
  u.searchParams.set("key", key);
  u.searchParams.set("id", id);
  u.searchParams.set("extensions", "all");
  const data = await amapGetJson(u.toString());
  if (!isRecord(data)) return null;
  if (String(data.status) !== "1") return null;
  const pois = data.pois;
  if (!Array.isArray(pois) || pois.length === 0 || !isRecord(pois[0])) return null;
  return pois[0] as Record<string, unknown>;
}

function poiToCandidate(poi: Record<string, unknown>): {
  id: string;
  name: string;
  address: string;
  distanceM: number;
  gcjLng: number;
  gcjLat: number;
  opentimeFromAround?: string;
} | null {
  const id = typeof poi.id === "string" ? poi.id : "";
  const name = typeof poi.name === "string" ? poi.name : "";
  const address = typeof poi.address === "string" ? poi.address : "";
  const loc = typeof poi.location === "string" ? parseLocation(poi.location) : null;
  const dist = typeof poi.distance === "string" ? Number.parseInt(poi.distance, 10) : Number.NaN;
  if (!id || !name || !loc || !Number.isFinite(dist)) return null;
  const opentimeFromAround = extractOpentimeTodayFromPoi(poi);
  return {
    id,
    name,
    address,
    distanceM: dist,
    gcjLng: loc.lng,
    gcjLat: loc.lat,
    ...(opentimeFromAround ? { opentimeFromAround } : {}),
  };
}

export async function runAmapNearestOpenMcDonald(body: unknown): Promise<
  { ok: true; store: AmapSelectedMcDonaldStore } | { ok: false; error: string }
> {
  if (!body || typeof body !== "object") {
    return { ok: false, error: "请求体须为 JSON 对象" };
  }
  const r = body as Record<string, unknown>;
  const key = typeof r.key === "string" ? r.key.trim() : "";
  const lat = typeof r.latitude === "number" ? r.latitude : Number.NaN;
  const lng = typeof r.longitude === "number" ? r.longitude : Number.NaN;
  if (!key) {
    return { ok: false, error: "缺少高德 Web 服务 Key" };
  }
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return { ok: false, error: "latitude / longitude 无效" };
  }

  const gcj = wgs84ToGcj02(lat, lng);
  let pois: Record<string, unknown>[];
  try {
    pois = await placeAround(key, gcj.lng, gcj.lat);
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }

  const candidates = pois
    .map(poiToCandidate)
    .filter((x): x is NonNullable<typeof x> => x != null)
    .filter((c) => isMcDonaldName(c.name))
    .sort((a, b) => a.distanceM - b.distanceM);

  if (candidates.length === 0) {
    return { ok: false, error: "高德未找到附近的麦当劳门店，请稍后再试或检查定位。" };
  }

  const now = new Date();

  for (const c of candidates.slice(0, 12)) {
    let opentime = c.opentimeFromAround;
    if (!opentime) {
      try {
        const detail = await placeDetail(key, c.id);
        if (detail) {
          opentime = extractOpentimeTodayFromPoi(detail);
        }
      } catch {
        /* 单条详情失败则继续 */
      }
      await new Promise((r) => setTimeout(r, 40));
    }
    const open = isLikelyOpenNowFromAmapOpentime(opentime, now);
    if (open) {
      return {
        ok: true,
        store: {
          name: c.name,
          address: c.address,
          poiId: c.id,
          gcj02Longitude: c.gcjLng,
          gcj02Latitude: c.gcjLat,
          distanceM: c.distanceM,
          openInferred: opentime != null && opentime.length > 0,
          ...(opentime ? { opentimeToday: opentime } : {}),
        },
      };
    }
  }

  const fallback = candidates[0]!;
  return {
    ok: true,
    store: {
      name: fallback.name,
      address: fallback.address,
      poiId: fallback.id,
      gcj02Longitude: fallback.gcjLng,
      gcj02Latitude: fallback.gcjLat,
      distanceM: fallback.distanceM,
      openInferred: false,
    },
  };
}
