import {
  buildMealPlanForNow,
  computeIntakeBudget,
  PLANNED_DAILY_DEFICIT_KCAL,
  remainingIntakeAllowanceKcal,
} from "./dailyNutrition";
import { fetchAmapReversedAddress } from "./amapRegeoProxyClient";
import { fetchCheckinMenuPlan } from "./checkinMenuClient";
import { loadWorkoutLogs } from "./exerciseDayLog";
import { ymdInBeijing } from "./exerciseEnergy";
import { getMcFitGeolocationPosition } from "./mcfitGeolocation";
import { loadMcFitSettings, weightKgForCalorieEstimate } from "./mcfitSettings";
import { todayConsumedMealKcal } from "./mealIntakeLog";
import { extractCheckinMenuJson } from "./parseCheckinMenu";
import { saveTodayMcpMenu, setMcpMenuError, setMcpMenuFetchPending } from "./todayMcpMenu";

function todayYmd(): string {
  return ymdInBeijing();
}

/**
 * 请求定位、高德逆地理，经 VITE_CHECKIN_MENU_URL 或开发代理调用签到 API，写入 {@link saveTodayMcpMenu}。
 * 供签到后与侧栏「重新拉取」共用。
 */
export async function runMcpMenuFetch(): Promise<{ ok: true } | { ok: false; error: string }> {
  const today = todayYmd();
  const settings = loadMcFitSettings();
  if (!settings.mcpToken.trim() || !settings.aiApiKey.trim()) {
    const msg = "请先在设置中填写麦当劳 MCP Token 与 AI API Key（见开放平台文档）。";
    setMcpMenuError(today, msg);
    return { ok: false, error: msg };
  }
  if (!settings.amapWebKey.trim()) {
    const msg = "请先在设置中填写高德 Web 服务 Key（用于您当前位置逆地理成文字地址）。";
    setMcpMenuError(today, msg);
    return { ok: false, error: msg };
  }

  setMcpMenuFetchPending(today, true, { clearError: true });
  try {
    let pos: GeolocationPosition;
    try {
      pos = await getMcFitGeolocationPosition();
    } catch {
      const msg = "需要定位权限才能查找附近麦当劳。";
      setMcpMenuError(today, msg);
      return { ok: false, error: msg };
    }
    const weightKg = weightKgForCalorieEstimate(settings);
    const logs = loadWorkoutLogs();
    const todayExerciseKcal = logs.filter((e) => e.ymd === today).reduce((a, b) => a + b.kcal, 0);
    const budget = computeIntakeBudget({
      weightKg,
      exerciseBurnedTodayKcal: todayExerciseKcal,
    });
    const consumedSoFar = todayConsumedMealKcal(today);
    const remaining = remainingIntakeAllowanceKcal({
      fullDayIntakeBudgetKcal: budget.intakeBudgetKcal,
      consumedKcalSoFar: consumedSoFar,
    });
    const mealPlan = buildMealPlanForNow(new Date(), remaining);
    const mealSlots = mealPlan.rows.map((r) => ({
      slotId: r.id,
      slotLabel: r.label,
      targetKcal: r.targetKcal,
    }));

    if (remaining <= 0) {
      const msg =
        "按当前记录，今日进食已达「保留 500 千卡缺口」下的上限，无法再规划更多餐食；若记录有误可在饮食记录中调整。";
      setMcpMenuError(today, msg);
      return { ok: false, error: msg };
    }

    let locationAddress: string | undefined;
    try {
      const re = await fetchAmapReversedAddress({
        amapKey: settings.amapWebKey.trim(),
        wgs84Latitude: pos.coords.latitude,
        wgs84Longitude: pos.coords.longitude,
      });
      locationAddress = re.formattedAddress;
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setMcpMenuError(today, `高德逆地理失败：${msg}`);
      return { ok: false, error: msg };
    }

    try {
      const { message } = await fetchCheckinMenuPlan(settings, {
        latitude: pos.coords.latitude,
        longitude: pos.coords.longitude,
        ...(locationAddress && { locationAddress }),
        fullDayIntakeBudgetKcal: budget.intakeBudgetKcal,
        consumedKcalSoFar: consumedSoFar,
        remainingIntakeBudgetKcal: remaining,
        minDayDeficitKcal: PLANNED_DAILY_DEFICIT_KCAL,
        estimatedTdeeKcal: budget.tdeeKcal,
        exerciseBurnedTodayKcal: todayExerciseKcal,
        mealSlots,
      });
      const parsed = extractCheckinMenuJson(message);
      const rid = () =>
        typeof crypto !== "undefined" && "randomUUID" in crypto
          ? crypto.randomUUID()
          : `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
      const items = parsed.items.map((it) => ({
        id: rid(),
        slotId: it.slotId,
        slotLabel: it.slotLabel,
        name: it.name,
        kcal: it.kcal,
        note: it.note,
        ...(it.imageUrls.length > 0 ? { imageUrls: it.imageUrls } : {}),
        status: "pending" as const,
      }));
      saveTodayMcpMenu({
        ymd: today,
        nearestStoreName: parsed.nearestStoreName,
        nearestStoreDetail: parsed.nearestStoreDetail,
        items,
        rawAssistantMessage: message,
        fetchedAt: Date.now(),
      });
      return { ok: true };
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setMcpMenuError(today, msg);
      return { ok: false, error: msg };
    }
  } finally {
    setMcpMenuFetchPending(today, false);
  }
}
