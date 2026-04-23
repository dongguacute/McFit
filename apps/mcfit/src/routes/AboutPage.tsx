import { motion } from "motion/react";

export function AboutPage() {
  return (
    <motion.div
      className="space-y-4"
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3 }}
    >
      <h1 className="text-2xl font-semibold">关于</h1>
      <p className="text-zinc-600 dark:text-zinc-400">
        Monorepo：pnpm workspace + Turbo。前端栈：Vite、React 19、React Router 7、Tailwind v4、Motion。
      </p>
    </motion.div>
  );
}
