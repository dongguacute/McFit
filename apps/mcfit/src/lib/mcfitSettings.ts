import { DEFAULT_AI_MODEL, type RequestBody } from "@mcfit/api";
import { DEFAULT_WEIGHT_KG_FOR_BURN } from "./exerciseEnergy";

const STORAGE_KEY = "mcfit_settings_v1";

/** 与系统设置一并持久化；`system` 时依 `prefers-color-scheme` 切换 `html.dark` */
export type McFitThemeMode = "light" | "dark" | "system";

export type McFitSettings = {
  /**
   * 高德开放平台 Web 服务 Key（用于周边搜索麦当劳门店）。
   * @see https://lbs.amap.com/api/webservice/guide/create-project/get-key
   */
  amapWebKey: string;
  /** MCP Streamable HTTP 根地址；留空则请求体不传 `mcpBaseUrl`，由 `@mcfit/api` 使用默认端点。 */
  mcpBaseUrl: string;
  /** 麦当劳 MCP Token，见 https://open.mcd.cn/mcp/doc */
  mcpToken: string;
  /** OpenAI 兼容 API 的 Base URL，例如 https://api.openai.com/v1 或代理地址 */
  aiApiBaseUrl: string;
  /** 对应 `RequestBody.aitoken`，与上方 Base URL 配对的 API Key */
  aiApiKey: string;
  /** OpenAI 兼容 Chat Completions 模型名，对应 `RequestBody.model` */
  aiModel: string;
  /** 初始体重（千克，建议空腹 / 开练前基准），未设置时为 `null` */
  initialWeightKg: number | null;
  /** 现在体重（千克），运动耗热优先用此项；可随你定期在设置里更新 */
  currentWeightKg: number | null;
  /** 界面主题 */
  theme: McFitThemeMode;
};

const defaults: McFitSettings = {
  amapWebKey: "",
  mcpBaseUrl: "",
  mcpToken: "",
  aiApiBaseUrl: "",
  aiApiKey: "",
  aiModel: DEFAULT_AI_MODEL,
  initialWeightKg: null,
  currentWeightKg: null,
  theme: "system",
};

export function loadMcFitSettings(): McFitSettings {
  if (typeof localStorage === "undefined") {
    return { ...defaults };
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return { ...defaults };
    }
    const p = JSON.parse(raw) as Partial<McFitSettings>;
    const wi = p.initialWeightKg;
    const initialWeightKg =
      typeof wi === "number" && Number.isFinite(wi) && wi >= 0 ? wi : null;
    const wc = p.currentWeightKg;
    const currentWeightKg =
      typeof wc === "number" && Number.isFinite(wc) && wc >= 0 ? wc : null;
    const th = p.theme;
    const theme: McFitThemeMode =
      th === "light" || th === "dark" || th === "system" ? th : "system";
    return {
      amapWebKey: typeof p.amapWebKey === "string" ? p.amapWebKey : "",
      mcpBaseUrl: typeof p.mcpBaseUrl === "string" ? p.mcpBaseUrl : "",
      mcpToken: typeof p.mcpToken === "string" ? p.mcpToken : "",
      aiApiBaseUrl: typeof p.aiApiBaseUrl === "string" ? p.aiApiBaseUrl : "",
      aiApiKey: typeof p.aiApiKey === "string" ? p.aiApiKey : "",
      aiModel:
        typeof p.aiModel === "string" && p.aiModel.trim()
          ? p.aiModel.trim()
          : DEFAULT_AI_MODEL,
      initialWeightKg,
      currentWeightKg,
      theme,
    };
  } catch {
    return { ...defaults };
  }
}

export function saveMcFitSettings(s: McFitSettings): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
}

/**
 * MET 耗热用体重（kg）：
 * **现在体重** 优先，否则 **初始体重**，最后默认 {@link DEFAULT_WEIGHT_KG_FOR_BURN}。
 */
export function weightKgForCalorieEstimate(s: McFitSettings): number {
  if (s.currentWeightKg != null && s.currentWeightKg > 0) {
    return s.currentWeightKg;
  }
  if (s.initialWeightKg != null && s.initialWeightKg > 0) {
    return s.initialWeightKg;
  }
  return DEFAULT_WEIGHT_KG_FOR_BURN;
}

/**
 * 将本地设置与当前对话 `prompt` 组装为 `runMcpAgent` 所需的 {@link RequestBody}（供 BFF/路由转发给 `@mcfit/api`）。
 */
export function toRunMcpAgentBody(s: McFitSettings, prompt: string): RequestBody {
  return {
    mcptoken: s.mcpToken.trim(),
    aitoken: s.aiApiKey.trim(),
    prompt: prompt.trim(),
    model: s.aiModel.trim() || DEFAULT_AI_MODEL,
    ...(s.mcpBaseUrl.trim() && { mcpBaseUrl: s.mcpBaseUrl.trim() }),
    ...(s.aiApiBaseUrl.trim() && { aiBaseUrl: s.aiApiBaseUrl.trim() }),
  };
}
