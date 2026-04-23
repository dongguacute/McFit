import {
  Award,
  Gift,
  Medal,
  ScanLine,
  ShoppingBag,
  Star,
  Ticket,
  Utensils,
} from "lucide-react";
import { Link } from "react-router-dom";
import { motion } from "motion/react";

const stats = [
  { label: "我的积分", value: "1,280", icon: Star },
  { label: "课包余额", value: "6 节", icon: Ticket },
  { label: "优惠券", value: "2 张", icon: Ticket },
  { label: "礼品卡", value: "¥0", icon: Gift },
];

const quick = [
  { label: "最新任务", icon: Award, to: "/records" },
  { label: "兑换", icon: ShoppingBag, to: "/settings" },
  { label: "勋章馆", icon: Medal, to: "/records" },
  { label: "满意度", icon: ScanLine, to: "/settings" },
  { label: "积分商城", icon: Utensils, to: "/records" },
];

export function HomePage() {
  return (
    <div className="space-y-4 sm:space-y-5 lg:space-y-8">
      {/* 黄白条纹 Banner — 桌面占满首屏宽 */}
      <motion.section
        className="mcd-stripe-hero relative overflow-hidden rounded-none px-4 py-10 sm:rounded-2xl sm:py-12 lg:rounded-3xl lg:px-12 lg:py-14"
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
        <p className="relative text-center text-lg font-black uppercase tracking-[0.2em] text-mcd-ink sm:text-xl lg:text-2xl">
          FEEL-GOOD MOMENT
        </p>
        <p className="relative mt-2 text-center text-sm font-medium text-mcd-ink/75">
          与 McFit 一起，把训练变成小确幸
        </p>
      </motion.section>

      {/* 四宫格数据 — 桌面 4 列横排 */}
      <section className="px-3 sm:px-0">
        <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-4 lg:gap-4">
          {stats.map((s) => (
            <div
              key={s.label}
              className="rounded-2xl border border-mcd-hairline bg-mcd-white px-3 py-3.5 text-center shadow-sm lg:px-4 lg:py-5"
            >
              <div className="mx-auto flex size-8 items-center justify-center text-mcd-red">
                <s.icon className="size-5" strokeWidth={2.2} aria-hidden />
              </div>
              <p className="mt-1.5 text-[0.65rem] font-bold text-mcd-ink-muted lg:text-xs">{s.label}</p>
              <p className="mt-0.5 text-base font-black tabular-nums text-mcd-ink lg:text-lg">{s.value}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 大黄色 CTA — 桌面可与侧卡并排由 grid 控制 */}
      <section className="px-3 sm:px-0 lg:grid lg:grid-cols-12 lg:items-stretch lg:gap-6">
        <motion.div
          className="flex items-center gap-3 rounded-2xl bg-mcd-gold px-4 py-4 shadow-sm lg:col-span-8 lg:rounded-3xl lg:px-8 lg:py-6"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05, duration: 0.35 }}
        >
          <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-mcd-red/15 text-2xl lg:size-14">
            🍟
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-base font-black text-mcd-ink lg:text-lg">每日开练，优惠到</p>
            <p className="text-xs font-medium text-mcd-ink/70">完成当日目标，解锁下一档奖励</p>
          </div>
          <Link
            to="/records"
            className="shrink-0 rounded-full bg-mcd-white px-4 py-2 text-sm font-extrabold text-mcd-red shadow-md transition-transform active:scale-95"
          >
            Go
          </Link>
        </motion.div>
        <div className="mt-4 hidden rounded-2xl border border-dashed border-mcd-hairline bg-mcd-white p-4 lg:col-span-4 lg:mt-0 lg:flex lg:flex-col lg:justify-center">
          <p className="text-sm font-extrabold text-mcd-ink">今日小贴士</p>
          <p className="mt-1 text-xs leading-relaxed text-mcd-ink-muted">
            大屏幕上banner 与多列更舒展；小屏继续纵向滑动。导航在左侧（桌面）或底部（手机）。
          </p>
        </div>
      </section>

      {/* 快捷圆钮 — 桌面 5 列，手机横向可卷或换行 */}
      <section className="px-3 sm:px-0">
        <h2 className="mb-3 text-sm font-extrabold text-mcd-ink-muted">快捷入口</h2>
        <div className="grid grid-cols-5 gap-2 sm:gap-3 lg:gap-4">
          {quick.map((q) => (
            <Link
              key={q.label}
              to={q.to}
              className="group flex flex-col items-center gap-1.5 rounded-2xl border border-mcd-hairline bg-mcd-white py-3 transition-colors hover:bg-mcd-list-row"
            >
              <span className="flex size-11 items-center justify-center rounded-full border-2 border-mcd-gold bg-mcd-gold/15 text-mcd-red group-hover:bg-mcd-gold/30 lg:size-12">
                <q.icon className="size-5" strokeWidth={2.1} />
              </span>
              <span className="max-w-18 text-center text-[0.6rem] font-bold leading-tight text-mcd-ink sm:max-w-none sm:text-xs">
                {q.label}
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* 悬浮小助手角标 — 仅作装饰 */}
      <div
        className="pointer-events-none fixed bottom-24 right-3 z-20 select-none opacity-90 lg:bottom-8 lg:right-8"
        aria-hidden
      >
        <div className="flex h-10 items-center justify-center rounded-full border border-mcd-gold/80 bg-mcd-gold px-3 text-xs font-extrabold text-mcd-ink shadow-md">
          小助手
        </div>
      </div>
    </div>
  );
}
