import type { RequestBody } from "@mcfit/api";

const STORAGE_KEY = "mcfit_settings_v1";

export type McFitSettings = {
  /** MCP Streamable HTTP 根地址；留空则请求体不传 `mcpBaseUrl`，由 `@mcfit/api` 使用默认端点。 */
  mcpBaseUrl: string;
  /** 麦当劳 MCP Token，见 https://open.mcd.cn/mcp/doc */
  mcpToken: string;
  /** OpenAI 兼容 API 的 Base URL，例如 https://api.openai.com/v1 或代理地址 */
  aiApiBaseUrl: string;
  /** 对应 `RequestBody.aitoken`，与上方 Base URL 配对的 API Key */
  aiApiKey: string;
  /** 初始体重（千克），未设置时为 `null` */
  initialWeightKg: number | null;
};

const defaults: McFitSettings = {
  mcpBaseUrl: "",
  mcpToken: "",
  aiApiBaseUrl: "",
  aiApiKey: "",
  initialWeightKg: null,
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
    const w = p.initialWeightKg;
    const initialWeightKg =
      typeof w === "number" && Number.isFinite(w) && w >= 0 ? w : null;
    return {
      mcpBaseUrl: typeof p.mcpBaseUrl === "string" ? p.mcpBaseUrl : "",
      mcpToken: typeof p.mcpToken === "string" ? p.mcpToken : "",
      aiApiBaseUrl: typeof p.aiApiBaseUrl === "string" ? p.aiApiBaseUrl : "",
      aiApiKey: typeof p.aiApiKey === "string" ? p.aiApiKey : "",
      initialWeightKg,
    };
  } catch {
    return { ...defaults };
  }
}

export function saveMcFitSettings(s: McFitSettings): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
}

/**
 * 将本地设置与当前对话 `prompt` 组装为 `runMcpAgent` 所需的 {@link RequestBody}（供 BFF/路由转发给 `@mcfit/api`）。
 */
export function toRunMcpAgentBody(s: McFitSettings, prompt: string): RequestBody {
  return {
    mcptoken: s.mcpToken.trim(),
    aitoken: s.aiApiKey.trim(),
    prompt: prompt.trim(),
    ...(s.mcpBaseUrl.trim() && { mcpBaseUrl: s.mcpBaseUrl.trim() }),
    ...(s.aiApiBaseUrl.trim() && { aiBaseUrl: s.aiApiBaseUrl.trim() }),
  };
}
