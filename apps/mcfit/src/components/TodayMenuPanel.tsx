import { Loader2, MapPin, RefreshCw, UtensilsCrossed } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { runMcpMenuFetch } from "../lib/checkinMenuRunner";
import { ymdInBeijing } from "../lib/exerciseEnergy";
import {
  appendMealIntake,
  loadMealIntakeForYmd,
  MEAL_INTAKE_CHANGED,
  type MealIntakeEntry,
} from "../lib/mealIntakeLog";
import { loadTodayMcpMenu, TODAY_MENU_CHANGED, updateMcpMenuItem } from "../lib/todayMcpMenu";
import type { McpMenuItem, TodayMcpMenuState } from "../lib/todayMcpMenu";

type SidebarTab = "recommend" | "logged";

function useTodayMcpMenuState(): TodayMcpMenuState | null {
  const [state, setState] = useState<TodayMcpMenuState | null>(() => loadTodayMcpMenu());
  useEffect(() => {
    const sync = () => setState(loadTodayMcpMenu());
    window.addEventListener(TODAY_MENU_CHANGED, sync);
    const onVis = () => {
      if (document.visibilityState === "visible") {
        sync();
      }
    };
    document.addEventListener("visibilitychange", onVis);
    return () => {
      window.removeEventListener(TODAY_MENU_CHANGED, sync);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, []);
  return state;
}

function useTodayMealIntake(): MealIntakeEntry[] {
  const today = ymdInBeijing();
  const [rows, setRows] = useState<MealIntakeEntry[]>(() => loadMealIntakeForYmd(today));
  useEffect(() => {
    const sync = () => setRows(loadMealIntakeForYmd(today));
    window.addEventListener(MEAL_INTAKE_CHANGED, sync);
    window.addEventListener(TODAY_MENU_CHANGED, sync);
    return () => {
      window.removeEventListener(MEAL_INTAKE_CHANGED, sync);
      window.removeEventListener(TODAY_MENU_CHANGED, sync);
    };
  }, [today]);
  return rows;
}

type Props = {
  compact?: boolean;
};

function MealThumbnails({
  urls,
  compact,
  name,
}: {
  urls: string[];
  compact: boolean;
  name: string;
}) {
  if (urls.length === 0) {
    return null;
  }
  const h = compact ? "h-14" : "h-24";
  const w = compact ? "min-w-14" : "min-w-24";
  return (
    <div
      className="-mx-0.5 flex gap-1.5 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      role="list"
      aria-label={`${name} 图片`}
    >
      {urls.map((src, i) => (
        <img
          key={`${src}-${i}`}
          role="listitem"
          src={src}
          alt=""
          className={`${h} ${w} shrink-0 snap-center rounded-xl object-cover ring-1 ring-mcd-hairline`}
          loading="lazy"
          referrerPolicy="no-referrer"
        />
      ))}
    </div>
  );
}

/** 与桌面侧栏 NavLink 选中态一致：bg-mcd-gold/25 text-mcd-red */
function tabClass(active: boolean, compact: boolean): string {
  const base = [
    "flex-1 rounded-xl px-2 py-2 text-center font-bold transition-colors",
    compact ? "text-[0.65rem]" : "text-xs",
    active ? "bg-mcd-gold/25 text-mcd-red" : "text-mcd-ink/80 hover:bg-black/5 dark:hover:bg-white/10",
  ];
  return base.join(" ");
}

export function TodayMenuPanel({ compact }: Props) {
  const menu = useTodayMcpMenuState();
  const intakes = useTodayMealIntake();
  const [tab, setTab] = useState<SidebarTab>("recommend");
  const [refetching, setRefetching] = useState(false);
  const today = ymdInBeijing();

  const intakeSum = useMemo(() => intakes.reduce((a, b) => a + b.kcal, 0), [intakes]);

  const onRefetch = useCallback(async () => {
    setRefetching(true);
    await runMcpMenuFetch();
    setRefetching(false);
  }, []);

  const onConsume = useCallback((item: McpMenuItem) => {
    if (item.status !== "pending") {
      return;
    }
    appendMealIntake({
      ymd: today,
      name: item.name,
      kcal: item.kcal,
      slotId: item.slotId,
      slotLabel: item.slotLabel,
      source: "mcp_checkin",
      ...(item.imageUrls?.length ? { imageUrls: item.imageUrls } : {}),
    });
    updateMcpMenuItem(item.id, { status: "consumed" });
  }, [today]);

  const onSkip = useCallback((item: McpMenuItem) => {
    if (item.status !== "pending") {
      return;
    }
    updateMcpMenuItem(item.id, { status: "skipped" });
  }, []);

  const showRetry = Boolean(menu?.error);
  const pad = compact ? "p-2" : "p-3";
  const iconBox = compact ? "size-9" : "size-11";
  const iconInner = compact ? "size-4" : "size-5";
  const titleSz = compact ? "text-[0.7rem]" : "text-[0.95rem]";
  const subSz = compact ? "text-[0.6rem]" : "text-xs";
  const kcalSz = compact ? "text-[0.7rem]" : "text-sm";

  return (
    <div
      className={`overflow-hidden rounded-2xl border border-mcd-hairline bg-mcd-white shadow-sm ${
        compact ? "" : ""
      }`}
    >
      <div className="flex gap-0.5 border-b border-mcd-hairline p-1.5" role="tablist" aria-label="记录">
        <button
          type="button"
          role="tab"
          aria-selected={tab === "recommend"}
          onClick={() => setTab("recommend")}
          className={tabClass(tab === "recommend", Boolean(compact))}
        >
          推荐
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === "logged"}
          onClick={() => setTab("logged")}
          className={tabClass(tab === "logged", Boolean(compact))}
        >
          已记入
        </button>
      </div>

      <div className={`${pad} max-h-[min(52vh,24rem)] overflow-y-auto`}>
        <div className="mb-2 flex items-start justify-between gap-2">
          <p className={`${subSz} font-medium leading-snug text-mcd-ink-muted`}>
            概览页<strong className="font-extrabold text-mcd-ink/80">签到</strong>
            拉取 MCP；此处对照记录热量。
          </p>
          {showRetry ? (
            <button
              type="button"
              onClick={() => void onRefetch()}
              disabled={refetching}
              className="shrink-0 rounded-lg p-1 text-mcd-red transition hover:bg-mcd-red/10 disabled:opacity-50"
              aria-label="重试拉取"
            >
              {refetching ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <RefreshCw className="size-4" aria-hidden />}
            </button>
          ) : null}
        </div>

        {tab === "recommend" ? (
          <>
            {menu?.error ? (
              <p className="mb-2 rounded-lg border border-mcd-red/25 bg-mcd-red/5 px-2 py-1.5 text-[0.65rem] font-medium text-mcd-red">
                {menu.error}
              </p>
            ) : null}

            {menu?.nearestStoreName ? (
              <p className="mb-2 flex items-start gap-1 text-[0.65rem] font-medium text-mcd-ink-muted">
                <MapPin className="mt-0.5 size-3 shrink-0 text-mcd-red/70" strokeWidth={2.2} aria-hidden />
                <span>
                  <span className="font-extrabold text-mcd-ink/80">{menu.nearestStoreName}</span>
                  {menu.nearestStoreDetail ? (
                    <span className="mt-0.5 block text-[0.6rem] leading-snug">{menu.nearestStoreDetail}</span>
                  ) : null}
                </span>
              </p>
            ) : null}

            {!menu || menu.items.length === 0 ? (
              <p className={`${subSz} font-medium text-mcd-ink-muted`}>暂无；请先签到拉取。</p>
            ) : (
              <ul className="space-y-2.5">
                {menu.items.map((item) => {
                  const imgs = item.imageUrls ?? [];
                  return (
                    <li
                      key={item.id}
                      className={`relative overflow-hidden rounded-2xl border border-mcd-hairline bg-mcd-white pl-3 shadow-sm ${compact ? "p-2 pl-2.5" : "p-3.5 pl-3.5"}`}
                    >
                      <div
                        className="absolute top-0 left-0 h-full w-1 rounded-l-2xl bg-linear-to-b from-mcd-gold to-mcd-red/90"
                        aria-hidden
                      />
                      <div className="flex gap-3">
                        {imgs.length === 0 ? (
                          <div
                            className={`flex shrink-0 items-center justify-center rounded-2xl bg-mcd-gold/20 text-mcd-red ${iconBox}`}
                          >
                            <UtensilsCrossed className={iconInner} strokeWidth={2.2} aria-hidden />
                          </div>
                        ) : null}
                        <div className="min-w-0 flex-1 pr-0.5">
                          <MealThumbnails urls={imgs} compact={Boolean(compact)} name={item.name} />
                          <p className={`${subSz} font-extrabold text-mcd-ink-muted`}>{item.slotLabel}</p>
                          <p className={`mt-0.5 line-clamp-2 ${titleSz} font-extrabold text-mcd-ink`}>{item.name}</p>
                          <p className={`mt-0.5 font-black tabular-nums text-mcd-red ${kcalSz}`}>
                            {item.kcal}
                            <span className={`ml-0.5 font-extrabold text-mcd-ink/50 ${compact ? "text-[0.55rem]" : "text-xs"}`}>
                              kcal
                            </span>
                          </p>
                          {item.note ? (
                            <p className={`mt-1 ${subSz} font-medium leading-relaxed text-mcd-ink-muted`}>{item.note}</p>
                          ) : null}
                          {item.status === "pending" ? (
                            <div className="mt-2 flex flex-wrap gap-1.5">
                              <button
                                type="button"
                                onClick={() => onConsume(item)}
                                className={`rounded-lg bg-mcd-red px-2 py-1 ${subSz} font-extrabold text-mcd-white`}
                              >
                                已享用
                              </button>
                              <button
                                type="button"
                                onClick={() => onSkip(item)}
                                className={`rounded-lg border border-mcd-hairline bg-mcd-canvas px-2 py-1 ${subSz} font-extrabold text-mcd-ink-muted`}
                              >
                                忽略
                              </button>
                            </div>
                          ) : (
                            <p className={`mt-2 ${subSz} font-bold text-mcd-ink-muted`}>
                              {item.status === "consumed" ? "已记入饮食" : "已忽略"}
                            </p>
                          )}
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </>
        ) : (
          <>
            {intakes.length === 0 ? (
              <p className={`${subSz} font-medium text-mcd-ink-muted`}>暂无；在「推荐」中点「已享用」后出现。</p>
            ) : (
              <>
                <p className={`mb-2 ${subSz} font-bold tabular-nums text-mcd-ink`}>
                  今日合计 <span className="text-mcd-red">{Math.round(intakeSum * 10) / 10}</span> kcal
                </p>
                <ul className="space-y-2.5">
                  {intakes.map((row) => {
                    const imgs = row.imageUrls ?? [];
                    return (
                      <li
                        key={row.id}
                        className={`relative overflow-hidden rounded-2xl border border-mcd-hairline bg-mcd-white pl-3 shadow-sm ${compact ? "p-2 pl-2.5" : "p-3.5 pl-3.5"}`}
                      >
                        <div
                          className="absolute top-0 left-0 h-full w-1 rounded-l-2xl bg-linear-to-b from-mcd-gold to-mcd-red/90"
                          aria-hidden
                        />
                        <div className="flex gap-3">
                          {imgs.length === 0 ? (
                            <div
                              className={`flex shrink-0 items-center justify-center rounded-2xl bg-mcd-gold/20 text-mcd-red ${iconBox}`}
                            >
                              <UtensilsCrossed className={iconInner} strokeWidth={2.2} aria-hidden />
                            </div>
                          ) : null}
                          <div className="min-w-0 flex-1">
                            <MealThumbnails urls={imgs} compact={Boolean(compact)} name={row.name} />
                            <div className="flex min-w-0 items-start justify-between gap-2">
                              <div className="min-w-0">
                                <p className={`${subSz} font-extrabold text-mcd-ink-muted`}>{row.slotLabel}</p>
                                <p className={`mt-0.5 line-clamp-2 ${titleSz} font-extrabold text-mcd-ink`}>{row.name}</p>
                              </div>
                              <p className={`shrink-0 font-black tabular-nums text-mcd-red ${kcalSz}`}>
                                {row.kcal}
                                <span className={`ml-0.5 font-extrabold text-mcd-ink/50 ${compact ? "text-[0.55rem]" : "text-xs"}`}>
                                  kcal
                                </span>
                              </p>
                            </div>
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
