// app/components/editorial/sky/types.ts
// Shared type definitions for the sky-state system. No logic here — just shapes,
// so route.ts, weather.ts, and useSkyState.ts all agree on the same contracts.

export type HeaderData = {
  temperature?: number;
  weatherCode?: number;
  windSpeed?: number;
  windDirection?: number;
  waterLevel?: number;
  generatedAt?: string;
};

export type ConditionMode = "clear" | "cloud" | "fog" | "rain" | "snow" | "storm";

export type CelestialBody =
  | { kind: "sun"; cx: number; cy: number; r: number; rays: boolean }
  | { kind: "moon"; cx: number; cy: number; r: number; path: string };

export type PrecipMode = "rain" | "snow" | "storm" | null;
