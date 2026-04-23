import { ymdInBeijing } from "./exerciseEnergy";
import { sanitizeImageUrlList } from "./imageUrls";

const STORAGE_KEY = "mcfit_today_mcp_menu_v1";

export const TODAY_MENU_CHANGED = "mcfit-today-menu-changed";

export type McpMenuItemStatus = "pending" | "consumed" | "skipped";

export type McpMenuItem = {
  id: string;
  slotId: string;
  slotLabel: string;
  name: string;
  kcal: number;
  note?: string;
  /** MCP 返回的餐品图，可多张 */
  imageUrls?: string[];
  status: McpMenuItemStatus;
};

export type TodayMcpMenuState = {
  ymd: string;
  nearestStoreName?: string;
  nearestStoreDetail?: string;
  items: McpMenuItem[];
  rawAssistantMessage?: string;
  error?: string;
  fetchedAt?: number;
};

function loadRaw(): TodayMcpMenuState | null {
  if (typeof localStorage === "undefined") {
    return null;
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return null;
    }
    const p = JSON.parse(raw) as Partial<TodayMcpMenuState>;
    if (typeof p.ymd !== "string" || !Array.isArray(p.items)) {
      return null;
    }
    const items: McpMenuItem[] = p.items
      .filter(
        (it) =>
          typeof it === "object" &&
          it != null &&
          typeof (it as McpMenuItem).id === "string" &&
          typeof (it as McpMenuItem).slotId === "string" &&
          typeof (it as McpMenuItem).slotLabel === "string" &&
          typeof (it as McpMenuItem).name === "string" &&
          typeof (it as McpMenuItem).kcal === "number" &&
          ((it as McpMenuItem).status === "pending" ||
            (it as McpMenuItem).status === "consumed" ||
            (it as McpMenuItem).status === "skipped"),
      )
      .map((it) => {
        const m = it as McpMenuItem;
        const imgs = sanitizeImageUrlList(m.imageUrls);
        return {
          ...m,
          ...(imgs.length > 0 ? { imageUrls: imgs } : { imageUrls: undefined }),
        };
      });
    return {
      ymd: p.ymd,
      nearestStoreName: typeof p.nearestStoreName === "string" ? p.nearestStoreName : undefined,
      nearestStoreDetail: typeof p.nearestStoreDetail === "string" ? p.nearestStoreDetail : undefined,
      items,
      rawAssistantMessage:
        typeof p.rawAssistantMessage === "string" ? p.rawAssistantMessage : undefined,
      error: typeof p.error === "string" ? p.error : undefined,
      fetchedAt: typeof p.fetchedAt === "number" ? p.fetchedAt : undefined,
    };
  } catch {
    return null;
  }
}

export function loadTodayMcpMenu(): TodayMcpMenuState | null {
  const s = loadRaw();
  const today = ymdInBeijing();
  if (!s || s.ymd !== today) {
    return null;
  }
  return s;
}

export function saveTodayMcpMenu(state: TodayMcpMenuState): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  window.dispatchEvent(new CustomEvent(TODAY_MENU_CHANGED));
}

export function clearTodayMcpMenu(): void {
  localStorage.removeItem(STORAGE_KEY);
  window.dispatchEvent(new CustomEvent(TODAY_MENU_CHANGED));
}

export function updateMcpMenuItem(
  id: string,
  patch: Partial<Pick<McpMenuItem, "status">>,
): void {
  const s = loadRaw();
  const today = ymdInBeijing();
  if (!s || s.ymd !== today) {
    return;
  }
  const items = s.items.map((it) => (it.id === id ? { ...it, ...patch } : it));
  saveTodayMcpMenu({ ...s, items });
}

export function setMcpMenuError(ymd: string, message: string): void {
  const prev = loadRaw();
  const base: TodayMcpMenuState = prev?.ymd === ymd ? prev : { ymd, items: [] };
  saveTodayMcpMenu({ ...base, error: message, fetchedAt: Date.now() });
}
