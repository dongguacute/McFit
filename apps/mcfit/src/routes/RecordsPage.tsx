import { ChevronDown, Flame, Plus, Trash2 } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useId, useMemo, useState } from "react";
import { EXERCISE_CATEGORIES, exercisesInCategory } from "../lib/exerciseEnergy";
import {
  appendWorkoutForToday,
  deleteWorkoutLog,
  loadWorkoutLogs,
  type WorkoutLogEntry,
} from "../lib/exerciseDayLog";
import { loadMcFitSettings, weightKgForCalorieEstimate } from "../lib/mcfitSettings";

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

function formatYmdLabel(ymd: string): string {
  const p = ymd.split("-");
  if (p.length !== 3) {
    return ymd;
  }
  return `${Number(p[1])} 月 ${Number(p[2])} 日`;
}

function todayYmd(): string {
  return new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Shanghai" });
}

function todayTitleZh(): string {
  return new Date().toLocaleDateString("zh-CN", {
    timeZone: "Asia/Shanghai",
    month: "long",
    day: "numeric",
    weekday: "long",
  });
}

export function RecordsPage() {
  const today = todayYmd();
  const weightNoteId = useId();
  const catId = useId();
  const exId = useId();
  const minId = useId();
  const [category, setCategory] = useState(() => EXERCISE_CATEGORIES[0] ?? "");
  const inCat = useMemo(
    () => (category ? exercisesInCategory(category) : []),
    [category],
  );
  const [exerciseId, setExerciseId] = useState(
    () => exercisesInCategory(EXERCISE_CATEGORIES[0] ?? "")[0]?.id ?? "",
  );
  const [minutesStr, setMinutesStr] = useState("30");
  const [logs, setLogs] = useState<WorkoutLogEntry[]>([]);
  const [weightHint, setWeightHint] = useState("");
  const [addOpen, setAddOpen] = useState(false);

  const selectedExercise = useMemo(
    () => inCat.find((e) => e.id === exerciseId),
    [inCat, exerciseId],
  );
  const previewKcal = useMemo(() => {
    const m = Number.parseInt(minutesStr, 10);
    if (!selectedExercise || !Number.isFinite(m) || m < 1) {
      return null;
    }
    const w = weightKgForCalorieEstimate(loadMcFitSettings());
    const raw = selectedExercise.met * w * (m / 60);
    return Math.round(raw * 10) / 10;
  }, [selectedExercise, minutesStr]);

  const refresh = useCallback(() => {
    setLogs(loadWorkoutLogs());
    const s = loadMcFitSettings();
    const w = weightKgForCalorieEstimate(s);
    if (s.currentWeightKg != null && s.currentWeightKg > 0) {
      setWeightHint(`现在 ${s.currentWeightKg} kg`);
    } else if (s.initialWeightKg != null && s.initialWeightKg > 0) {
      setWeightHint(`初始 ${s.initialWeightKg} kg`);
    } else {
      setWeightHint(`未设体重 · ${w} kg`);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    if (!inCat.length) {
      setExerciseId("");
      return;
    }
    if (!inCat.some((e) => e.id === exerciseId)) {
      setExerciseId(inCat[0]!.id);
    }
  }, [inCat, exerciseId]);

  const todayLogs = useMemo(
    () => logs.filter((e) => e.ymd === today),
    [logs, today],
  );
  const todayKcal = useMemo(
    () => todayLogs.reduce((a, b) => a + b.kcal, 0),
    [todayLogs],
  );
  const todayMinutes = useMemo(
    () => todayLogs.reduce((a, b) => a + b.minutes, 0),
    [todayLogs],
  );
  const earlierLogs = useMemo(
    () => logs.filter((e) => e.ymd !== today),
    [logs, today],
  );

  const onAdd = useCallback(() => {
    const m = Number.parseInt(minutesStr, 10);
    if (!Number.isFinite(m) || m < 1 || m > 24 * 60) {
      return;
    }
    const ex = inCat.find((e) => e.id === exerciseId);
    if (!ex) {
      return;
    }
    appendWorkoutForToday(ex, m);
    setMinutesStr("30");
    refresh();
  }, [exerciseId, inCat, minutesStr, refresh]);

  const onDelete = useCallback(
    (id: string) => {
      deleteWorkoutLog(id);
      refresh();
    },
    [refresh],
  );

  const labelClass =
    "text-[0.7rem] font-extrabold tracking-wide text-mcd-ink-muted";
  const controlClass =
    "box-border h-12 w-full rounded-xl border border-mcd-hairline bg-mcd-white px-3 text-sm text-mcd-ink shadow-sm transition focus:border-mcd-red/50 focus:outline-none focus:ring-2 focus:ring-mcd-red/15";
  const addBtnClass =
    "inline-flex h-12 w-full items-center justify-center gap-1.5 rounded-xl bg-linear-to-b from-mcd-gold to-[#f5a800] px-3 text-sm font-extrabold text-mcd-ink shadow-sm shadow-amber-900/10 transition active:scale-[0.98] sm:min-w-[5.5rem]";

  return (
    <motion.div
      className="space-y-6"
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
    >
      <div className="flex items-center justify-between gap-3 rounded-2xl border border-mcd-hairline bg-mcd-white px-4 py-3 shadow-sm">
        <p className="text-sm font-extrabold text-mcd-ink">
          <span className="text-mcd-ink-muted">今日</span> · {todayTitleZh()}
        </p>
        <div className="text-right">
          <p className="text-2xl font-black leading-none tabular-nums text-mcd-red sm:text-3xl">
            {Math.round(todayKcal * 10) / 10}
            <span className="ml-0.5 text-sm font-extrabold text-mcd-ink/45">kcal</span>
          </p>
          {todayLogs.length > 0 ? (
            <p className="mt-0.5 text-[0.65rem] font-medium text-mcd-ink-muted">
              {todayLogs.length} 项 · {todayMinutes} 分
            </p>
          ) : null}
        </div>
      </div>

      <div className="space-y-2">
        <button
          type="button"
          onClick={() => setAddOpen((o) => !o)}
          aria-expanded={addOpen}
          className="flex w-full items-center justify-between gap-3 rounded-2xl border border-mcd-hairline bg-mcd-white px-4 py-3.5 text-left shadow-sm transition-colors hover:bg-mcd-list-row"
        >
          <span className="flex min-w-0 items-center gap-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-mcd-gold/35 text-mcd-red">
              <Plus className="size-5" strokeWidth={2.2} aria-hidden />
            </span>
            <span className="min-w-0">
              <span className="block text-sm font-extrabold text-mcd-ink">
                {addOpen ? "收起表单" : "记一笔运动"}
              </span>
              <span className="mt-0.5 block text-[0.7rem] font-medium text-mcd-ink-muted">
                {addOpen ? "选类型、时长后点「添加」" : "展开后填写"}
              </span>
            </span>
          </span>
          <ChevronDown
            className={`size-5 shrink-0 text-mcd-ink/35 transition-transform duration-200 ${addOpen ? "rotate-180" : ""}`}
            strokeWidth={2.2}
            aria-hidden
          />
        </button>

        <AnimatePresence initial={false}>
          {addOpen ? (
            <motion.div
              key="add-panel"
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
              className="space-y-3"
            >
              <div className="flex flex-wrap items-center justify-end gap-2 sm:justify-between">
                <p id={weightNoteId} className="w-full text-[0.7rem] font-medium text-mcd-ink-muted sm:order-first sm:w-auto">
                  估算体重：{weightHint}
                </p>
                {previewKcal != null ? (
                  <div className="inline-flex items-center gap-1 rounded-full border border-mcd-hairline bg-mcd-canvas/80 px-2.5 py-1">
                    <Flame className="size-3.5 text-orange-500" strokeWidth={2.2} aria-hidden />
                    <span className="text-xs font-extrabold tabular-nums text-mcd-ink">
                      ≈{previewKcal} kcal
                    </span>
                  </div>
                ) : null}
              </div>

              <div className="overflow-hidden rounded-2xl border border-mcd-hairline bg-mcd-white shadow-sm">
                <div className="p-4 sm:p-5">
                  {/*
                    底部对齐：四列用 flex + items-end，让「仅按钮」的一列与前三列的输入下沿对齐
                  */}
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:gap-3">
                    <div className="min-w-0 flex-1 sm:max-w-[32%] lg:max-w-[28%]">
                      <label htmlFor={catId} className={labelClass}>
                        运动类型
                      </label>
                      <select
                        id={catId}
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        className={`${controlClass} mt-1.5 max-w-full`}
                        aria-describedby={weightNoteId}
                      >
                        {EXERCISE_CATEGORIES.map((c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="min-w-0 flex-1 sm:min-w-0 sm:flex-[1.4]">
                      <label htmlFor={exId} className={labelClass}>
                        具体项目
                      </label>
                      <select
                        id={exId}
                        value={exerciseId}
                        onChange={(e) => setExerciseId(e.target.value)}
                        className={`${controlClass} mt-1.5 w-full font-medium`}
                      >
                        {inCat.map((e) => (
                          <option key={e.id} value={e.id}>
                            {e.name}（MET {e.met}）
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="w-full shrink-0 sm:w-28">
                      <label htmlFor={minId} className={labelClass}>
                        时长
                      </label>
                      <div className="relative mt-1.5">
                        <input
                          id={minId}
                          type="number"
                          min={1}
                          max={999}
                          inputMode="numeric"
                          value={minutesStr}
                          onChange={(e) => setMinutesStr(e.target.value)}
                          className={`${controlClass} pr-9 font-extrabold tabular-nums`}
                        />
                        <span className="pointer-events-none absolute top-1/2 right-2.5 -translate-y-1/2 text-xs font-extrabold text-mcd-ink/45">
                          分
                        </span>
                      </div>
                    </div>
                    <div className="w-full shrink-0 pt-0 sm:w-auto sm:min-w-23">
                      <button
                        type="button"
                        onClick={onAdd}
                        className={addBtnClass}
                      >
                        <Plus className="size-4" strokeWidth={2.2} />
                        添加
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>

      {todayLogs.length > 0 ? (
        <div>
          <h3 className="mb-2 text-xs font-extrabold text-mcd-ink-muted">今日</h3>
          <motion.ul
            className="space-y-2.5"
            variants={listContainer}
            initial="hidden"
            animate="show"
          >
            {todayLogs.map((row) => (
              <motion.li
                key={row.id}
                variants={listItem}
                className="group relative flex items-center gap-3 overflow-hidden rounded-2xl border border-mcd-hairline bg-mcd-white p-3 pl-3.5 shadow-sm transition-shadow hover:shadow-md"
              >
                <div
                  className="absolute left-0 top-0 h-full w-1 rounded-l-2xl bg-linear-to-b from-mcd-red to-mcd-gold"
                  aria-hidden
                />
                <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-mcd-gold/20 text-mcd-red group-hover:bg-mcd-gold/30">
                  <Flame className="size-5" strokeWidth={2.2} />
                </div>
                <div className="min-w-0 flex-1 pr-1">
                  <p className="line-clamp-2 text-[0.95rem] font-extrabold text-mcd-ink">
                    {row.name}
                  </p>
                  <p className="mt-0.5 text-xs font-medium text-mcd-ink-muted">
                    持续 {row.minutes} 分钟
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-sm font-black tabular-nums text-mcd-red">
                    {row.kcal}
                    <span className="ml-0.5 text-xs font-extrabold text-mcd-ink/50">kcal</span>
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => onDelete(row.id)}
                  className="shrink-0 rounded-xl p-2.5 text-mcd-ink/35 transition-all hover:bg-mcd-canvas hover:text-mcd-red"
                  aria-label="删除此条"
                >
                  <Trash2 className="size-4" />
                </button>
              </motion.li>
            ))}
          </motion.ul>
        </div>
      ) : null}

      {earlierLogs.length > 0 ? (
        <div>
          <h3 className="mb-2 text-xs font-extrabold text-mcd-ink-muted">历史</h3>
          <div className="relative pl-1">
            <div
              className="absolute top-1 bottom-1 left-[0.4rem] w-px bg-linear-to-b from-mcd-gold/70 via-mcd-hairline to-transparent"
              aria-hidden
            />
            <ul className="space-y-3">
              {earlierLogs.map((row) => (
                <li key={row.id} className="relative flex gap-3 pl-6">
                  <div
                    className="absolute top-3 left-0 size-2 rounded-full border-2 border-mcd-white bg-mcd-gold shadow-sm ring-1 ring-mcd-gold/40"
                    aria-hidden
                  />
                  <div className="min-w-0 flex-1 overflow-hidden rounded-2xl border border-mcd-hairline bg-mcd-white p-3.5 shadow-sm transition-shadow hover:shadow-md">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-[0.7rem] font-extrabold tabular-nums text-mcd-ink-muted">
                          {formatYmdLabel(row.ymd)}
                        </p>
                        <p className="mt-1 text-[0.95rem] font-extrabold text-mcd-ink">{row.name}</p>
                        <p className="mt-0.5 text-xs font-medium text-mcd-ink-muted">
                          {row.minutes} 分钟
                        </p>
                      </div>
                      <div className="shrink-0 text-right">
                        <p className="text-sm font-black tabular-nums text-mcd-red/90">
                          {row.kcal}
                          <span className="ml-0.5 text-xs font-extrabold text-mcd-ink/50">kcal</span>
                        </p>
                        <button
                          type="button"
                          onClick={() => onDelete(row.id)}
                          className="mt-1 text-[0.65rem] font-extrabold text-mcd-ink/35 hover:text-mcd-red"
                        >
                          删除
                        </button>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      ) : logs.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-mcd-hairline bg-mcd-canvas/30 px-4 py-5 text-center text-sm font-medium text-mcd-ink-muted">
          暂无记录
        </p>
      ) : null}
    </motion.div>
  );
}
