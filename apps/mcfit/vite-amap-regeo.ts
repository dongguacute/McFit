/**
 * Vite 开发/预览中间件：高德逆地理（用户 GPS → 文字地址），避免浏览器直连 CORS。
 * @see https://lbs.amap.com/api/webservice/guide/api/georegeo
 */

import { wgs84ToGcj02 } from "./vite-amap-geoUtils";

function isRecord(x: unknown): x is Record<string, unknown> {
  return typeof x === "object" && x != null;
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

/**
 * 将用户 WGS84 转 GCJ-02 后请求 regeo，返回 `formatted_address`。
 */
export async function runAmapRegeo(body: unknown): Promise<
  { ok: true; formattedAddress: string } | { ok: false; error: string }
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
  const u = new URL("https://restapi.amap.com/v3/geocode/regeo");
  u.searchParams.set("key", key);
  u.searchParams.set("location", `${gcj.lng},${gcj.lat}`);
  u.searchParams.set("extensions", "base");

  let data: unknown;
  try {
    data = await amapGetJson(u.toString());
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }

  if (!isRecord(data) || String(data.status) !== "1") {
    return {
      ok: false,
      error: `高德逆地理失败：${String(isRecord(data) ? (data.info ?? data.infocode) : "响应无效")}`,
    };
  }
  const regeocode = data.regeocode;
  if (!isRecord(regeocode)) {
    return { ok: false, error: "高德逆地理未返回 regeocode" };
  }
  const formatted =
    typeof regeocode.formatted_address === "string" && regeocode.formatted_address.trim()
      ? regeocode.formatted_address.trim()
      : "";
  if (!formatted) {
    return { ok: false, error: "高德逆地理未返回 formatted_address" };
  }
  return { ok: true, formattedAddress: formatted };
}
