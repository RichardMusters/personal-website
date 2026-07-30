// app/components/editorial/sky/weather.ts
// Deterministic noise, wind formatting, and WMO weather-code translation.
// Pure functions, no React/DOM.

import type { ConditionMode } from "./types";

export function hash(seed: number): number {
  let h = seed >>> 0;
  h ^= h << 13;
  h ^= h >>> 17;
  h ^= h << 5;
  return (h >>> 0) / 4294967295;
}

const COMPASS = [
  "N", "NNO", "NO", "ONO", "O", "OZO", "ZO", "ZZO",
  "Z", "ZZW", "ZW", "WZW", "W", "WNW", "NW", "NNW",
] as const;

export function compass(degrees: number | null | undefined): string | null {
  if (!Number.isFinite(degrees)) return null;
  return COMPASS[Math.round((degrees as number) / 22.5) % 16];
}

export function beaufort(kmh: number | null | undefined): number | null {
  if (!Number.isFinite(kmh)) return null;
  const limits = [1, 5, 11, 19, 28, 38, 49, 61, 74, 88, 102, 117];
  for (let i = 0; i < limits.length; i++) {
    if ((kmh as number) < limits[i]) return i;
  }
  return 12;
}

const CONDITION_MAP: Record<number, [ConditionMode, string]> = {
  0: ["clear", "onbewolkt"],
  1: ["clear", "licht bewolkt"],
  2: ["cloud", "half bewolkt"],
  3: ["cloud", "bewolkt"],
  45: ["fog", "mist"],
  48: ["fog", "aanvriezende mist"],
  51: ["rain", "lichte motregen"],
  53: ["rain", "motregen"],
  55: ["rain", "dichte motregen"],
  56: ["rain", "ijzel"],
  57: ["rain", "ijzel"],
  61: ["rain", "lichte regen"],
  63: ["rain", "regen"],
  65: ["rain", "zware regen"],
  66: ["rain", "ijzel"],
  67: ["rain", "ijzel"],
  71: ["snow", "lichte sneeuw"],
  73: ["snow", "sneeuw"],
  75: ["snow", "zware sneeuw"],
  77: ["snow", "sneeuwkorrels"],
  80: ["rain", "buien"],
  81: ["rain", "buien"],
  82: ["rain", "zware buien"],
  85: ["snow", "sneeuwbuien"],
  86: ["snow", "sneeuwbuien"],
  95: ["storm", "onweer"],
  96: ["storm", "onweer met hagel"],
  99: ["storm", "onweer met hagel"],
};

export function condition(code: number | null | undefined): { mode: ConditionMode; label: string } {
  const [mode, label] = CONDITION_MAP[code ?? -1] ?? ["cloud", "bewolkt"];
  return { mode, label };
}
