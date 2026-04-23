export const API_VERSION = "0.0.0" as const;

export function ping(): string {
  return "pong";
}

export { runCheckinMenuAgent } from "./checkinMenu.js";
export type {
  AmapSelectedMcDonaldStore,
  CheckinMenuRequest,
  CheckinMealSlot,
} from "./checkinMenu.js";
export { parseCheckinMenuBody } from "./checkinMenu.js";
export { runMcpAgent } from "./mcp.js";
export type { RunMcpAgentOptions } from "./mcp.js";
export type { RequestBody, ResponseBody } from "./types.js";
export { DEFAULT_AI_MODEL, DEFAULT_MCD_MCP_BASE_URL } from "./types.js";
