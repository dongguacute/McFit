/** 调用麦当劳 MCP + OpenAI 时的请求体 */
export type RequestBody = {
  /** 麦当劳 MCP Token，见 https://open.mcd.cn/mcp/doc */
  mcptoken: string;
  /** OpenAI API Key */
  aitoken: string;
  prompt: string;
};

export type ResponseBody = {
  message: string;
};
