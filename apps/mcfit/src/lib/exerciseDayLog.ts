import { loadMcFitSettings, weightKgForCalorieEstimate } from "./mcfitSettings";
import { kcalFromMet, ymdInBeijing, type ExerciseEntryDef } from "./exerciseEnergy";

const STORAGE_KEY = "mcfit_exercise_day_log_v1";

export type WorkoutLogEntry = {
  id: string;
  ymd: string;
  exerciseId: string;
  name: string;
  minutes: number;
  kcal: number;
  createdAt: number;
};

function loadAll(): WorkoutLogEntry[] {
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
    return p
      .map((row) => row as WorkoutLogEntry)
      .filter(
        (e) =>
          typeof e.id === "string" &&
          typeof e.ymd === "string" &&
          typeof e.exerciseId === "string" &&
          typeof e.name === "string" &&
          typeof e.minutes === "number" &&
          typeof e.kcal === "number" &&
          typeof e.createdAt === "number",
      );
  } catch {
    return [];
  }
}

function saveAll(list: WorkoutLogEntry[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}

export function loadWorkoutLogs(): WorkoutLogEntry[] {
  return loadAll().sort((a, b) =>
    a.ymd === b.ymd ? b.createdAt - a.createdAt : b.ymd.localeCompare(a.ymd),
  );
}

export function appendWorkoutForToday(
  exercise: ExerciseEntryDef,
  minutes: number,
  weightKgOverride?: number,
): WorkoutLogEntry {
  const s = loadMcFitSettings();
  const w =
    typeof weightKgOverride === "number" && Number.isFinite(weightKgOverride) && weightKgOverride > 0
      ? weightKgOverride
      : weightKgForCalorieEstimate(s);
  const kcal = kcalFromMet(exercise.met, w, minutes);
  const ymd = ymdInBeijing();
  const entry: WorkoutLogEntry = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    ymd,
    exerciseId: exercise.id,
    name: exercise.name,
    minutes,
    kcal,
    createdAt: Date.now(),
  };
  const next = [entry, ...loadAll()];
  saveAll(next);
  return entry;
}

export function deleteWorkoutLog(id: string): void {
  saveAll(loadAll().filter((e) => e.id !== id));
}
