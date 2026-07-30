// app/components/editorial/sky/useSkyState.ts
"use client";

import { useMemo } from "react";
import { solarTimes, moonPhase } from "./astronomy";
import { hash, compass, beaufort, condition } from "./weather";
import { SKY_WINDOW_COUNT } from "../RotterdamSkyline";
import type { CelestialBody, ConditionMode, HeaderData, PrecipMode } from "./types";

const LAT = 51.92;
const LON = 4.48;
const VIEWBOX_WIDTH = 1600;
const HORIZON_Y = 232;
const DUSK_LEAD_MINUTES = 25;
const MAX_LIT_RATIO = 0.34;
const LOCALE = "nl-NL";

export type SkyColophon = {
  month: string;
  weather: string | null;
  water: string | null;
  sun: string;
};

export type SkyState = {
  isDay: boolean;
  conditionMode: ConditionMode;
  body: CelestialBody;
  precipMode: PrecipMode;
  litWindows: ReadonlySet<number>;
  craneAngles: readonly [number, number, number];
  hazeFactor: number;
  colophon: SkyColophon;
};

function craneAngle(direction: number | null | undefined, index: number): number {
  if (!Number.isFinite(direction)) return 0;
  return (((direction as number) + (index ? 180 : 0)) % 360) * 0.055 - 10;
}

function moonCrescentPath(cx: number, cy: number, r: number, phase: number): string {
  const k = Math.cos(phase * 2 * Math.PI);
  const waxing = phase < 0.5;
  const rx = Math.abs(k) * r;
  const outer = waxing ? 1 : 0;
  const inner = k > 0 ? (waxing ? 0 : 1) : waxing ? 1 : 0;
  return (
    `M ${cx} ${cy - r} ` +
    `A ${r} ${r} 0 0 ${outer} ${cx} ${cy + r} ` +
    `A ${rx} ${r} 0 0 ${inner} ${cx} ${cy - r} Z`
  );
}

function formatWaterLevel(level: number): string {
  const value = level.toFixed(2).replace(".", ",");
  return `Maas ${level >= 0 ? "+" : "−"}${value.replace("-", "")} m NAP`;
}

export function useSkyState(weather: HeaderData | null, now: Date): SkyState {
  return useMemo(() => {
    const { sunrise, sunset } = solarTimes(now, LAT, LON);
    const isDay = now >= sunrise && now <= sunset;
    const mode = weather ? condition(weather.weatherCode).mode : "clear";

    const margin = VIEWBOX_WIDTH * 0.06;
    const span = VIEWBOX_WIDTH - margin * 2;
    let t: number;
    if (isDay) {
      t = (now.getTime() - sunrise.getTime()) / (sunset.getTime() - sunrise.getTime());
    } else {
      const nightStart = now > sunset ? sunset : new Date(sunset.getTime() - 86400000);
      const nightEnd = now > sunset ? new Date(sunrise.getTime() + 86400000) : sunrise;
      t = (now.getTime() - nightStart.getTime()) / (nightEnd.getTime() - nightStart.getTime());
    }
    t = Math.min(1, Math.max(0, t));

    const cx = margin + t * span;
    const arc = isDay ? HORIZON_Y * 0.72 : HORIZON_Y * 0.34;
    const cy = HORIZON_Y - Math.sin(t * Math.PI) * arc;
    const r = Math.max(7, VIEWBOX_WIDTH * 0.011);

    const body: CelestialBody = isDay
      ? { kind: "sun", cx, cy, r, rays: mode === "clear" }
      : { kind: "moon", cx, cy, r, path: moonCrescentPath(cx, cy, r, moonPhase(now)) };

    const dusk = new Date(sunset.getTime() - DUSK_LEAD_MINUTES * 60000);
    let litRatio = 0;
    if (now >= dusk || now <= sunrise) {
      const ref = now >= dusk ? dusk : new Date(dusk.getTime() - 86400000);
      const hoursDark = (now.getTime() - ref.getTime()) / 3600000;
      litRatio = Math.min(MAX_LIT_RATIO, (hoursDark / 4) * MAX_LIT_RATIO);
      if (now.getTime() > sunrise.getTime() - 3600000 && now <= sunrise) litRatio *= 0.4;
    }
    const daySeed = Math.floor(now.getTime() / 86400000);
    const litWindows = new Set<number>();
    for (let i = 0; i < SKY_WINDOW_COUNT; i++) {
      if (hash(daySeed * 7919 + i * 104729) < litRatio) litWindows.add(i);
    }

    const craneAngles: [number, number, number] = [
      craneAngle(weather?.windDirection, 0),
      craneAngle(weather?.windDirection, 1),
      craneAngle(weather?.windDirection, 2),
    ];

    const hazeFactor = mode === "fog" ? 0.4 : 1;
    const precipMode: PrecipMode = mode === "rain" || mode === "storm" || mode === "snow" ? mode : null;

    const month = new Intl.DateTimeFormat(LOCALE, { month: "long", year: "numeric" }).format(now);

    const weatherText =
      weather && Number.isFinite(weather.temperature)
        ? (() => {
            const { label } = condition(weather.weatherCode);
            const parts = [`${Math.round(weather.temperature as number)}°`, label];
            const dirLabel = compass(weather.windDirection);
            const bft = beaufort(weather.windSpeed);
            if (dirLabel && bft !== null) parts.push(bft === 0 ? "windstil" : `wind ${dirLabel} ${bft}`);
            return parts.join(" · ");
          })()
        : null;

    const water = Number.isFinite(weather?.waterLevel)
      ? formatWaterLevel(weather?.waterLevel as number)
      : null;

    const sun = `${isDay ? "zon onder" : "zon op"} ${new Intl.DateTimeFormat(LOCALE, {
      hour: "2-digit",
      minute: "2-digit",
    }).format(isDay ? sunset : sunrise)}`;

    return {
      isDay,
      conditionMode: mode,
      body,
      precipMode,
      litWindows,
      craneAngles,
      hazeFactor,
      colophon: { month, weather: weatherText, water, sun },
    };
  }, [weather, now]);
}
