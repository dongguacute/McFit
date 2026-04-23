import { loadMcFitSettings, saveMcFitSettings, type McFitThemeMode } from "./mcfitSettings";

export type { McFitThemeMode };

let mediaCleanup: (() => void) | null = null;

function effectiveDark(mode: McFitThemeMode): boolean {
  if (mode === "dark") {
    return true;
  }
  if (mode === "light") {
    return false;
  }
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

export function applyDocumentTheme(mode: McFitThemeMode): void {
  const root = document.documentElement;
  const dark = effectiveDark(mode);
  root.classList.toggle("dark", dark);
  root.style.colorScheme = dark ? "dark" : "light";
}

function bindSystemThemeListener(mode: McFitThemeMode): void {
  if (mediaCleanup) {
    mediaCleanup();
    mediaCleanup = null;
  }
  if (mode !== "system") {
    return;
  }
  const mq = window.matchMedia("(prefers-color-scheme: dark)");
  const onChange = () => applyDocumentTheme("system");
  mq.addEventListener("change", onChange);
  mediaCleanup = () => mq.removeEventListener("change", onChange);
}

/** 首屏前调用：从本地设置应用 `html.dark` 并监听系统主题（当为 `system` 时） */
export function initDocumentTheme(): void {
  const mode = loadMcFitSettings().theme;
  applyDocumentTheme(mode);
  bindSystemThemeListener(mode);
}

/** 切换主题并写入 `mcfit_settings_v1` */
export function setThemeMode(mode: McFitThemeMode): void {
  const s = loadMcFitSettings();
  saveMcFitSettings({ ...s, theme: mode });
  applyDocumentTheme(mode);
  bindSystemThemeListener(mode);
}
