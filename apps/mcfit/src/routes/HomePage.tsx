import { motion } from "motion/react";

export function HomePage() {
  return (
    <div className="space-y-6">
      <motion.h1
        className="text-3xl font-semibold tracking-tight"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
      >
        欢迎使用 McFit
      </motion.h1>
      <p className="text-zinc-600 dark:text-zinc-400">
        React Router、Tailwind CSS 与 Motion 已就绪。从顶部导航切换到其他页面。
      </p>
      <motion.div
        className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1, duration: 0.35 }}
      >
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          此卡片使用 <code className="rounded bg-zinc-100 px-1 py-0.5 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200">motion</code>{" "}
          做过场动画。
        </p>
      </motion.div>
    </div>
  );
}
