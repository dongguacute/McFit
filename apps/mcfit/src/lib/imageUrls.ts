/** 校验并归一化可展示的 http(s) 图片地址，防 javascript: 等 */
export function sanitizeHttpImageUrl(s: string): string | null {
  const t = s.trim();
  if (!t) {
    return null;
  }
  try {
    const u = new URL(t);
    if (u.protocol !== "http:" && u.protocol !== "https:") {
      return null;
    }
    return u.toString();
  } catch {
    return null;
  }
}

/** 从 MCP / JSON 解析结果整理图片列表，去重并限制数量（允许多张展示图） */
export function sanitizeImageUrlList(raw: unknown, max = 8): string[] {
  if (!Array.isArray(raw)) {
    return [];
  }
  const out: string[] = [];
  for (const x of raw) {
    if (typeof x !== "string") {
      continue;
    }
    const u = sanitizeHttpImageUrl(x);
    if (u && !out.includes(u)) {
      out.push(u);
    }
    if (out.length >= max) {
      break;
    }
  }
  return out;
}
