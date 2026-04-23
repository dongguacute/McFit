import type { AmapSelectedMcDonaldStore } from "@mcfit/api";
import { toRunMcpAgentBody } from "./mcfitSettings";
import type { McFitSettings } from "./mcfitSettings";

export type CheckinMenuPayload = {
  latitude: number;
  longitude: number;
  /** 高德选中的门店，提交 MCP 时优先匹配该店 */
  amapSelectedStore: AmapSelectedMcDonaldStore;
  fullDayIntakeBudgetKcal: number;
  consumedKcalSoFar: number;
  remainingIntakeBudgetKcal: number;
  minDayDeficitKcal: number;
  estimatedTdeeKcal: number;
  exerciseBurnedTodayKcal: number;
  mealSlots: { slotId: string; slotLabel: string; targetKcal: number }[];
};

function checkinMenuUrl(): string {
  const fromEnv = import.meta.env.VITE_CHECKIN_MENU_URL;
  if (typeof fromEnv === "string" && fromEnv.trim()) {
    return fromEnv.trim().replace(/\/+$/, "");
  }
  return "/api/checkin-menu";
}

export async function fetchCheckinMenuPlan(
  settings: McFitSettings,
  payload: CheckinMenuPayload,
): Promise<{ message: string }> {
  const base = toRunMcpAgentBody(settings, "");
  const body: Record<string, unknown> = {
    mcptoken: base.mcptoken,
    aitoken: base.aitoken,
    latitude: payload.latitude,
    longitude: payload.longitude,
    amapSelectedStore: payload.amapSelectedStore,
    fullDayIntakeBudgetKcal: payload.fullDayIntakeBudgetKcal,
    consumedKcalSoFar: payload.consumedKcalSoFar,
    remainingIntakeBudgetKcal: payload.remainingIntakeBudgetKcal,
    minDayDeficitKcal: payload.minDayDeficitKcal,
    estimatedTdeeKcal: payload.estimatedTdeeKcal,
    exerciseBurnedTodayKcal: payload.exerciseBurnedTodayKcal,
    mealSlots: payload.mealSlots,
    // 兼容仍校验旧字段名的 BFF / 未重新 build 的 @mcfit/api dist
    intakeBudgetKcal: payload.fullDayIntakeBudgetKcal,
    plannedDeficitKcal: payload.minDayDeficitKcal,
  };
  if (base.mcpBaseUrl) {
    body.mcpBaseUrl = base.mcpBaseUrl;
  }
  if (base.aiBaseUrl) {
    body.aiBaseUrl = base.aiBaseUrl;
  }
  if (base.model) {
    body.model = base.model;
  }

  const url = checkinMenuUrl();
  let res: Response;
  try {
    res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  } catch (e) {
    const isAbs = /^https?:\/\//i.test(url);
    const crossOriginHint = isAbs
      ? " 若该地址与当前页面不同源，请在服务端开启 CORS，或改为通过 Vite 代理走同源路径（如 /api/checkin-menu）。"
      : " 请确认已运行 dev/preview 且已执行 pnpm --filter @mcfit/api build；preview 模式需使用 vite preview（插件已挂载 /api/checkin-menu）。";
    const msg = e instanceof Error ? e.message : String(e);
    throw new Error(
      msg === "Failed to fetch" || msg === "Load failed" || msg === "NetworkError when attempting to fetch resource."
        ? `网络请求失败：无法连接到 ${url}。${crossOriginHint}`
        : `网络请求失败：${msg}`,
    );
  }
  const text = await res.text();
  let data: { message?: string; error?: string } = {};
  try {
    data = JSON.parse(text) as typeof data;
  } catch {
    /* ignore */
  }
  if (!res.ok) {
    throw new Error(data.error || text || `HTTP ${res.status}`);
  }
  if (typeof data.message !== "string") {
    throw new Error("响应缺少 message");
  }
  return { message: data.message };
}
