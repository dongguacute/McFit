/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** 可选：静态部署时高德代理完整 URL（需自建 BFF 转发高德 Web 服务） */
  readonly VITE_AMAP_PROXY_URL?: string;
  readonly VITE_CHECKIN_MENU_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
