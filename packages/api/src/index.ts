export const API_VERSION = "0.0.0" as const;

export function ping(): string {
  return "pong";
}

export { runMcpAgent } from "./mcp.js";
export type { RequestBody, ResponseBody } from "./types.js";
export { DEFAULT_MCD_MCP_BASE_URL } from "./types.js";
