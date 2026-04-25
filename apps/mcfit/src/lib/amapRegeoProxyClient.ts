function amapRegeoUrl(): string {
  const explicit = import.meta.env.VITE_AMAP_REGEO_URL;
  if (typeof explicit === "string" && explicit.trim()) {
    return explicit.trim().replace(/\/+$/, "");
  }
  const legacy = import.meta.env.VITE_AMAP_PROXY_URL;
  if (typeof legacy === "string" && legacy.trim()) {
    return legacy
      .trim()
      .replace(/\/+$/, "")
      .replace(/amap-nearest-mcd\/?$/, "amap-regeo");
  }
  return "/api/amap-regeo";
}

/**
 * 通过同源开发代理（或 VITE_AMAP_PROXY_URL）调用高德逆地理，得到用户当前位置文字地址。
 */
export async function fetchAmapReversedAddress(params: {
  amapKey: string;
  wgs84Latitude: number;
  wgs84Longitude: number;
}): Promise<{ formattedAddress: string }> {
  const url = amapRegeoUrl();
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
      `${msg} · 若部署在静态环境，请配置逆地理 BFF，并设置 VITE_AMAP_REGEO_URL（或沿用 VITE_AMAP_PROXY_URL 且路径含 amap-regeo）。`,
    );
  }
  const text = await res.text();
  let data: { ok?: boolean; formattedAddress?: string; error?: string } = {};
  try {
    data = JSON.parse(text) as typeof data;
  } catch {
    throw new Error(`高德逆地理代理响应无效：${text.slice(0, 160)}`);
  }
  if (!res.ok || !data.ok || !data.formattedAddress) {
    throw new Error(data.error || text || `HTTP ${res.status}`);
  }
  return { formattedAddress: data.formattedAddress };
}
