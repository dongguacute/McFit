import { sanitizeImageUrlList } from "./imageUrls";

const STORAGE_KEY = "mcfit_meal_intake_v1";

export const MEAL_INTAKE_CHANGED = "mcfit-meal-intake-changed";

export type MealIntakeEntry = {
  id: string;
  ymd: string;
  name: string;
  kcal: number;
  slotId: string;
  slotLabel: string;
  consumedAt: number;
  source: "mcp_checkin";
  /** 来自 MCP 的餐品图，可多张 */
  imageUrls?: string[];
};

function loadAll(): MealIntakeEntry[] {
  if (typeof localStorage === "undefined") {
    return [];
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return [];
    }
    const p = JSON.parse(raw) as unknown;
    if (!Array.isArray(p)) {
      return [];
    }
    return p
      .filter(
        (row) =>
          typeof row === "object" &&
          row != null &&
          typeof (row as MealIntakeEntry).id === "string" &&
          typeof (row as MealIntakeEntry).ymd === "string" &&
          typeof (row as MealIntakeEntry).name === "string" &&
          typeof (row as MealIntakeEntry).kcal === "number" &&
          typeof (row as MealIntakeEntry).slotId === "string" &&
          typeof (row as MealIntakeEntry).slotLabel === "string" &&
          typeof (row as MealIntakeEntry).consumedAt === "number" &&
          (row as MealIntakeEntry).source === "mcp_checkin",
      )
      .map((row) => {
        const e = row as MealIntakeEntry;
        const imgs = sanitizeImageUrlList(e.imageUrls);
        return {
          ...e,
          ...(imgs.length > 0 ? { imageUrls: imgs } : { imageUrls: undefined }),
        };
      });
  } catch {
    return [];
  }
}

function saveAll(list: MealIntakeEntry[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}

export function loadMealIntakeForYmd(ymd: string): MealIntakeEntry[] {
  return loadAll()
    .filter((e) => e.ymd === ymd)
    .sort((a, b) => b.consumedAt - a.consumedAt);
}

export function todayConsumedMealKcal(ymd: string): number {
  return loadMealIntakeForYmd(ymd).reduce((a, b) => a + b.kcal, 0);
}

export function appendMealIntake(entry: Omit<MealIntakeEntry, "id" | "consumedAt">): MealIntakeEntry {
  const full: MealIntakeEntry = {
    ...entry,
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    consumedAt: Date.now(),
  };
  saveAll([full, ...loadAll()]);
  window.dispatchEvent(new CustomEvent(MEAL_INTAKE_CHANGED));
  return full;
}
