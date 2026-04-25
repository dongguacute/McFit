/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** 可选：逆地理 BFF 完整 URL；不填时同源 /api/amap-regeo 或由 VITE_AMAP_PROXY_URL 将 …/amap-nearest-mcd 换为 …/amap-regeo */
  readonly VITE_AMAP_REGEO_URL?: string;
  /** 可选：静态部署时曾用于高德 Web 的代理基址（含 /amap-nearest-mcd 时会被换为 regeo 路径） */
  readonly VITE_AMAP_PROXY_URL?: string;
  readonly VITE_CHECKIN_MENU_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
