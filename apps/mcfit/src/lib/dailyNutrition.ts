import { DEFAULT_WEIGHT_KG_FOR_BURN } from "./exerciseEnergy";

/** 与餐食规划绑定的目标日缺口（千卡）：不运动也按此预留 */
export const PLANNED_DAILY_DEFICIT_KCAL = 500;

/**
 * 仅用体重粗估一日总消耗（久坐～轻度活动），用于前端预算；非医疗结论。
 * 系数约 28 kcal/kg 为常见经验区间的中值。
 */
export function estimateTdeeFromWeightKg(weightKg: number): number {
  if (!Number.isFinite(weightKg) || weightKg <= 0) {
    return Math.round(DEFAULT_WEIGHT_KG_FOR_BURN * 28);
  }
  return Math.round(weightKg * 28);
}

export type IntakeBudgetResult = {
  weightKgUsed: number;
  tdeeKcal: number;
  plannedDeficitKcal: number;
  /** 建议全日摄入 ≈ TDEE − 计划缺口 + 今日运动消耗 */
  intakeBudgetKcal: number;
};

export function computeIntakeBudget(params: {
  weightKg: number;
  exerciseBurnedTodayKcal: number;
}): IntakeBudgetResult {
  const w =
    Number.isFinite(params.weightKg) && params.weightKg > 0
      ? params.weightKg
      : DEFAULT_WEIGHT_KG_FOR_BURN;
  const tdeeKcal = estimateTdeeFromWeightKg(w);
  const ex = Math.max(0, params.exerciseBurnedTodayKcal);
  const intakeBudgetKcal = Math.max(
    1200,
    Math.round(tdeeKcal - PLANNED_DAILY_DEFICIT_KCAL + ex),
  );
  return {
    weightKgUsed: w,
    tdeeKcal,
    plannedDeficitKcal: PLANNED_DAILY_DEFICIT_KCAL,
    intakeBudgetKcal,
  };
}

type MealSlotDef = {
  id: string;
  label: string;
  /** 当天从 00:00 起：窗口 [startMin, endMin) */
  startMin: number;
  endMin: number;
  weight: number;
  hint: string;
};

const MEAL_SLOTS: MealSlotDef[] = [
  {
    id: "breakfast",
    label: "早餐",
    startMin: 6 * 60,
    endMin: 9 * 60 + 30,
    weight: 22,
    hint: "碳水 + 优质蛋白；少糖饮料。",
  },
  {
    id: "lunch",
    label: "午餐",
    startMin: 11 * 60,
    endMin: 14 * 60,
    weight: 33,
    hint: "蔬菜占半盘，主菜选烤制/清炒优于油炸。",
  },
  {
    id: "snack",
    label: "加餐",
    startMin: 15 * 60,
    endMin: 17 * 60,
    weight: 11,
    hint: "水果、无糖酸奶或一小把坚果。",
  },
  {
    id: "dinner",
    label: "晚餐",
    startMin: 17 * 60 + 30,
    endMin: 21 * 60,
    weight: 29,
    hint: "清淡一点，蛋白足、少油腻，给睡前留消化空间。",
  },
  {
    id: "supper",
    label: "夜宵（可选）",
    startMin: 21 * 60,
    endMin: 24 * 60,
    weight: 5,
    hint: "尽量少量；若不吃夜宵可把热量挪到晚餐。",
  },
];

function beijingMinutesFromMidnight(d: Date): number {
  const s = d.toLocaleTimeString("en-GB", {
    timeZone: "Asia/Shanghai",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  const [h, m] = s.split(":").map((x) => Number.parseInt(x, 10));
  if (!Number.isFinite(h) || !Number.isFinite(m)) {
    return 0;
  }
  return h * 60 + m;
}

function mealSlotIsOpenForPlanning(curMin: number, s: MealSlotDef): boolean {
  if (curMin >= s.endMin) {
    return false;
  }
  const beforeDawn = curMin < 6 * 60;
  if (beforeDawn && s.startMin >= 21 * 60) {
    return false;
  }
  if (curMin < s.startMin) {
    return true;
  }
  return curMin < s.endMin;
}

export type PlannedMealRow = {
  id: string;
  label: string;
  targetKcal: number;
  hint: string;
};

export type MealPlanResult = {
  shanghaiTimeLabel: string;
  rows: PlannedMealRow[];
  /** 仍开放的餐段总权重（用于说明） */
  includedSlotCount: number;
};

/**
 * 按上海当前时间，仅对「尚未结束」的餐段按权重分配 `intakeBudgetKcal`。
 */
export function buildMealPlanForNow(now: Date, intakeBudgetKcal: number): MealPlanResult {
  const cur = beijingMinutesFromMidnight(now);
  const active = MEAL_SLOTS.filter((s) => mealSlotIsOpenForPlanning(cur, s));
  const sumW = active.reduce((a, s) => a + s.weight, 0);
  const budget = Math.max(0, intakeBudgetKcal);

  const shanghaiTimeLabel = now.toLocaleTimeString("zh-CN", {
    timeZone: "Asia/Shanghai",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });

  if (active.length === 0 || sumW <= 0) {
    return {
      shanghaiTimeLabel,
      rows: [
        {
          id: "late",
          label: "今日正餐窗口已过",
          targetKcal: budget,
          hint: "若仍进食，选少量易消化，并计入总摄入；明日按规划分配更稳。",
        },
      ],
      includedSlotCount: 0,
    };
  }

  const targets: number[] = new Array(active.length).fill(0);
  let assigned = 0;
  for (let i = 0; i < active.length - 1; i++) {
    const share = active[i]!.weight / sumW;
    const k = Math.round(budget * share);
    targets[i] = k;
    assigned += k;
  }
  targets[active.length - 1] = Math.max(0, budget - assigned);

  const rows: PlannedMealRow[] = active.map((s, i) => ({
    id: s.id,
    label: s.label,
    targetKcal: targets[i]!,
    hint: s.hint,
  }));

  return { shanghaiTimeLabel, rows, includedSlotCount: active.length };
}

/**
 * 全日建议摄入上限（TDEE + 运动 − 最低缺口）减去已记录摄入，得到当前仍可吃的千卡。
 * 用于餐段拆分与 MCP 规划，使缺口随饮食实时收缩。
 */
export function remainingIntakeAllowanceKcal(params: {
  fullDayIntakeBudgetKcal: number;
  consumedKcalSoFar: number;
}): number {
  const cap = Math.max(0, params.fullDayIntakeBudgetKcal);
  const eaten = Math.max(0, params.consumedKcalSoFar);
  return Math.max(0, Math.round(cap - eaten));
}

/** 展示用：WGS84 坐标 */
export function formatGeoLabel(lat: number, lng: number): string {
  return `纬度 ${lat.toFixed(4)} · 经度 ${lng.toFixed(4)}`;
}
