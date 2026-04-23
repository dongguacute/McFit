import { MEAL_INTAKE_CHANGED } from "./mealIntakeLog";
import { TODAY_MENU_CHANGED } from "./todayMcpMenu";

/** 勿加入 `mcfit_settings_v1`（设置由用户保留） */
const KEYS_TO_REMOVE = [
  "mcfit_check_in_v1",
  "mcfit_exercise_day_log_v1",
  "mcfit_meal_intake_v1",
  "mcfit_today_mcp_menu_v1",
] as const;

/**
 * 开发调试用：删除本地业务数据，**保留** `mcfit_settings_v1`（MCP / AI / 体重等设置）。
 */
export function clearAllAppDataExceptSettings(): void {
  if (typeof localStorage === "undefined") {
    return;
  }
  for (const k of KEYS_TO_REMOVE) {
    localStorage.removeItem(k);
  }
  window.dispatchEvent(new CustomEvent(TODAY_MENU_CHANGED));
  window.dispatchEvent(new CustomEvent(MEAL_INTAKE_CHANGED));
}
