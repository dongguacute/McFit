import type { AmapSelectedMcDonaldStore } from "@mcfit/api";

function amapNearestMcdUrl(): string {
  const u = import.meta.env.VITE_AMAP_PROXY_URL;
  if (typeof u === "string" && u.trim()) {
    return u.trim().replace(/\/+$/, "");
  }
  return "/api/amap-nearest-mcd";
}

/**
 * 通过同源开发代理（或 VITE_AMAP_PROXY_URL）调用高德，选取距离最近且推断为营业中的麦当劳。
 */
export async function fetchAmapNearestOpenMcDonald(params: {
  amapKey: string;
  wgs84Latitude: number;
  wgs84Longitude: number;
}): Promise<AmapSelectedMcDonaldStore> {
  const url = amapNearestMcdUrl();
  let res: Response;
  try {
    res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        key: params.amapKey,
        latitude: params.wgs84Latitude,
        longitude: params.wgs84Longitude,
      }),
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    throw new Error(
      `${msg} · 若部署在静态环境，请配置可转发高德请求的 BFF，并设置 VITE_AMAP_PROXY_URL。`,
    );
  }
  const text = await res.text();
  let data: { ok?: boolean; store?: AmapSelectedMcDonaldStore; error?: string } = {};
  try {
    data = JSON.parse(text) as typeof data;
  } catch {
    throw new Error(`高德代理响应无效：${text.slice(0, 160)}`);
  }
  if (!res.ok || !data.ok || !data.store) {
    throw new Error(data.error || text || `HTTP ${res.status}`);
  }
  return data.store;
}
