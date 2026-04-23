import { motion } from "motion/react";
import { useEffect, useMemo, useState } from "react";
import { TodayMenuPanel } from "../components/TodayMenuPanel";
import { MEAL_INTAKE_CHANGED, todayConsumedMealKcal } from "../lib/mealIntakeLog";

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

export function MealRecordPage() {
  const today = todayYmd();
  const [rev, setRev] = useState(0);

  useEffect(() => {
    const onMeal = () => setRev((n) => n + 1);
    window.addEventListener(MEAL_INTAKE_CHANGED, onMeal);
    return () => window.removeEventListener(MEAL_INTAKE_CHANGED, onMeal);
  }, []);

  const consumed = useMemo(() => todayConsumedMealKcal(today), [today, rev]);

  return (
    <motion.div
      className="space-y-6"
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
    >
      <div className="flex flex-col gap-3 rounded-2xl border border-mcd-hairline bg-mcd-white px-4 py-3 shadow-sm min-[400px]:flex-row min-[400px]:items-center min-[400px]:justify-between">
        <p className="text-sm font-extrabold text-mcd-ink">
          <span className="text-mcd-ink-muted">今日</span> · {todayTitleZh()}
        </p>
        <div className="text-left min-[400px]:text-right">
          <p className="text-2xl font-black leading-none tabular-nums text-mcd-red sm:text-3xl">
            {Math.round(consumed * 10) / 10}
            <span className="ml-0.5 text-sm font-extrabold text-mcd-ink/45">kcal</span>
          </p>
          <p className="mt-0.5 text-[0.65rem] font-medium text-mcd-ink-muted">饮食已记入</p>
        </div>
      </div>

      <TodayMenuPanel />
    </motion.div>
  );
}
