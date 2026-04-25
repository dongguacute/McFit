import { runMcpAgent } from "./mcp.js";
import type { RequestBody, ResponseBody } from "./types.js";

export type CheckinMealSlot = {
  slotId: string;
  slotLabel: string;
  targetKcal: number;
};

/** 与前端高德代理返回结构一致，供 MCP 优先匹配门店 */
export type AmapSelectedMcDonaldStore = {
  name: string;
  address: string;
  poiId: string;
  gcj02Longitude: number;
  gcj02Latitude: number;
  distanceM: number;
  openInferred: boolean;
  opentimeToday?: string;
};

/** 签到拉取附近门店与菜单：与 {@link RequestBody} 相同鉴权字段，但不使用 `prompt`。 */
export type CheckinMenuRequest = Omit<RequestBody, "prompt"> & {
  latitude: number;
  longitude: number;
  /** 高德逆地理得到的用户位置文字，仅供模型理解；选店以 MCP `query-nearby-stores` 为准 */
  locationAddress?: string;
  /**
   * 旧版由高德周边搜预先选店时传入。新流程不依赖；若与 MCP 结果冲突，以 `query-nearby-stores` 为准。
   * @deprecated
   */
  amapSelectedStore?: AmapSelectedMcDonaldStore;
  /** 估测 TDEE + 今日运动 − minDayDeficitKcal，即「全日进食不超过该值则当日结束时缺口 ≥ minDayDeficitKcal」 */
  fullDayIntakeBudgetKcal: number;
  /** 用户今日已记录摄入（应用内饮食记录），用于实时收紧推荐 */
  consumedKcalSoFar: number;
  /** 当前仍宜摄入 ≈ fullDayIntakeBudgetKcal − consumedKcalSoFar（非负）；各餐段 targetKcal 之和应与此一致 */
  remainingIntakeBudgetKcal: number;
  /** 当日结束时希望保留的最低热量缺口（千卡），例如 500 */
  minDayDeficitKcal: number;
  /** 估测一日 TDEE（不含运动加项），便于模型理解「实时」余额 */
  estimatedTdeeKcal: number;
  /** 今日运动消耗（千卡），已折算进 fullDayIntakeBudgetKcal */
  exerciseBurnedTodayKcal: number;
  mealSlots: CheckinMealSlot[];
};

const CHECKIN_SYSTEM_PROMPT = `你是麦当劳中国 MCP 工具编排助手，须严格依据 MCP 工具返回的事实作答，不得编造门店、菜单或热量。
文档与鉴权说明见：https://open.mcd.cn/mcp/doc

流程要求：
1) **门店选择（必须）**：在调用其他门店类工具之前，**必须先**调用 MCP 的 **query-nearby-stores** 工具，传入用户 GPS（WGS84）或工具文档要求的参数字段，根据**工具返回**选定用于点餐的麦当劳餐厅（一般取最近一家，以该工具结果为准，勿使用高德/第三方进行门店搜索）。若 listTools 中该工具名称略有不同，以实际暴露的名称为准，但须完成等价的「附近门店」查询。**禁止**用高德 API 搜索麦当劳门店。用户消息中若出现「逆地理」文字地址，仅帮助理解位置，**不**能替代 query-nearby-stores 的查询结果。若（旧版兼容）消息中另含 amapSelectedStore 字段，可与 query-nearby-stores 结果核对，**以 query-nearby-stores 为准**确定 nearestStoreName / nearestStoreDetail。
2) 调用 MCP 中与「菜单、商品、营养、热量」相关的工具，获取**上述已选定门店**的可售商品及营养数据（以工具返回为准，不得混用其他门店菜单）。
3) 用户会给出**实时**数据：全日进食上限（保证当日结束时热量缺口仍不低于 minDayDeficitKcal）、已摄入、**剩余可摄入**与各餐段目标。仅为尚未结束的餐段从真实菜单中各推荐 1 款可点餐品或组合（可含饮品/小食），标注千卡数；**所推荐各餐 kcal 之和不得超过 remainingIntakeBudgetKcal**，且与餐段 target 大致匹配；不得按「固定 500 缺口」无视已摄入而超量推荐。
4) **商品图片**：对每个推荐的商品，必须从 MCP 工具返回的 JSON 中找出该商品对应节点下的图片字段，将其中所有 **http(s) 图片地址** 填入 items[].imageUrls。请在返回结构里递归查找常见键名（如 imageUrl、image、imgUrl、cover、coverUrl、pic、picture、thumbnail、icon、productImage、mainPic、images 数组内的 url 等）；同一商品多张图全部收录（去重后），不得编造、不得用占位图；若该商品在工具结果中确实无任何图片字段，则 imageUrls 可为 []。

工具全部调用完成后，**最终一条助手消息**须为可被 JSON.parse 直接解析的**单一对象**：
- 第一个非空白字符必须是「{」，最后一个非空白字符必须是「}」；首尾之外不得有任何说明、标题、Markdown、代码围栏或 think 标签。
- 键名与字符串值一律使用英文半角双引号；kcal 必须为 JSON 数字类型（不要用字符串）；不要用尾逗号。
格式严格为：
{"nearestStoreName":"字符串","nearestStoreDetail":"字符串，可空","items":[{"slotId":"字符串","slotLabel":"字符串","name":"字符串","kcal":数字,"note":"字符串，可空","imageUrls":["https://..."]}]}
其中 **每个 items 元素都应包含 imageUrls 数组**（无图时为 []）。imageUrls 中的字符串必须与工具返回一致、可公开访问的 http 或 https URL。items 的 slotId/slotLabel 须与用户给出的餐段一致；无法匹配的餐段可省略。`;

function asFiniteNumber(x: unknown): number | undefined {
  if (typeof x === "number" && Number.isFinite(x)) {
    return x;
  }
  if (typeof x === "string") {
    const t = x.trim().replace(/,/g, "");
    if (t === "") return undefined;
    const n = Number(t);
    if (Number.isFinite(n)) return n;
  }
  return undefined;
}

function firstFinite(r: Record<string, unknown>, keys: string[]): number | undefined {
  for (const k of keys) {
    const v = asFiniteNumber(r[k]);
    if (v !== undefined) return v;
  }
  return undefined;
}

function parseAmapSelectedStore(raw: unknown): AmapSelectedMcDonaldStore | undefined {
  if (!raw || typeof raw !== "object") return undefined;
  const o = raw as Record<string, unknown>;
  const name = typeof o.name === "string" ? o.name.trim() : "";
  const address = typeof o.address === "string" ? o.address.trim() : "";
  const poiId = typeof o.poiId === "string" ? o.poiId.trim() : "";
  const gcj02Longitude = firstFinite(o, ["gcj02Longitude", "gcj02_longitude"]);
  const gcj02Latitude = firstFinite(o, ["gcj02Latitude", "gcj02_latitude"]);
  const distanceM = firstFinite(o, ["distanceM", "distance_m"]);
  const openInferred = o.openInferred === true || o.open_inferred === true;
  const opentimeToday =
    typeof o.opentimeToday === "string" && o.opentimeToday.trim()
      ? o.opentimeToday.trim()
      : typeof o.opentime_today === "string" && o.opentime_today.trim()
        ? o.opentime_today.trim()
        : undefined;
  if (
    !name ||
    !poiId ||
    gcj02Longitude === undefined ||
    gcj02Latitude === undefined ||
    distanceM === undefined ||
    distanceM < 0
  ) {
    return undefined;
  }
  return {
    name,
    address,
    poiId,
    gcj02Longitude,
    gcj02Latitude,
    distanceM,
    openInferred,
    ...(opentimeToday ? { opentimeToday } : {}),
  };
}

function normalizeMealSlots(x: unknown): CheckinMealSlot[] {
  if (!Array.isArray(x)) {
    return [];
  }
  const out: CheckinMealSlot[] = [];
  for (const row of x) {
    if (!row || typeof row !== "object") continue;
    const o = row as Record<string, unknown>;
    const slotId =
      typeof o.slotId === "string"
        ? o.slotId
        : typeof o.slotId === "number" && Number.isFinite(o.slotId)
          ? String(o.slotId)
          : "";
    const slotLabel =
      typeof o.slotLabel === "string"
        ? o.slotLabel
        : typeof o.slotLabel === "number" && Number.isFinite(o.slotLabel)
          ? String(o.slotLabel)
          : "";
    const targetKcal = asFiniteNumber(o.targetKcal);
    if (!slotId || targetKcal === undefined) continue;
    out.push({ slotId, slotLabel: slotLabel || slotId, targetKcal });
  }
  return out;
}

/**
 * 将 HTTP JSON（含旧版字段名、字符串数字）规范为 {@link CheckinMenuRequest}。
 */
export function parseCheckinMenuBody(raw: unknown): CheckinMenuRequest {
  if (!raw || typeof raw !== "object") {
    throw new Error("请求体须为 JSON 对象");
  }
  const r = raw as Record<string, unknown>;

  const latitude = asFiniteNumber(r.latitude);
  const longitude = asFiniteNumber(r.longitude);
  if (latitude === undefined || longitude === undefined) {
    throw new Error("latitude 与 longitude 须为有效数字");
  }

  let fullDay = firstFinite(r, [
    "fullDayIntakeBudgetKcal",
    "full_day_intake_budget_kcal",
    "intakeBudgetKcal",
    "intake_budget_kcal",
  ]);

  let consumed = firstFinite(r, ["consumedKcalSoFar", "consumed_kcal_so_far"]);
  if (consumed === undefined) consumed = 0;

  let remaining = firstFinite(r, ["remainingIntakeBudgetKcal", "remaining_intake_budget_kcal"]);
  if (remaining === undefined && fullDay !== undefined) {
    remaining = Math.max(0, Math.round(fullDay - consumed));
  }

  let minDay = firstFinite(r, ["minDayDeficitKcal", "min_day_deficit_kcal", "plannedDeficitKcal", "planned_deficit_kcal"]);
  if (minDay === undefined) {
    minDay = 500;
  }

  let exercise = firstFinite(r, ["exerciseBurnedTodayKcal", "exercise_burned_today_kcal"]);
  if (exercise === undefined) exercise = 0;

  let tdee = firstFinite(r, ["estimatedTdeeKcal", "estimated_tdee_kcal"]);
  if (tdee === undefined && fullDay !== undefined) {
    tdee = Math.max(1, Math.round(fullDay + minDay - exercise));
  }

  if (fullDay === undefined) {
    throw new Error(
      "热量预算无效：请提供 fullDayIntakeBudgetKcal，或与旧版兼容的 intakeBudgetKcal",
    );
  }
  if (fullDay < 200) {
    throw new Error("fullDayIntakeBudgetKcal 过低（须 ≥ 200）");
  }
  if (consumed < 0) {
    throw new Error("consumedKcalSoFar 无效");
  }
  if (remaining === undefined || remaining < 0) {
    throw new Error("remainingIntakeBudgetKcal 无效");
  }
  if (minDay <= 0) {
    throw new Error("minDayDeficitKcal 无效");
  }
  if (tdee === undefined || tdee <= 0) {
    throw new Error("estimatedTdeeKcal 无效");
  }
  if (exercise < 0) {
    throw new Error("exerciseBurnedTodayKcal 无效");
  }

  const mealSlots = normalizeMealSlots(r.mealSlots);
  if (mealSlots.length === 0) {
    throw new Error("mealSlots 不能为空");
  }

  const amapSelectedStore = parseAmapSelectedStore(r.amapSelectedStore);
  const locAddr =
    typeof r.locationAddress === "string" && r.locationAddress.trim()
      ? r.locationAddress.trim()
      : typeof r.location_address === "string" && r.location_address.trim()
        ? r.location_address.trim()
        : undefined;

  return {
    mcptoken: typeof r.mcptoken === "string" ? r.mcptoken : "",
    aitoken: typeof r.aitoken === "string" ? r.aitoken : "",
    ...(typeof r.mcpBaseUrl === "string" && r.mcpBaseUrl.trim() && { mcpBaseUrl: r.mcpBaseUrl }),
    ...(typeof r.aiBaseUrl === "string" && r.aiBaseUrl.trim() && { aiBaseUrl: r.aiBaseUrl }),
    ...(typeof r.model === "string" && r.model.trim() && { model: r.model }),
    latitude,
    longitude,
    ...(locAddr && { locationAddress: locAddr }),
    ...(amapSelectedStore && { amapSelectedStore }),
    fullDayIntakeBudgetKcal: fullDay,
    consumedKcalSoFar: consumed,
    remainingIntakeBudgetKcal: remaining,
    minDayDeficitKcal: minDay,
    estimatedTdeeKcal: tdee,
    exerciseBurnedTodayKcal: exercise,
    mealSlots,
  };
}

/**
 * 签到场景：连接麦当劳 MCP（Streamable HTTP）与 OpenAI 兼容 API，自动选用工具查询最近餐厅与菜单并规划热量。
 * @param req 原始 POST JSON（可为旧版 intakeBudgetKcal / plannedDeficitKcal 字段）
 */
export async function runCheckinMenuAgent(req: unknown): Promise<ResponseBody> {
  const parsed = parseCheckinMenuBody(req);
  const lat = parsed.latitude;
  const lng = parsed.longitude;
  const amap = parsed.amapSelectedStore;
  const locAddr = (parsed.locationAddress ?? "").trim();

  const legacyAmap = amap
    ? [
        "【旧版兼容·高德曾选店，仅作参考；选店以 query-nearby-stores 结果为准】",
        `店名「${amap.name}」；地址「${amap.address}」；POI「${amap.poiId}」；`,
        `GCJ-02 经度 ${amap.gcj02Longitude}、纬度 ${amap.gcj02Latitude}；距当时定位约 ${Math.round(amap.distanceM)} m。`,
      ].join("")
    : "";

  const addressLines = locAddr
    ? `【用户位置（高德逆地理，仅供理解，选店须用 MCP query-nearby-stores）】${locAddr}。`
    : "【逆地理】未提供文字地址；请仍根据下方 WGS84 坐标使用 query-nearby-stores 选店。";

  const prompt = [
    `用户当前 GPS（WGS84）坐标：纬度 ${lat}，经度 ${lng}。`,
    addressLines,
    ...(legacyAmap ? [legacyAmap] : []),
    `请首先调用 query-nearby-stores 锁定门店，再查菜单。`,
    `热量规则（实时）：估测一日 TDEE 约 ${Math.round(parsed.estimatedTdeeKcal)} 千卡；今日运动约 +${Math.round(parsed.exerciseBurnedTodayKcal)} 千卡。` +
      `为在**当日结束时**仍保持至少 ${Math.round(parsed.minDayDeficitKcal)} 千卡的热量缺口，全日饮食不宜超过约 ${Math.round(parsed.fullDayIntakeBudgetKcal)} 千卡。` +
      `用户今日已记录摄入约 ${Math.round(parsed.consumedKcalSoFar)} 千卡，因此从现在起各餐推荐合计不宜超过约 ${Math.round(parsed.remainingIntakeBudgetKcal)} 千卡（勿超出）。`,
    `各餐段目标（请仅为仍适用的餐段在 items 中输出，slotId/slotLabel 保持一致；各条 kcal 之和须 ≤ ${Math.round(parsed.remainingIntakeBudgetKcal)}）：`,
    JSON.stringify(parsed.mealSlots),
    `请先调用 MCP 工具完成门店与菜单事实查询；输出 JSON 时，每个推荐商品必须把工具返回里该商品的图片 URL 全部写入对应条目的 imageUrls（无图则写 []）。全部工具调用结束后，请直接输出上述 JSON 对象本身，不要代码块、不要前后缀说明。`,
  ].join("\n");

  const body: RequestBody = {
    mcptoken: parsed.mcptoken,
    aitoken: parsed.aitoken,
    prompt,
    ...(parsed.mcpBaseUrl?.trim() && { mcpBaseUrl: parsed.mcpBaseUrl.trim() }),
    ...(parsed.aiBaseUrl?.trim() && { aiBaseUrl: parsed.aiBaseUrl.trim() }),
    ...(parsed.model?.trim() && { model: parsed.model.trim() }),
  };

  return runMcpAgent(body, { systemPrompt: CHECKIN_SYSTEM_PROMPT });
}
