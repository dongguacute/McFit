export const API_VERSION = "0.0.0" as const;

export function ping(): string {
  return "pong";
}

export { runMcpAgent } from "./mcp.js";
export type { RequestBody, ResponseBody } from "./types.js";
