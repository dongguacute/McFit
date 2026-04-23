import { ClipboardList, Home, LayoutDashboard, Settings, UtensilsCrossed } from "lucide-react";
import { useEffect, useState } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import siteLogo from "../assets/logo2.png";
import { getGreeting } from "../lib/greeting";

const shellTitles: Record<string, { t: string; s: string }> = {
  "/": { t: "今日开练", s: "让每次训练都简单可完成" },
  "/settings": { t: "设置", s: "账户、通知与偏好" },
  "/records": { t: "运动记录", s: "本日与历史" },
  "/meal-record": { t: "饮食记录", s: "MCP 推荐与已享用" },
};

const sidebarLink = ({ isActive }: { isActive: boolean }) =>
  [
    "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-bold transition-colors",
    isActive ? "bg-mcd-gold/25 text-mcd-red" : "text-mcd-ink/80 hover:bg-black/5 dark:hover:bg-white/10",
  ].join(" ");

const mobileTabClass = ({ isActive }: { isActive: boolean }) =>
  [
    "flex min-h-[3.25rem] min-w-0 flex-1 flex-col items-center justify-center gap-0.5 rounded-2xl px-1 py-1.5 text-[0.65rem] font-extrabold leading-none transition-colors",
    "[-webkit-tap-highlight-color:transparent] active:scale-[0.98] [&_svg]:size-[1.35rem] [&_svg]:shrink-0",
    isActive
      ? "bg-mcd-gold/25 text-mcd-red"
      : "text-mcd-ink/45",
  ].join(" ");

function shanghaiTimeLabel(d: Date): string {
  return d.toLocaleTimeString("zh-CN", {
    timeZone: "Asia/Shanghai",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
}

export function AppLayout() {
  const { pathname } = useLocation();
  const meta = shellTitles[pathname] ?? { t: "McFit", s: "好状态 每一天" };
  const greet = getGreeting();
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(id);
  }, []);

  return (
    <div className="font-sans flex min-h-dvh flex-col bg-mcd-canvas text-mcd-ink lg:flex-row">
      {/* —— 桌面：左侧导航 —— */}
      <aside className="hidden h-dvh w-56 shrink-0 flex-col border-r border-mcd-hairline bg-mcd-white [box-shadow:var(--shadow-mcd-sidebar)] lg:flex lg:fixed lg:inset-y-0 lg:left-0 lg:z-40">
        <div className="flex items-center gap-2.5 border-b border-mcd-hairline px-4 py-4">
          <img
            src={siteLogo}
            alt=""
            width={40}
            height={40}
            className="size-10 shrink-0 object-contain shadow-sm"
            decoding="async"
          />
          <div>
            <p className="text-xs font-extrabold text-mcd-ink/45">McFit</p>
            <p className="text-sm font-extrabold">健身助手</p>
          </div>
        </div>
        <nav className="flex min-h-0 flex-1 flex-col gap-0.5 overflow-y-auto p-2" aria-label="侧栏">
          <NavLink to="/" end className={sidebarLink}>
            <LayoutDashboard className="size-4" aria-hidden />
            概览
          </NavLink>
          <NavLink to="/records" className={sidebarLink}>
            <ClipboardList className="size-4" aria-hidden />
            运动记录
          </NavLink>
          <NavLink to="/meal-record" className={sidebarLink}>
            <UtensilsCrossed className="size-4" aria-hidden />
            饮食记录
          </NavLink>
          <NavLink to="/settings" className={sidebarLink}>
            <Settings className="size-4" aria-hidden />
            设置
          </NavLink>
        </nav>
        <div className="shrink-0 border-t border-mcd-hairline p-3 text-left">
          <time
            className="font-mono text-sm font-extrabold tabular-nums text-mcd-ink/85"
            dateTime={now.toISOString()}
            title="中国时区：Asia/Shanghai"
            aria-live="polite"
          >
            {shanghaiTimeLabel(now)}
          </time>
        </div>
      </aside>

      {/* 主区：含顶栏 + 内容（移动端含底栏位） */}
      <div className="flex min-h-0 min-w-0 flex-1 flex-col lg:ml-56">
        {/* 顶栏：白底 + 问候；移动端提供饮食记录快捷入口 */}
        <header className="sticky top-0 z-30 flex shrink-0 items-center justify-between gap-3 border-b border-mcd-hairline bg-mcd-white px-3 py-2.5 pt-[max(0.5rem,env(safe-area-inset-top,0))] sm:px-4 lg:px-6 lg:py-3">
          <div className="flex min-w-0 items-center gap-2.5">
            <img
              src={siteLogo}
              alt=""
              width={36}
              height={36}
              className="size-9 shrink-0 object-contain shadow-sm lg:hidden"
              decoding="async"
            />
            <div className="min-w-0">
              <p className="truncate text-sm font-extrabold sm:text-base">{greet.line}</p>
              <p className="truncate text-xs text-mcd-ink-muted">{greet.sub}</p>
            </div>
          </div>
          <NavLink
            to="/meal-record"
            className={({ isActive }) =>
              [
                "flex size-9 shrink-0 items-center justify-center rounded-full lg:hidden",
                isActive ? "bg-mcd-gold/25 text-mcd-red" : "hover:bg-mcd-canvas text-mcd-ink",
              ].join(" ")
            }
            aria-label="饮食记录"
          >
            <UtensilsCrossed className="size-5" strokeWidth={2.2} />
          </NavLink>
        </header>

        {/* 子页标题条（移动端；桌面不突出） */}
        {pathname !== "/" && (
          <div className="border-b border-mcd-hairline bg-mcd-white px-3 py-2 sm:px-4 lg:hidden">
            <h1 className="text-lg font-black">{meta.t}</h1>
            <p className="text-xs text-mcd-ink-muted">{meta.s}</p>
          </div>
        )}

        {/* 桌面子页大标题区 */}
        {pathname !== "/" && (
          <div className="hidden border-b border-mcd-hairline bg-mcd-canvas/80 px-6 py-5 backdrop-blur-sm lg:block">
            <h1 className="text-2xl font-black tracking-tight text-mcd-ink">{meta.t}</h1>
            <p className="mt-0.5 text-sm text-mcd-ink-muted">{meta.s}</p>
          </div>
        )}

        <main
          className="min-h-0 flex-1 overflow-y-auto max-lg:pb-[calc(4.25rem+env(safe-area-inset-bottom,0))]"
          id="main-scroll"
        >
          <div
            className={
              pathname === "/"
                ? "px-0 pb-4 sm:px-0 lg:max-w-6xl lg:px-8 lg:py-6"
                : "px-3 py-4 sm:px-4 lg:max-w-4xl lg:px-8 lg:py-6"
            }
          >
            <Outlet />
          </div>
        </main>
      </div>

      {/* 移动端底栏：四格均分，与侧栏路由一一对应 */}
      <nav
        className="fixed inset-x-0 bottom-0 z-40 touch-manipulation border-t border-mcd-hairline bg-mcd-white/95 shadow-[0_-4px_24px_rgba(0,0,0,0.06)] backdrop-blur-md supports-backdrop-filter:bg-mcd-white/80 lg:hidden dark:shadow-[0_-4px_24px_rgba(0,0,0,0.35)]"
        style={{ paddingBottom: "max(0.35rem, env(safe-area-inset-bottom, 0px))" }}
        aria-label="主导航"
      >
        <div className="mx-auto flex max-w-lg items-stretch justify-between gap-0.5 px-2 pt-1.5">
          <NavLink to="/" end className={mobileTabClass} title="概览">
            <Home strokeWidth={2.2} aria-hidden />
            概览
          </NavLink>
          <NavLink to="/records" className={mobileTabClass} title="运动记录">
            <ClipboardList strokeWidth={2.2} aria-hidden />
            运动
          </NavLink>
          <NavLink to="/meal-record" className={mobileTabClass} title="饮食记录">
            <UtensilsCrossed strokeWidth={2.2} aria-hidden />
            饮食
          </NavLink>
          <NavLink to="/settings" className={mobileTabClass} title="设置">
            <Settings strokeWidth={2.2} aria-hidden />
            设置
          </NavLink>
        </div>
      </nav>
    </div>
  );
}
