/**
 * 麦当劳中国托管 MCP 默认接入地址（Streamable HTTP），与开放平台文档一致。
 * @see https://open.mcd.cn/mcp/doc
 */
export const DEFAULT_MCD_MCP_BASE_URL = "https://mcp.mcd.cn" as const;

/** OpenAI 兼容 Chat Completions 默认模型（与 `runMcpAgent` 一致） */
export const DEFAULT_AI_MODEL = "gpt-4o-mini" as const;

/** 调用麦当劳 MCP + OpenAI 时的请求体（可与前端设置页 `McFitSettings` 对齐传入） */
export type RequestBody = {
  /** 麦当劳 MCP Token，见 https://open.mcd.cn/mcp/doc */
  mcptoken: string;
  /** OpenAI 兼容 API Key */
  aitoken: string;
  prompt: string;
  /**
   * MCP Streamable HTTP 根地址；省略则使用 {@link DEFAULT_MCD_MCP_BASE_URL}。
   */
  mcpBaseUrl?: string;
  /**
   * OpenAI 兼容 API 的 Base URL（如 `https://api.openai.com/v1` 或代理）；省略则由 SDK 使用默认端点。
   */
  aiBaseUrl?: string;
  /**
   * Chat Completions 模型名；省略则使用 {@link DEFAULT_AI_MODEL}。
   */
  model?: string;
};

export type ResponseBody = {
  message: string;
};
