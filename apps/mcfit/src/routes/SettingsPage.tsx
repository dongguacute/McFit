import { DEFAULT_AI_MODEL } from "@mcfit/api";
import {
  Bot,
  Eye,
  EyeOff,
  Key,
  KeyRound,
  Link2,
  MapPin,
  Monitor,
  Moon,
  Save,
  Scale,
  Server,
  Sun,
  Trash2,
  Weight,
} from "lucide-react";
import { motion } from "motion/react";
import { useCallback, useEffect, useId, useState } from "react";
import { clearAllAppDataExceptSettings } from "../lib/devResetNonSettings";
import { loadMcFitSettings, saveMcFitSettings } from "../lib/mcfitSettings";
import { setThemeMode as persistThemeMode, type McFitThemeMode } from "../lib/theme";

const AI_MODEL_PRESETS = ["gpt-4o-mini", "gpt-4o", "gpt-4-turbo", "gpt-3.5-turbo"] as const;
const AI_MODEL_CUSTOM = "__custom__";

function isPresetModel(m: string): m is (typeof AI_MODEL_PRESETS)[number] {
  return (AI_MODEL_PRESETS as readonly string[]).includes(m);
}

export function SettingsPage() {
  const mcpBaseId = useId();
  const mcpId = useId();
  const aiBaseId = useId();
  const aiKeyId = useId();
  const aiModelSelectId = useId();
  const aiModelCustomId = useId();
  const weightId = useId();
  const currentWeightId = useId();
  const amapKeyId = useId();
  const [amapWebKey, setAmapWebKey] = useState("");
  const [mcpBaseUrl, setMcpBaseUrl] = useState("");
  const [mcpToken, setMcpToken] = useState("");
  const [aiApiBaseUrl, setAiApiBaseUrl] = useState("");
  const [aiApiKey, setAiApiKey] = useState("");
  const [aiModel, setAiModel] = useState<string>(DEFAULT_AI_MODEL);
  const [showMcpToken, setShowMcpToken] = useState(false);
  const [showAiKey, setShowAiKey] = useState(false);
  const [initialWeightInput, setInitialWeightInput] = useState("");
  const [currentWeightInput, setCurrentWeightInput] = useState("");
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [themeMode, setThemeModeLocal] = useState<McFitThemeMode>("system");

  useEffect(() => {
    const s = loadMcFitSettings();
    setAmapWebKey(s.amapWebKey);
    setMcpBaseUrl(s.mcpBaseUrl);
    setMcpToken(s.mcpToken);
    setAiApiBaseUrl(s.aiApiBaseUrl);
    setAiApiKey(s.aiApiKey);
    setAiModel(s.aiModel || DEFAULT_AI_MODEL);
    setInitialWeightInput(
      s.initialWeightKg != null ? String(s.initialWeightKg) : "",
    );
    setCurrentWeightInput(
      s.currentWeightKg != null ? String(s.currentWeightKg) : "",
    );
    setThemeModeLocal(s.theme);
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
    const modelTrim = aiModel.trim();
    saveMcFitSettings({
      amapWebKey: amapWebKey.trim(),
      mcpBaseUrl: mcpBaseUrl.trim().replace(/\/+$/, "") || "",
      mcpToken: mcpToken.trim(),
      aiApiBaseUrl: aiApiBaseUrl.trim().replace(/\/+$/, "") || "",
      aiApiKey: aiApiKey.trim(),
      aiModel: modelTrim || DEFAULT_AI_MODEL,
      initialWeightKg,
      currentWeightKg,
      theme: themeMode,
    });
    setSavedAt(Date.now());
  }, [
    amapWebKey,
    mcpBaseUrl,
    mcpToken,
    aiApiBaseUrl,
    aiApiKey,
    aiModel,
    initialWeightInput,
    currentWeightInput,
    themeMode,
  ]);

  const onDevClearData = useCallback(() => {
    const ok = window.confirm(
      "将清空：签到、运动记录、饮食记入、今日 MCP 菜单。\n\n设置（Token、模型、体重等）会保留。\n\n页面将刷新，确定？",
    );
    if (!ok) {
      return;
    }
    clearAllAppDataExceptSettings();
    window.location.reload();
  }, []);

  return (
    <motion.div
      className="space-y-6"
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div>
        <h2 className="text-2xl font-black tracking-tight text-mcd-ink">外观</h2>
        <p className="mt-1 text-sm font-medium leading-relaxed text-mcd-ink-muted">
          浅色、深色，或跟随系统；点击后立即生效并写入本机（「保存全部」也会带上当前外观选项）。
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          {(
            [
              { m: "system" as const, label: "跟随系统", Icon: Monitor },
              { m: "light" as const, label: "浅色", Icon: Sun },
              { m: "dark" as const, label: "深色", Icon: Moon },
            ] as const
          ).map(({ m, label, Icon }) => {
            const on = themeMode === m;
            return (
              <button
                key={m}
                type="button"
                onClick={() => {
                  persistThemeMode(m);
                  setThemeModeLocal(m);
                }}
                className={[
                  "inline-flex items-center gap-2 rounded-2xl border px-3.5 py-2.5 text-sm font-extrabold transition active:scale-[0.99]",
                  on
                    ? "border-mcd-red/50 bg-mcd-gold/20 text-mcd-red ring-2 ring-mcd-red/20"
                    : "border-mcd-hairline bg-mcd-white text-mcd-ink hover:bg-mcd-list-row",
                ].join(" ")}
              >
                <Icon className="size-4 shrink-0" strokeWidth={2.2} aria-hidden />
                {label}
              </button>
            );
          })}
        </div>
      </div>

      <h2 className="text-2xl font-black tracking-tight text-mcd-ink">连接</h2>
      <p className="text-sm font-medium leading-relaxed text-mcd-ink-muted">
        配置高德选店、麦当劳 MCP 与 OpenAI 兼容的地址和密钥；数据保存在本机浏览器，由你在调用后端时一并传入。
      </p>

      <div className="overflow-hidden rounded-2xl border border-mcd-hairline bg-mcd-white p-3.5 sm:p-4">
        <div className="space-y-4">
          <div>
            <label
              htmlFor={amapKeyId}
              className="flex items-center gap-2 text-[0.95rem] font-extrabold text-mcd-ink"
            >
              <MapPin className="size-4 text-mcd-red" strokeWidth={2.2} aria-hidden />
              高德 Web 服务 Key
            </label>
            <p className="mt-1 text-xs font-medium text-mcd-ink-muted">
              用于周边搜索「仍在营业」的麦当劳门店（签到前自动选最近一家）。在{" "}
              <a
                href="https://lbs.amap.com/api/webservice/guide/create-project/get-key"
                target="_blank"
                rel="noreferrer"
                className="font-bold text-mcd-red underline decoration-mcd-red/30 underline-offset-2"
              >
                高德开放平台
              </a>{" "}
              创建应用并开启「Web 服务」；本地开发由 Vite 代理请求高德，避免浏览器跨域。
            </p>
            <input
              id={amapKeyId}
              name="amapWebKey"
              type="password"
              autoComplete="off"
              value={amapWebKey}
              onChange={(e) => setAmapWebKey(e.target.value)}
              placeholder="粘贴 Web 服务 Key"
              className="mt-2 w-full rounded-xl border border-mcd-hairline bg-mcd-canvas px-3 py-2.5 text-sm font-medium text-mcd-ink placeholder:text-mcd-ink-muted/50 focus:border-mcd-red/40 focus:outline-none focus:ring-2 focus:ring-mcd-red/15"
            />
          </div>

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
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-mcd-ink-muted hover:bg-black/5 hover:text-mcd-ink dark:hover:bg-white/10"
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
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-mcd-ink-muted hover:bg-black/5 hover:text-mcd-ink dark:hover:bg-white/10"
                aria-label={showAiKey ? "隐藏 API Key" : "显示 API Key"}
              >
                {showAiKey ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
          </div>

          <div className="border-t border-mcd-hairline pt-4">
            <label
              htmlFor={aiModelSelectId}
              className="flex items-center gap-2 text-[0.95rem] font-extrabold text-mcd-ink"
            >
              <Bot className="size-4 text-mcd-red" strokeWidth={2.2} aria-hidden />
              对话模型
            </label>
            <p className="mt-1 text-xs font-medium text-mcd-ink-muted">
              用于 MCP 编排的 OpenAI 兼容 Chat Completions 模型名；代理或第三方请填其实际 model id。
            </p>
            <select
              id={aiModelSelectId}
              value={isPresetModel(aiModel) ? aiModel : AI_MODEL_CUSTOM}
              onChange={(e) => {
                const v = e.target.value;
                if (v === AI_MODEL_CUSTOM) {
                  setAiModel("");
                } else {
                  setAiModel(v);
                }
              }}
              className="mt-2 w-full rounded-xl border border-mcd-hairline bg-mcd-canvas px-3 py-2.5 text-sm font-semibold text-mcd-ink focus:border-mcd-red/40 focus:outline-none focus:ring-2 focus:ring-mcd-red/15"
            >
              {AI_MODEL_PRESETS.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
              <option value={AI_MODEL_CUSTOM}>自定义…</option>
            </select>
            {!isPresetModel(aiModel) ? (
              <input
                id={aiModelCustomId}
                name="aiModelCustom"
                type="text"
                value={isPresetModel(aiModel) ? "" : aiModel}
                onChange={(e) => setAiModel(e.target.value)}
                placeholder="例如 deepseek-chat、claude-3-5-sonnet-20241022"
                className="mt-2 w-full rounded-xl border border-mcd-hairline bg-mcd-canvas px-3 py-2.5 text-sm font-medium text-mcd-ink placeholder:text-mcd-ink-muted/50 focus:border-mcd-red/40 focus:outline-none focus:ring-2 focus:ring-mcd-red/15"
                aria-label="自定义模型 id"
              />
            ) : null}
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

      {import.meta.env.DEV ? (
        <div className="rounded-2xl border border-dashed border-amber-700/45 bg-amber-50/90 p-4 shadow-sm dark:border-amber-500/40 dark:bg-amber-950/35">
          <h3 className="flex items-center gap-2 text-sm font-extrabold text-amber-950 dark:text-amber-100">
            <Trash2 className="size-4 shrink-0" strokeWidth={2.2} aria-hidden />
            开发
          </h3>
          <p className="mt-1.5 text-xs font-medium leading-relaxed text-amber-950/80 dark:text-amber-200/85">
            仅开发模式显示。清空签到、运动记录、饮食记入、今日 MCP 菜单等本地数据，<span className="font-extrabold">不删除</span>
            本页连接与身体设置。
          </p>
          <button
            type="button"
            onClick={onDevClearData}
            className="mt-3 inline-flex items-center justify-center gap-2 rounded-xl border border-amber-800/30 bg-mcd-white px-4 py-2.5 text-xs font-extrabold text-amber-950 shadow-sm transition hover:bg-amber-100/80 dark:border-amber-400/25 dark:text-amber-100 dark:hover:bg-amber-900/50"
          >
            <Trash2 className="size-3.5" strokeWidth={2.2} aria-hidden />
            清空测试数据（保留设置）
          </button>
        </div>
      ) : null}
    </motion.div>
  );
}
