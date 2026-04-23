import { ymdInBeijing } from "./exerciseEnergy";

const STORAGE_KEY = "mcfit_check_in_v1";

function loadYmds(): string[] {
  if (typeof localStorage === "undefined") {
    return [];
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return [];
    }
    const p = JSON.parse(raw) as unknown;
    if (!Array.isArray(p)) {
      return [];
    }
    return p.filter((x): x is string => typeof x === "string" && /^\d{4}-\d{2}-\d{2}$/.test(x));
  } catch {
    return [];
  }
}

function saveYmds(list: string[]): void {
  const uniq = [...new Set(list)].sort((a, b) => a.localeCompare(b));
  localStorage.setItem(STORAGE_KEY, JSON.stringify(uniq));
}

/** 上海日历日「今天」 */
export function todayYmdShanghai(): string {
  return ymdInBeijing();
}

function addDaysYmd(ymd: string, deltaDays: number): string {
  const [y, mo, d] = ymd.split("-").map(Number);
  const dt = new Date(Date.UTC(y, mo - 1, d));
  dt.setUTCDate(dt.getUTCDate() + deltaDays);
  return ymdInBeijing(dt);
}

/**
 * 从 `fromYmd` 起向前（往过去）数连续出现在签到表里的天数。
 */
function streakBackFrom(fromYmd: string, set: Set<string>): number {
  let ymd = fromYmd;
  let n = 0;
  for (;;) {
    if (!set.has(ymd)) {
      break;
    }
    n += 1;
    ymd = addDaysYmd(ymd, -1);
  }
  return n;
}

export type CheckInStreakInfo = {
  checkedToday: boolean;
  /** 若今日已签：含今日；若未签：为截至昨日的连续天数 */
  streakDays: number;
};

export function loadCheckInStreakInfo(): CheckInStreakInfo {
  const set = new Set(loadYmds());
  const today = todayYmdShanghai();
  const checkedToday = set.has(today);
  if (checkedToday) {
    return { checkedToday: true, streakDays: streakBackFrom(today, set) };
  }
  const yesterday = addDaysYmd(today, -1);
  return { checkedToday: false, streakDays: streakBackFrom(yesterday, set) };
}

export function checkInForToday(): void {
  const today = todayYmdShanghai();
  const list = loadYmds();
  if (list.includes(today)) {
    return;
  }
  saveYmds([...list, today]);
}
