import { sanitizeHttpImageUrl, sanitizeImageUrlList } from "./imageUrls";

export type ParsedCheckinMenu = {
  nearestStoreName?: string;
  nearestStoreDetail?: string;
  items: {
    slotId: string;
    slotLabel: string;
    name: string;
    kcal: number;
    note?: string;
    imageUrls: string[];
  }[];
};

function isRecord(x: unknown): x is Record<string, unknown> {
  return typeof x === "object" && x != null;
}

/** 将中文/弯引号等替换为 ASCII 双引号，减少模型输出导致的 JSON.parse 失败 */
function normalizeJsonQuotes(s: string): string {
  return s.replace(/[\u201c\u201d\u201e\u201f\u2033\u2036]/g, '"').replace(/[\u2018\u2019\u201a\u201b\u2032\u2035]/g, "'");
}

/**
 * 从 startIdx 起截取花括号平衡的一段（忽略字符串内的括号）。
 */
function sliceBalancedObject(src: string, startIdx: number): string | null {
  if (src[startIdx] !== "{") return null;
  let depth = 0;
  let inString = false;
  let escape = false;
  for (let j = startIdx; j < src.length; j++) {
    const c = src[j]!;
    if (escape) {
      escape = false;
      continue;
    }
    if (inString) {
      if (c === "\\") escape = true;
      else if (c === '"') inString = false;
      continue;
    }
    if (c === '"') {
      inString = true;
      continue;
    }
    if (c === "{") depth++;
    else if (c === "}") {
      depth--;
      if (depth === 0) return src.slice(startIdx, j + 1);
    }
  }
  return null;
}

function* balancedObjectCandidates(text: string): Generator<string> {
  for (let i = 0; i < text.length; i++) {
    if (text[i] !== "{") continue;
    const chunk = sliceBalancedObject(text, i);
    if (chunk && chunk.length > 2) yield chunk;
  }
}

/** 去掉部分模型在正文外交织的推理标签，避免干扰 JSON 定位 */
function stripReasoningTags(s: string): string {
  return s
    .replace(/<think>[\s\S]*?<\/redacted_thinking>/gi, "")
    .replace(
      /<(think|thought|analysis|tool_analysis)>\s*[\s\S]*?<\/\1>/gi,
      "",
    )
    .replace(/<thinking>[\s\S]*?<\/thinking>/gi, "")
    .replace(/<reasoning>[\s\S]*?<\/reasoning>/gi, "");
}

function collectJsonStringCandidates(message: string): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  const push = (s: string) => {
    const t = s.trim();
    if (!t || seen.has(t)) return;
    seen.add(t);
    out.push(t);
  };

  for (const m of message.matchAll(/```(?:json)?\s*([\s\S]*?)```/gi)) {
    if (m[1]) push(m[1]);
  }
  push(message);
  for (const sub of balancedObjectCandidates(message)) {
    push(sub);
  }
  const t = message.trim();
  const start = t.indexOf("{");
  const end = t.lastIndexOf("}");
  if (start >= 0 && end > start) push(t.slice(start, end + 1));

  return out;
}

function tryParseJsonObject(s: string): Record<string, unknown> | null {
  const attempts = [s.trim(), normalizeJsonQuotes(s.trim())];
  for (const raw of attempts) {
    try {
      const v = JSON.parse(raw);
      return isRecord(v) ? v : null;
    } catch {
      /* try next */
    }
  }
  return null;
}

export function extractCheckinMenuJson(message: string): ParsedCheckinMenu {
  const candidates = collectJsonStringCandidates(
    stripReasoningTags(message.replace(/^\uFEFF/, "")),
  );
  let obj: Record<string, unknown> | null = null;
  for (const c of candidates) {
    const r = tryParseJsonObject(c);
    if (r && Array.isArray(r.items)) {
      obj = r;
      break;
    }
  }
  if (!obj) {
    for (const c of candidates) {
      const r = tryParseJsonObject(c);
      if (r) {
        obj = r;
        break;
      }
    }
  }
  if (!obj) {
    throw new Error("模型未返回可解析的 JSON");
  }

  const nearestStoreName =
    typeof obj.nearestStoreName === "string" ? obj.nearestStoreName : undefined;
  const nearestStoreDetail =
    typeof obj.nearestStoreDetail === "string" ? obj.nearestStoreDetail : undefined;
  const rawItems = obj.items;
  if (!Array.isArray(rawItems)) {
    throw new Error("JSON 缺少 items 数组");
  }

  const items: ParsedCheckinMenu["items"] = [];
  for (const row of rawItems) {
    if (!isRecord(row)) {
      continue;
    }
    const slotId =
      typeof row.slotId === "string"
        ? row.slotId
        : typeof row.slotId === "number" && Number.isFinite(row.slotId)
          ? String(row.slotId)
          : "";
    const slotLabel =
      typeof row.slotLabel === "string"
        ? row.slotLabel
        : typeof row.slotLabel === "number" && Number.isFinite(row.slotLabel)
          ? String(row.slotLabel)
          : "";
    const name = typeof row.name === "string" ? row.name : "";
    let kcal = Number.NaN;
    if (typeof row.kcal === "number" && Number.isFinite(row.kcal)) {
      kcal = Math.round(row.kcal * 10) / 10;
    } else if (typeof row.kcal === "string") {
      const n = Number.parseFloat(row.kcal.replace(/,/g, "").replace(/千卡|kcal/gi, "").trim());
      if (Number.isFinite(n)) kcal = Math.round(n * 10) / 10;
    }
    const note = typeof row.note === "string" ? row.note : undefined;
    let imageUrls = sanitizeImageUrlList(row.imageUrls);
    if (typeof row.imageUrl === "string") {
      const one = sanitizeHttpImageUrl(row.imageUrl);
      if (one && !imageUrls.includes(one)) {
        imageUrls = [one, ...imageUrls].slice(0, 8);
      }
    }
    if (!slotId || !name || !Number.isFinite(kcal)) {
      continue;
    }
    items.push({ slotId, slotLabel: slotLabel || slotId, name, kcal, note, imageUrls });
  }

  if (items.length === 0) {
    throw new Error("JSON items 为空或字段无效");
  }

  return { nearestStoreName, nearestStoreDetail, items };
}
