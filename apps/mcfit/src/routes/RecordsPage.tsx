import { motion } from "motion/react";

const samples = [
  { d: "4 月 22 日", k: "跑步 30 分钟", v: "完成" },
  { d: "4 月 20 日", k: "力量 · 胸", v: "完成" },
  { d: "4 月 18 日", k: "休息", v: "—" },
];

export function RecordsPage() {
  return (
    <motion.div
      className="space-y-4"
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <h2 className="text-2xl font-black tracking-tight text-mcd-ink">时间线</h2>
      <p className="text-sm font-medium text-mcd-ink-muted">近期记录示例，可接入真实数据。</p>
      <div className="overflow-hidden rounded-2xl border border-mcd-hairline">
        {samples.map((row) => (
          <div
            key={row.d + row.k}
            className="flex items-start gap-3 border-b border-mcd-hairline bg-mcd-white px-3.5 py-3.5 last:border-b-0"
          >
            <p className="w-[4.2rem] shrink-0 text-xs font-extrabold text-mcd-ink-muted">{row.d}</p>
            <div className="min-w-0 flex-1">
              <p className="text-[0.95rem] font-extrabold text-mcd-ink">{row.k}</p>
            </div>
            <p className="shrink-0 text-xs font-bold text-mcd-red">{row.v}</p>
          </div>
        ))}
      </div>
    </motion.div>
  );
}
