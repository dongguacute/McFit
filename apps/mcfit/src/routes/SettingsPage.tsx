import { Eye, EyeOff, Key, KeyRound, Link2, Save, Scale, Server, Weight } from "lucide-react";
import { motion } from "motion/react";
import { useCallback, useEffect, useId, useState } from "react";
import { loadMcFitSettings, saveMcFitSettings } from "../lib/mcfitSettings";

export function SettingsPage() {
  const mcpBaseId = useId();
  const mcpId = useId();
  const aiBaseId = useId();
  const aiKeyId = useId();
  const weightId = useId();
  const currentWeightId = useId();
  const [mcpBaseUrl, setMcpBaseUrl] = useState("");
  const [mcpToken, setMcpToken] = useState("");
  const [aiApiBaseUrl, setAiApiBaseUrl] = useState("");
  const [aiApiKey, setAiApiKey] = useState("");
  const [showMcpToken, setShowMcpToken] = useState(false);
  const [showAiKey, setShowAiKey] = useState(false);
  const [initialWeightInput, setInitialWeightInput] = useState("");
  const [currentWeightInput, setCurrentWeightInput] = useState("");
  const [savedAt, setSavedAt] = useState<number | null>(null);

  useEffect(() => {
    const s = loadMcFitSettings();
    setMcpBaseUrl(s.mcpBaseUrl);
    setMcpToken(s.mcpToken);
    setAiApiBaseUrl(s.aiApiBaseUrl);
    setAiApiKey(s.aiApiKey);
    setInitialWeightInput(
      s.initialWeightKg != null ? String(s.initialWeightKg) : "",
    );
    setCurrentWeightInput(
      s.currentWeightKg != null ? String(s.currentWeightKg) : "",
    );
  }, []);

  const onSave = useCallback(() => {
    const t = initialWeightInput.trim().replace(",", ".");
    let initialWeightKg: number | null = null;
    if (t) {
      const n = Number.parseFloat(t);
      if (Number.isFinite(n) && n >= 0) {
        initialWeightKg = Math.round(n * 10) / 10;
      }
    }
    const tcw = currentWeightInput.trim().replace(",", ".");
    let currentWeightKg: number | null = null;
    if (tcw) {
      const n = Number.parseFloat(tcw);
      if (Number.isFinite(n) && n >= 0) {
        currentWeightKg = Math.round(n * 10) / 10;
      }
    }
    saveMcFitSettings({
      mcpBaseUrl: mcpBaseUrl.trim().replace(/\/+$/, "") || "",
      mcpToken: mcpToken.trim(),
      aiApiBaseUrl: aiApiBaseUrl.trim().replace(/\/+$/, "") || "",
      aiApiKey: aiApiKey.trim(),
      initialWeightKg,
      currentWeightKg,
    });
    setSavedAt(Date.now());
  }, [mcpBaseUrl, mcpToken, aiApiBaseUrl, aiApiKey, initialWeightInput, currentWeightInput]);

  return (
    <motion.div
      className="space-y-6"
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <h2 className="text-2xl font-black tracking-tight text-mcd-ink">连接</h2>
      <p className="text-sm font-medium leading-relaxed text-mcd-ink-muted">
        配置麦当劳 MCP 与 OpenAI 兼容的地址和密钥；数据保存在本机浏览器，由你在调用后端时一并传入。
      </p>

      <div className="overflow-hidden rounded-2xl border border-mcd-hairline bg-mcd-white p-3.5 sm:p-4">
        <div className="space-y-4">
          <div>
            <label
              htmlFor={mcpBaseId}
              className="flex items-center gap-2 text-[0.95rem] font-extrabold text-mcd-ink"
            >
              <Server className="size-4 text-mcd-red" strokeWidth={2.2} aria-hidden />
              MCP 服务地址
            </label>
            <p className="mt-1 text-xs font-medium text-mcd-ink-muted">
              Streamable HTTP 根地址；不填时由 API 使用官方默认 <span className="font-mono text-[0.7rem]">https://mcp.mcd.cn</span>。
            </p>
            <input
              id={mcpBaseId}
              name="mcpBaseUrl"
              type="url"
              inputMode="url"
              value={mcpBaseUrl}
              onChange={(e) => setMcpBaseUrl(e.target.value)}
              placeholder="https://mcp.mcd.cn"
              className="mt-2 w-full rounded-xl border border-mcd-hairline bg-mcd-canvas px-3 py-2.5 text-sm font-medium text-mcd-ink placeholder:text-mcd-ink-muted/50 focus:border-mcd-red/40 focus:outline-none focus:ring-2 focus:ring-mcd-red/15"
            />
          </div>

          <div className="border-t border-mcd-hairline pt-4">
            <label
              htmlFor={mcpId}
              className="flex items-center gap-2 text-[0.95rem] font-extrabold text-mcd-ink"
            >
              <KeyRound className="size-4 text-mcd-red" strokeWidth={2.2} aria-hidden />
              麦当劳 MCP Token
            </label>
            <p className="mt-1 text-xs font-medium text-mcd-ink-muted">
              用于调用托管 MCP，详见{" "}
              <a
                href="https://open.mcd.cn/mcp/doc"
                target="_blank"
                rel="noreferrer"
                className="font-bold text-mcd-red underline decoration-mcd-red/30 underline-offset-2"
              >
                开放平台文档
              </a>
              。
            </p>
            <div className="relative mt-2">
              <input
                id={mcpId}
                name="mcpToken"
                type={showMcpToken ? "text" : "password"}
                autoComplete="off"
                value={mcpToken}
                onChange={(e) => setMcpToken(e.target.value)}
                placeholder="粘贴 MCP Token"
                className="w-full rounded-xl border border-mcd-hairline bg-mcd-canvas px-3 py-2.5 pr-11 text-sm font-medium text-mcd-ink placeholder:text-mcd-ink-muted/50 focus:border-mcd-red/40 focus:outline-none focus:ring-2 focus:ring-mcd-red/15"
              />
              <button
                type="button"
                onClick={() => setShowMcpToken((v) => !v)}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-mcd-ink-muted hover:bg-black/5 hover:text-mcd-ink"
                aria-label={showMcpToken ? "隐藏 Token" : "显示 Token"}
              >
                {showMcpToken ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
          </div>

          <div className="border-t border-mcd-hairline pt-4">
            <label
              htmlFor={aiBaseId}
              className="flex items-center gap-2 text-[0.95rem] font-extrabold text-mcd-ink"
            >
              <Link2 className="size-4 text-mcd-red" strokeWidth={2.2} aria-hidden />
              AI API 地址
            </label>
            <p className="mt-1 text-xs font-medium text-mcd-ink-muted">
              OpenAI 兼容接口的 Base URL，通常以{" "}
              <span className="font-mono text-[0.7rem] text-mcd-ink/80">/v1</span> 结尾，例如
              官方 <span className="font-mono text-[0.7rem]">https://api.openai.com/v1</span>{" "}
              或自托管代理。
            </p>
            <input
              id={aiBaseId}
              name="aiApiBaseUrl"
              type="url"
              inputMode="url"
              value={aiApiBaseUrl}
              onChange={(e) => setAiApiBaseUrl(e.target.value)}
              placeholder="https://api.openai.com/v1"
              className="mt-2 w-full rounded-xl border border-mcd-hairline bg-mcd-canvas px-3 py-2.5 text-sm font-medium text-mcd-ink placeholder:text-mcd-ink-muted/50 focus:border-mcd-red/40 focus:outline-none focus:ring-2 focus:ring-mcd-red/15"
            />
          </div>

          <div className="border-t border-mcd-hairline pt-4">
            <label
              htmlFor={aiKeyId}
              className="flex items-center gap-2 text-[0.95rem] font-extrabold text-mcd-ink"
            >
              <Key className="size-4 text-mcd-red" strokeWidth={2.2} aria-hidden />
              AI API Key
            </label>
            <p className="mt-1 text-xs font-medium text-mcd-ink-muted">
              与上方 Base URL 对应的密钥，请求体会以 <span className="font-mono text-[0.7rem]">aitoken</span>{" "}
              传入后端。
            </p>
            <div className="relative mt-2">
              <input
                id={aiKeyId}
                name="aiApiKey"
                type={showAiKey ? "text" : "password"}
                autoComplete="off"
                value={aiApiKey}
                onChange={(e) => setAiApiKey(e.target.value)}
                placeholder="sk-…"
                className="w-full rounded-xl border border-mcd-hairline bg-mcd-canvas px-3 py-2.5 pr-11 text-sm font-medium text-mcd-ink placeholder:text-mcd-ink-muted/50 focus:border-mcd-red/40 focus:outline-none focus:ring-2 focus:ring-mcd-red/15"
              />
              <button
                type="button"
                onClick={() => setShowAiKey((v) => !v)}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-mcd-ink-muted hover:bg-black/5 hover:text-mcd-ink"
                aria-label={showAiKey ? "隐藏 API Key" : "显示 API Key"}
              >
                {showAiKey ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div>
        <h2 className="text-2xl font-black tracking-tight text-mcd-ink">身体数据</h2>
        <p className="mt-1 text-sm font-medium leading-relaxed text-mcd-ink-muted">
          公制，单位千克（kg）。运动耗热按「现在体重」优先，无则回退到「初始体重」。
        </p>
        <div className="mt-4 space-y-0 overflow-hidden rounded-2xl border border-mcd-hairline bg-mcd-white p-3.5 sm:p-4">
          <div>
            <label
              htmlFor={currentWeightId}
              className="flex items-center gap-2 text-[0.95rem] font-extrabold text-mcd-ink"
            >
              <Weight className="size-4 text-mcd-red" strokeWidth={2.2} aria-hidden />
              现在体重
            </label>
            <p className="mt-1 text-xs font-medium text-mcd-ink-muted">
              建议定期更新。用于 <span className="font-extrabold">MET 消耗</span> 等计算，优先于初始体重；留空则只用初始值或默认 70
              kg。
            </p>
            <div className="relative mt-2 flex items-center gap-2">
              <input
                id={currentWeightId}
                name="currentWeightKg"
                type="text"
                inputMode="decimal"
                value={currentWeightInput}
                onChange={(e) => setCurrentWeightInput(e.target.value)}
                placeholder="例如 68.0"
                className="min-w-0 flex-1 rounded-xl border border-mcd-hairline bg-mcd-canvas px-3 py-2.5 text-sm font-medium text-mcd-ink tabular-nums placeholder:text-mcd-ink-muted/50 focus:border-mcd-red/40 focus:outline-none focus:ring-2 focus:ring-mcd-red/15"
                aria-describedby={`${currentWeightId}-unit`}
              />
              <span
                id={`${currentWeightId}-unit`}
                className="shrink-0 rounded-xl border border-mcd-hairline bg-mcd-canvas px-3 py-2.5 text-sm font-extrabold text-mcd-ink-muted"
              >
                kg
              </span>
            </div>
          </div>
          <div className="mt-4 border-t border-mcd-hairline pt-4">
            <label
              htmlFor={weightId}
              className="flex items-center gap-2 text-[0.95rem] font-extrabold text-mcd-ink"
            >
              <Scale className="size-4 text-mcd-red" strokeWidth={2.2} aria-hidden />
              初始体重
            </label>
            <p className="mt-1 text-xs font-medium text-mcd-ink-muted">
              开练/打卡基准，留空表示未设置。保存时保留一位小数。
            </p>
            <p className="mt-1.5 text-xs font-extrabold text-mcd-ink/80">
              注意：请填写空腹时的体重（如晨起、未进食前）。
            </p>
            <div className="relative mt-2 flex items-center gap-2">
              <input
                id={weightId}
                name="initialWeightKg"
                type="text"
                inputMode="decimal"
                value={initialWeightInput}
                onChange={(e) => setInitialWeightInput(e.target.value)}
                placeholder="例如 70.5"
                className="min-w-0 flex-1 rounded-xl border border-mcd-hairline bg-mcd-canvas px-3 py-2.5 text-sm font-medium text-mcd-ink tabular-nums placeholder:text-mcd-ink-muted/50 focus:border-mcd-red/40 focus:outline-none focus:ring-2 focus:ring-mcd-red/15"
                aria-describedby={`${weightId}-unit`}
              />
              <span
                id={`${weightId}-unit`}
                className="shrink-0 rounded-xl border border-mcd-hairline bg-mcd-canvas px-3 py-2.5 text-sm font-extrabold text-mcd-ink-muted"
              >
                kg
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={onSave}
          className="inline-flex items-center justify-center gap-2 rounded-full bg-mcd-red px-5 py-2.5 text-sm font-extrabold text-mcd-white shadow-sm transition-transform active:scale-[0.98]"
        >
          <Save className="size-4" strokeWidth={2.2} aria-hidden />
          保存全部
        </button>
        {savedAt !== null ? (
          <span className="text-xs font-bold text-mcd-ink-muted" role="status">
            已保存
          </span>
        ) : null}
      </div>
    </motion.div>
  );
}
