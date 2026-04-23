import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import OpenAI from "openai";
import type {
  ChatCompletionFunctionTool,
  ChatCompletionMessage,
  ChatCompletionMessageParam,
  ChatCompletionTool,
} from "openai/resources/chat/completions";
import { DEFAULT_MCD_MCP_BASE_URL, type RequestBody, type ResponseBody } from "./types.js";

function resolveOptionalHttpBase(
  value: string | undefined,
  field: string,
): string | undefined {
  const t = value?.trim();
  if (!t) return undefined;
  try {
    const u = new URL(t);
    if (u.protocol !== "https:" && u.protocol !== "http:") {
      throw new Error("unsupported protocol");
    }
    u.hash = "";
    return u.toString().replace(/\/+$/, "");
  } catch {
    throw new Error(`${field} 须为有效 http(s) URL`);
  }
}

/** 文档载明服务端支持 MCP 2025-06-18 及之前版本 */
const MCD_MCP_PROTOCOL_VERSION = "2025-06-18";

const DEFAULT_MODEL = "gpt-4o-mini";
const MAX_TOOL_ROUNDS = 12;

function mcpToolToOpenAI(tool: {
  name: string;
  description?: string;
  inputSchema: Record<string, unknown>;
}): ChatCompletionFunctionTool {
  return {
    type: "function",
    function: {
      name: tool.name,
      description: tool.description ?? "",
      parameters:
        tool.inputSchema as ChatCompletionFunctionTool["function"]["parameters"],
    },
  };
}

function textFromAssistantMessage(msg: ChatCompletionMessage): string {
  if (msg.refusal) return msg.refusal;
  return msg.content ?? "";
}

function formatMcpToolResult(
  result: Awaited<ReturnType<Client["callTool"]>>,
): string {
  if (result && typeof result === "object" && "toolResult" in result) {
    return JSON.stringify(result.toolResult);
  }
  if (
    result &&
    typeof result === "object" &&
    "content" in result &&
    Array.isArray(result.content)
  ) {
    const parts = result.content.map((block) => {
      if (block.type === "text") return block.text;
      return JSON.stringify(block);
    });
    if (result.isError) {
      return `[工具错误] ${parts.join("\n")}`;
    }
    return parts.join("\n");
  }
  return JSON.stringify(result);
}

/**
 * 使用 OpenAI Chat Completions（函数调用）驱动对话，并通过麦当劳 MCP 暴露的工具完成点餐、领券等能力。
 *
 * - `mcptoken`：请求头 `Authorization: Bearer <token>`，见麦当劳 MCP 文档。
 * - `aitoken`：OpenAI 兼容 `apiKey`。
 * - `mcpBaseUrl`：可选，省略则用 {@link DEFAULT_MCD_MCP_BASE_URL}。
 * - `aiBaseUrl`：可选，作为 OpenAI 客户端的 `baseURL`（兼容代理或自建端点）。
 */
export async function runMcpAgent(body: RequestBody): Promise<ResponseBody> {
  const mcptoken = body.mcptoken.trim();
  const aitoken = body.aitoken.trim();
  if (!mcptoken || !aitoken || !body.prompt.trim()) {
    throw new Error("mcptoken、aitoken 与 prompt 均不能为空");
  }

  const mcpBaseResolved =
    resolveOptionalHttpBase(body.mcpBaseUrl, "mcpBaseUrl") ??
    DEFAULT_MCD_MCP_BASE_URL;
  const aiBaseResolved = resolveOptionalHttpBase(body.aiBaseUrl, "aiBaseUrl");

  const openai = new OpenAI(
    aiBaseResolved
      ? { apiKey: aitoken, baseURL: aiBaseResolved }
      : { apiKey: aitoken },
  );

  const transport = new StreamableHTTPClientTransport(
    new URL(mcpBaseResolved),
    {
      requestInit: {
        headers: {
          Authorization: `Bearer ${mcptoken}`,
        },
      },
    },
  );
  transport.setProtocolVersion(MCD_MCP_PROTOCOL_VERSION);

  const mcp = new Client({ name: "mcfit-api", version: "0.0.0" });
  await mcp.connect(transport);

  try {
    const { tools: mcpTools } = await mcp.listTools();
    const openaiTools: ChatCompletionTool[] = mcpTools.map((t) =>
      mcpToolToOpenAI(t),
    );

    const messages: ChatCompletionMessageParam[] = [
      {
        role: "system",
        content:
          "你是协助用户使用麦当劳中国 MCP 工具的助手。需要优惠券、点餐、门店、营养信息等事实时，必须调用提供的工具获取结果，再用简洁中文总结给用户。不要编造订单或券信息。",
      },
      { role: "user", content: body.prompt },
    ];

    for (let round = 0; round < MAX_TOOL_ROUNDS; round++) {
      const completion = await openai.chat.completions.create({
        model: DEFAULT_MODEL,
        messages,
        tools: openaiTools.length > 0 ? openaiTools : undefined,
      });

      const choice = completion.choices[0];
      if (!choice?.message) {
        throw new Error("OpenAI 未返回有效消息");
      }

      const msg = choice.message;
      const toolCalls = msg.tool_calls;

      if (!toolCalls?.length) {
        const text = textFromAssistantMessage(msg);
        return { message: text || "(模型未返回文本内容)" };
      }

      messages.push({
        role: "assistant",
        content: msg.content,
        tool_calls: toolCalls,
      });

      for (const tc of toolCalls) {
        if (tc.type !== "function") {
          throw new Error(`暂不支持的 tool_calls 类型: ${tc.type}`);
        }
        let args: Record<string, unknown> = {};
        if (tc.function.arguments) {
          try {
            args = JSON.parse(tc.function.arguments) as Record<string, unknown>;
          } catch {
            args = {};
          }
        }
        const toolResult = await mcp.callTool({
          name: tc.function.name,
          arguments: args,
        });
        messages.push({
          role: "tool",
          tool_call_id: tc.id,
          content: formatMcpToolResult(toolResult),
        });
      }
    }

    return {
      message: `已达到工具调用轮数上限（${MAX_TOOL_ROUNDS}），请简化问题后重试。`,
    };
  } finally {
    await mcp.close();
  }
}
