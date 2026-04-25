import { CalendarCheck2, ChevronRight, Flame, MapPin, Pencil, UtensilsCrossed, Weight } from "lucide-react";
import { motion } from "motion/react";
import { useCallback, useEffect, useId, useMemo, useState } from "react";
import {
  checkInForToday,
  loadCheckInStreakInfo,
  type CheckInStreakInfo,
} from "../lib/checkInStreak";
import { runMcpMenuFetch } from "../lib/checkinMenuRunner";
import {
  buildMealPlanForNow,
  computeIntakeBudget,
  formatGeoLabel,
  PLANNED_DAILY_DEFICIT_KCAL,
  remainingIntakeAllowanceKcal,
} from "../lib/dailyNutrition";
import { loadWorkoutLogs } from "../lib/exerciseDayLog";
import { MEAL_INTAKE_CHANGED, todayConsumedMealKcal } from "../lib/mealIntakeLog";
import { getMcFitGeolocationPosition } from "../lib/mcfitGeolocation";
import { loadMcFitSettings, saveMcFitSettings, weightKgForCalorieEstimate } from "../lib/mcfitSettings";

function todayTitleZh(): string {
  return new Date().toLocaleDateString("zh-CN", {
    timeZone: "Asia/Shanghai",
    month: "long",
    day: "numeric",
    weekday: "long",
  });
}

function ymdToday(): string {
  return new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Shanghai" });
}

const listContainer = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.06, delayChildren: 0.04 },
  },
} as const;

const listItem = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 380, damping: 28 } },
} as const;

export function HomePage() {
  const [now, setNow] = useState(() => new Date());
  const [dataRev, setDataRev] = useState(0);
  const [streakInfo, setStreakInfo] = useState<CheckInStreakInfo>(() => loadCheckInStreakInfo());
  const [geo, setGeo] = useState<
    | { status: "idle" | "pending" | "ok" | "denied" | "unavailable"; lat?: number; lng?: number }
  >({ status: "idle" });

  const refreshStreak = useCallback(() => {
    setStreakInfo(loadCheckInStreakInfo());
  }, []);

  useEffect(() => {
    const t = window.setInterval(() => setNow(new Date()), 60_000);
    return () => window.clearInterval(t);
  }, []);

  useEffect(() => {
    const onVis = () => {
      if (document.visibilityState === "visible") {
        setDataRev((n) => n + 1);
      }
    };
    const onMeal = () => setDataRev((n) => n + 1);
    document.addEventListener("visibilitychange", onVis);
    window.addEventListener(MEAL_INTAKE_CHANGED, onMeal);
    return () => {
      document.removeEventListener("visibilitychange", onVis);
      window.removeEventListener(MEAL_INTAKE_CHANGED, onMeal);
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    setGeo({ status: "pending" });
    getMcFitGeolocationPosition()
      .then((pos) => {
        if (cancelled) return;
        setGeo({
          status: "ok",
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        });
      })
      .catch(() => {
        if (cancelled) return;
        setGeo({ status: typeof navigator !== "undefined" && navigator.geolocation ? "denied" : "unavailable" });
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const today = ymdToday();
  const { weightKg, displayWeight, todayExerciseKcal } = useMemo(() => {
    const s = loadMcFitSettings();
    const w = weightKgForCalorieEstimate(s);
    const disp =
      s.currentWeightKg != null && s.currentWeightKg > 0
        ? s.currentWeightKg
        : s.initialWeightKg != null && s.initialWeightKg > 0
          ? s.initialWeightKg
          : null;
    const lg = loadWorkoutLogs();
    const ex = lg.filter((e) => e.ymd === today).reduce((a, b) => a + b.kcal, 0);
    return { weightKg: w, displayWeight: disp, todayExerciseKcal: ex };
  }, [today, dataRev]);

  const budget = useMemo(
    () =>
      computeIntakeBudget({
        weightKg,
        exerciseBurnedTodayKcal: todayExerciseKcal,
      }),
    [weightKg, todayExerciseKcal],
  );

  const consumedMealKcal = useMemo(() => todayConsumedMealKcal(today), [today, dataRev]);
  const remainingIntakeKcal = useMemo(
    () =>
      remainingIntakeAllowanceKcal({
        fullDayIntakeBudgetKcal: budget.intakeBudgetKcal,
        consumedKcalSoFar: consumedMealKcal,
      }),
    [budget.intakeBudgetKcal, consumedMealKcal],
  );
  const mealPlan = useMemo(() => buildMealPlanForNow(now, remainingIntakeKcal), [now, remainingIntakeKcal]);

  const geoLine = useMemo(() => {
    if (geo.status === "pending" || geo.status === "idle") {
      return "定位中…";
    }
    if (geo.status === "ok" && geo.lat != null && geo.lng != null) {
      return formatGeoLabel(geo.lat, geo.lng);
    }
    if (geo.status === "denied") {
      return "未授权定位 · 餐单仍按时间与总预算拆分";
    }
    return "定位不可用 · 餐单仍按时间与总预算拆分";
  }, [geo]);

  const [checkInBusy, setCheckInBusy] = useState(false);
  const [weightDialogOpen, setWeightDialogOpen] = useState(false);
  const [currentWeightDraft, setCurrentWeightDraft] = useState("");
  const weightDialogTitleId = useId();
  const weightFieldId = useId();

  const openWeightDialog = useCallback(() => {
    const s = loadMcFitSettings();
    if (s.currentWeightKg != null && s.currentWeightKg > 0) {
      setCurrentWeightDraft(String(s.currentWeightKg));
    } else {
      const disp =
        s.initialWeightKg != null && s.initialWeightKg > 0 ? s.initialWeightKg : null;
      setCurrentWeightDraft(disp != null ? String(disp) : String(weightKgForCalorieEstimate(s)));
    }
    setWeightDialogOpen(true);
  }, []);

  const closeWeightDialog = useCallback(() => {
    setWeightDialogOpen(false);
  }, []);

  const saveCurrentWeight = useCallback(() => {
    const t = currentWeightDraft.trim().replace(",", ".");
    let currentWeightKg: number | null = null;
    if (t) {
      const n = Number.parseFloat(t);
      if (Number.isFinite(n) && n >= 0) {
        currentWeightKg = Math.round(n * 10) / 10;
      }
    }
    const s = loadMcFitSettings();
    saveMcFitSettings({ ...s, currentWeightKg });
    setDataRev((n) => n + 1);
    setWeightDialogOpen(false);
  }, [currentWeightDraft]);

  useEffect(() => {
    if (!weightDialogOpen) {
      return;
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setWeightDialogOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [weightDialogOpen]);

  const onCheckIn = useCallback(async () => {
    if (checkInBusy || streakInfo.checkedToday) {
      return;
    }
    setCheckInBusy(true);
    checkInForToday();
    refreshStreak();
    await runMcpMenuFetch();
    setCheckInBusy(false);
  }, [checkInBusy, streakInfo.checkedToday, refreshStreak]);

  const checkInDisabled = streakInfo.checkedToday || checkInBusy;
  const checkInBtnClass = checkInDisabled
    ? streakInfo.checkedToday
      ? "inline-flex h-12 w-full cursor-default items-center justify-center gap-2 rounded-xl border border-mcd-hairline bg-mcd-canvas px-4 text-sm font-extrabold text-mcd-ink-muted"
      : "inline-flex h-12 w-full cursor-wait items-center justify-center gap-2 rounded-xl bg-linear-to-b from-mcd-gold to-[#f5a800] px-4 text-sm font-extrabold text-mcd-ink/80 shadow-sm opacity-90"
    : "inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-linear-to-b from-mcd-gold to-[#f5a800] px-4 text-sm font-extrabold text-mcd-ink shadow-sm shadow-amber-900/10 transition active:scale-[0.98]";

  return (
    <div className="space-y-4 sm:space-y-5 lg:space-y-6">
      <motion.section
        className="mcd-stripe-hero relative overflow-hidden rounded-none px-4 py-8 sm:rounded-2xl sm:py-10 lg:rounded-3xl lg:px-10 lg:py-11"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div
          className="pointer-events-none absolute inset-0 opacity-30"
          style={{
            backgroundImage:
              "radial-gradient(circle at 12% 22%, #da291c 1.5px, transparent 1.5px), radial-gradient(circle at 78% 60%, #da291c 1px, transparent 1px)",
            backgroundSize: "28px 28px, 36px 36px",
          }}
        />
        <p className="relative text-center text-lg font-black uppercase tracking-[0.18em] text-mcd-ink sm:text-xl lg:text-2xl">
          McFit 每日概览
        </p>
        <p className="relative mt-2 text-center text-sm font-medium text-mcd-ink/75">
          体重与热量目标一目了然 · 签到与餐食跟着时间与位置走
        </p>
      </motion.section>

      <motion.div
        className="flex flex-col gap-4 rounded-2xl border border-mcd-hairline bg-mcd-white px-4 py-3 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:gap-3"
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
      >
        <div className="min-w-0">
          <p className="text-sm font-extrabold text-mcd-ink">
            <span className="text-mcd-ink-muted">今日</span> · {todayTitleZh()}
          </p>
          <div className="mt-2 w-full min-w-0 sm:max-w-sm">
            <button
              type="button"
              onClick={openWeightDialog}
              aria-label={displayWeight == null ? "填写现在体重" : "修改现在体重"}
              className="group flex w-full min-w-0 items-center justify-between gap-2 rounded-2xl border-2 border-mcd-gold/60 bg-linear-to-b from-mcd-gold/25 to-mcd-gold/10 px-3 py-2.5 text-left shadow-sm ring-mcd-gold/30 transition active:scale-[0.99] hover:border-mcd-gold hover:from-mcd-gold/35 hover:to-mcd-gold/15 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-mcd-red/25"
            >
              <span className="flex min-w-0 flex-1 items-center gap-2.5">
                <span
                  className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-mcd-white/80 text-mcd-red shadow-sm ring-1 ring-mcd-gold/40"
                  aria-hidden
                >
                  <Weight className="size-4" strokeWidth={2.2} />
                </span>
                <span className="min-w-0">
                  <span className="block text-[0.65rem] font-extrabold uppercase tracking-wide text-mcd-ink/55">
                    现在体重
                  </span>
                  <span className="mt-0.5 block text-base font-black tabular-nums leading-none text-mcd-ink sm:text-lg">
                    {displayWeight != null ? `${displayWeight} kg` : `按估算 ${weightKg} kg`}
                  </span>
                </span>
              </span>
              <span className="flex shrink-0 items-center gap-0.5 text-xs font-extrabold text-mcd-red/90 sm:text-sm">
                <Pencil className="size-3.5 sm:size-4" strokeWidth={2.2} aria-hidden />
                <span className="hidden min-[360px]:inline">
                  {displayWeight == null ? "去填写" : "修改"}
                </span>
                <ChevronRight
                  className="size-4 opacity-70 transition group-hover:translate-x-0.5 sm:size-5"
                  strokeWidth={2.2}
                  aria-hidden
                />
              </span>
            </button>
            <p className="mt-1.5 pl-0.5 text-[0.6rem] font-semibold text-mcd-ink-muted/90">
              点按此处即可更新，与「设置」中的现在体重一致
            </p>
          </div>
          <p className="mt-0.5 text-[0.65rem] font-medium leading-snug text-mcd-ink-muted">
            估算一日消耗约{" "}
            <span className="font-extrabold tabular-nums text-mcd-ink/70">{budget.tdeeKcal}</span>{" "}
            kcal
            {todayExerciseKcal > 0 ? (
              <>
                {" "}
                · 今日运动 +{Math.round(todayExerciseKcal * 10) / 10} kcal 已计入摄入额度
              </>
            ) : null}
            {consumedMealKcal > 0 ? (
              <>
                {" "}
                · 饮食已记 {Math.round(consumedMealKcal * 10) / 10} kcal
              </>
            ) : null}
          </p>
        </div>
        <div className="w-full shrink-0 border-t border-mcd-hairline/80 pt-3 text-left sm:w-auto sm:border-0 sm:pt-0 sm:text-right">
          <p className="text-[0.65rem] font-extrabold tracking-wide text-mcd-ink-muted">今日还可摄入</p>
          <p className="text-2xl font-black leading-none tabular-nums text-mcd-red sm:text-3xl">
            {remainingIntakeKcal}
            <span className="ml-0.5 text-sm font-extrabold text-mcd-ink/45">kcal</span>
          </p>
          <p className="mt-0.5 max-w-none text-[0.65rem] font-medium leading-tight text-mcd-ink-muted sm:ml-auto sm:text-right">
            在全日结束时仍保持 ≥{PLANNED_DAILY_DEFICIT_KCAL} kcal 缺口前提下 · 全日上限约{" "}
            <span className="font-extrabold tabular-nums text-mcd-ink/75">{budget.intakeBudgetKcal}</span> kcal
            {consumedMealKcal > 0 ? (
              <>
                {" "}
                · 已记{" "}
                <span className="font-extrabold tabular-nums text-mcd-ink/75">
                  {Math.round(consumedMealKcal * 10) / 10}
                </span>{" "}
                kcal
              </>
            ) : null}
          </p>
        </div>
      </motion.div>

      <motion.div
        className="overflow-hidden rounded-2xl border border-mcd-hairline bg-mcd-white p-4 shadow-sm sm:p-5"
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05, duration: 0.35 }}
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-mcd-gold/35 text-mcd-red">
              <CalendarCheck2 className="size-5" strokeWidth={2.2} aria-hidden />
            </span>
            <div>
              <p className="text-sm font-extrabold text-mcd-ink">每日签到</p>
              <p className="mt-0.5 text-xs font-medium text-mcd-ink-muted">
                {streakInfo.checkedToday
                  ? "今日已签到；「饮食记录」页可确认推荐并记入热量"
                  : "签到将请求定位 → 高德逆地理地址 → MCP query-nearby-stores 选店并出餐单（设置里填高德 Key、MCP Token、AI Key 与模型）"}
              </p>
            </div>
          </div>
          <button type="button" onClick={() => void onCheckIn()} disabled={checkInDisabled} className={checkInBtnClass}>
            <CalendarCheck2 className="size-4" strokeWidth={2.2} aria-hidden />
            {streakInfo.checkedToday ? "今日已签到" : checkInBusy ? "签到中…" : "签到"}
          </button>
        </div>
        <p className="mt-3 border-t border-mcd-hairline pt-3 text-center text-sm font-extrabold tabular-nums text-mcd-ink">
          已连续签到{" "}
          <span className="text-mcd-red">{streakInfo.streakDays}</span>{" "}
          天
        </p>
      </motion.div>

      <motion.section
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.08, duration: 0.35 }}
      >
        <div className="mb-2 flex items-center justify-between gap-2 px-0.5">
          <h2 className="flex items-center gap-2 text-sm font-extrabold text-mcd-ink-muted">
            <UtensilsCrossed className="size-4 text-mcd-red" strokeWidth={2.2} aria-hidden />
            今日餐食规划
          </h2>
        </div>
        <div className="mb-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-[0.7rem] font-medium text-mcd-ink-muted">
          <span className="inline-flex items-center gap-1">
            <Flame className="size-3.5 text-orange-500" strokeWidth={2.2} aria-hidden />
            上海时间 {mealPlan.shanghaiTimeLabel}
          </span>
          <span className="inline-flex items-center gap-1">
            <MapPin className="size-3.5 text-mcd-red/80" strokeWidth={2.2} aria-hidden />
            {geoLine}
          </span>
        </div>
        <p className="mb-3 text-xs font-medium leading-relaxed text-mcd-ink-muted">
          按<strong className="font-extrabold text-mcd-ink/80">当前还可摄入约 {remainingIntakeKcal} kcal</strong>{" "}
          拆分尚未结束的餐段（全日上限 {budget.intakeBudgetKcal} kcal，结束时缺口 ≥ {PLANNED_DAILY_DEFICIT_KCAL}{" "}
          kcal；代谢按体重×28 粗估约 {budget.tdeeKcal} kcal）。
        </p>
        <motion.ul
          className="space-y-2.5"
          variants={listContainer}
          initial="hidden"
          animate="show"
        >
          {mealPlan.rows.map((row) => (
            <motion.li
              key={row.id}
              variants={listItem}
              className="relative flex gap-3 overflow-hidden rounded-2xl border border-mcd-hairline bg-mcd-white p-3.5 pl-3.5 shadow-sm"
            >
              <div
                className="absolute left-0 top-0 h-full w-1 rounded-l-2xl bg-linear-to-b from-mcd-gold to-mcd-red/90"
                aria-hidden
              />
              <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-mcd-gold/20 text-mcd-red">
                <UtensilsCrossed className="size-5" strokeWidth={2.2} aria-hidden />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <p className="text-[0.95rem] font-extrabold text-mcd-ink">{row.label}</p>
                  <p className="text-sm font-black tabular-nums text-mcd-red">
                    ≈{row.targetKcal}
                    <span className="ml-0.5 text-xs font-extrabold text-mcd-ink/50">kcal</span>
                  </p>
                </div>
                <p className="mt-1 text-xs font-medium leading-relaxed text-mcd-ink-muted">{row.hint}</p>
              </div>
            </motion.li>
          ))}
        </motion.ul>
      </motion.section>

      {weightDialogOpen ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-4">
          <button
            type="button"
            onClick={closeWeightDialog}
            className="absolute inset-0 cursor-default border-0 bg-mcd-ink/40 p-0"
            aria-label="关闭"
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby={weightDialogTitleId}
            className="relative w-full max-w-sm rounded-t-2xl border border-mcd-hairline bg-mcd-white p-4 pb-[max(1rem,env(safe-area-inset-bottom,0))] shadow-2xl sm:rounded-2xl sm:p-5 sm:pb-5"
          >
            <h2 id={weightDialogTitleId} className="text-base font-extrabold text-mcd-ink">
              现在体重
            </h2>
            <p className="mt-1 text-xs font-medium text-mcd-ink-muted">
              与设置页中的「现在体重」同步；留空并保存会清除，回退为初始体重或默认估算。
            </p>
            <div className="relative mt-3 flex items-center gap-2">
              <input
                id={weightFieldId}
                name="currentWeightKg"
                type="text"
                inputMode="decimal"
                value={currentWeightDraft}
                onChange={(e) => setCurrentWeightDraft(e.target.value)}
                placeholder="例如 68.0"
                className="min-w-0 flex-1 rounded-xl border border-mcd-hairline bg-mcd-canvas px-3 py-2.5 text-sm font-medium text-mcd-ink tabular-nums placeholder:text-mcd-ink-muted/50 focus:border-mcd-red/40 focus:outline-none focus:ring-2 focus:ring-mcd-red/15"
                autoFocus
                aria-describedby={`${weightFieldId}-unit`}
              />
              <span
                id={`${weightFieldId}-unit`}
                className="shrink-0 rounded-xl border border-mcd-hairline bg-mcd-canvas px-3 py-2.5 text-sm font-extrabold text-mcd-ink-muted"
              >
                kg
              </span>
            </div>
            <div className="mt-4 flex flex-wrap items-center justify-end gap-2">
              <button
                type="button"
                onClick={closeWeightDialog}
                className="rounded-full border border-mcd-hairline bg-mcd-white px-4 py-2 text-sm font-extrabold text-mcd-ink transition active:scale-[0.98]"
              >
                取消
              </button>
              <button
                type="button"
                onClick={saveCurrentWeight}
                className="rounded-full bg-mcd-red px-4 py-2 text-sm font-extrabold text-mcd-white shadow-sm transition active:scale-[0.98]"
              >
                保存
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
