# Levende Skyline (Zon/Maan, Ramen, Weer-Colofon) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the scroll-linked skyline background react to real sun/moon position, dusk window-lighting, wind-driven crane rotation, fog, and rain/snow — and show live month/weather/water-level/sun-time text in the hero colophon line — without changing the skyline's default (day, no wind, no precipitation) appearance.

**Architecture:** Pure astronomy/weather math is ported as framework-agnostic TypeScript functions. A new `useSkyState` React hook combines that math with fetched weather/water data into a single state object, which is passed as props into the existing `RotterdamSkyline` component (additively — new invisible window rects, restructured-but-visually-identical crane groups) and into two new small overlay components (sun/moon, precipitation). A new Next.js Route Handler aggregates Open-Meteo and Rijkswaterstaat data server-side, cached at the edge for 15 minutes.

**Tech Stack:** Next.js 16 (App Router), React 19, TypeScript (strict), CSS Modules. No test runner configured — verification is `npm run lint`, `npm run build`, and manual/curl checks (see Task 11).

---

## Reference: spec

Full design detail, including the live-verified Rijkswaterstaat station code (`hoekvanholland`) and
the corrected API request schema, lives in
`docs/superpowers/specs/2026-07-30-sky-header-weersegment-design.md`. Read it if anything below is
ambiguous.

## File Structure

- **Create:** `app/components/editorial/sky/types.ts` — shared type definitions
- **Create:** `app/components/editorial/sky/astronomy.ts` — sunrise/sunset + moon phase (pure)
- **Create:** `app/components/editorial/sky/weather.ts` — hash, compass, beaufort, weather-code→condition (pure)
- **Create:** `app/api/header-data/route.ts` — server-side Open-Meteo + Rijkswaterstaat aggregation
- **Create:** `app/components/editorial/sky/useSkyState.ts` — React hook combining the above into render-ready state
- **Create:** `app/components/editorial/sky/SkyOverlay.tsx` — `SkyCelestial` (sun/moon) + `SkyPrecipitation` (rain/snow)
- **Modify:** `app/components/editorial/Editorial.module.css` — new classes for windows, crane rotation, precipitation
- **Modify:** `app/components/editorial/RotterdamSkyline.tsx` — additive window rects + restructured (visually identical) crane groups + haze factor
- **Modify:** `app/components/editorial/Sections.tsx` — `EdHero` takes a `colophon` prop instead of hardcoded meta text
- **Modify:** `app/components/editorial/Editorial.tsx` — fetch weather, tick the clock, wire `useSkyState` into the render tree

---

### Task 1: Shared sky types

**Files:**
- Create: `app/components/editorial/sky/types.ts`

- [ ] **Step 1: Create the file**

```ts
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
```

- [ ] **Step 2: Verify**

Run: `npm run lint`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add app/components/editorial/sky/types.ts
git commit -m "Add shared sky-state type definitions"
```

---

### Task 2: Astronomy math (sunrise/sunset, moon phase)

**Files:**
- Create: `app/components/editorial/sky/astronomy.ts`

- [ ] **Step 1: Create the file**

```ts
// app/components/editorial/sky/astronomy.ts
// Sunrise/sunset (NOAA/SunCalc algorithm) and moon phase. Pure functions, no
// site-specific coordinates baked in — lat/lon are passed in by the caller.

const RAD = Math.PI / 180;
const J1970 = 2440588;
const J2000 = 2451545;

const toJulian = (date: Date) => date.valueOf() / 86400000 - 0.5 + J1970;
const fromJulian = (j: number) => new Date((j + 0.5 - J1970) * 86400000);

export type SolarTimes = {
  sunset: Date;
  sunrise: Date;
  polarDay: boolean;
  polarNight: boolean;
};

export function solarTimes(date: Date, lat: number, lon: number): SolarTimes {
  const days = toJulian(date) - J2000;
  const lw = -lon * RAD;
  const n = Math.round(days - 0.0009 - lw / (2 * Math.PI));
  const jStar = 0.0009 + lw / (2 * Math.PI) + n;
  const M = (357.5291 + 0.98560028 * jStar) * RAD;
  const C = (1.9148 * Math.sin(M) + 0.02 * Math.sin(2 * M) + 0.0003 * Math.sin(3 * M)) * RAD;
  const L = M + C + 102.9372 * RAD + Math.PI;
  const jTransit = J2000 + jStar + 0.0053 * Math.sin(M) - 0.0069 * Math.sin(2 * L);
  const dec = Math.asin(Math.sin(L) * Math.sin(23.4397 * RAD));
  const h = -0.833 * RAD;
  const cosW =
    (Math.sin(h) - Math.sin(lat * RAD) * Math.sin(dec)) / (Math.cos(lat * RAD) * Math.cos(dec));
  const w = Math.acos(Math.min(1, Math.max(-1, cosW)));
  const jSet =
    J2000 + 0.0009 + (w + lw) / (2 * Math.PI) + n + 0.0053 * Math.sin(M) - 0.0069 * Math.sin(2 * L);

  return {
    sunset: fromJulian(jSet),
    sunrise: fromJulian(jTransit - (jSet - jTransit)),
    polarDay: cosW < -1,
    polarNight: cosW > 1,
  };
}

export function moonPhase(date: Date): number {
  const reference = Date.UTC(2000, 0, 6, 18, 14);
  const synodic = 29.530588853;
  const elapsed = (date.valueOf() - reference) / 86400000;
  return (((elapsed % synodic) + synodic) % synodic) / synodic;
}
```

- [ ] **Step 2: Verify**

Run: `npm run lint`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add app/components/editorial/sky/astronomy.ts
git commit -m "Add astronomy math for sunrise, sunset, and moon phase"
```

---

### Task 3: Weather math (hash, compass, Beaufort, condition mapping)

**Files:**
- Create: `app/components/editorial/sky/weather.ts`

- [ ] **Step 1: Create the file**

```ts
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
```

- [ ] **Step 2: Verify**

Run: `npm run lint`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add app/components/editorial/sky/weather.ts
git commit -m "Add weather math for wind formatting and condition mapping"
```

---

### Task 4: `/api/header-data` route handler

**Files:**
- Create: `app/api/header-data/route.ts`

Uses the live-verified station `hoekvanholland` and the corrected Rijkswaterstaat request schema
(singular `Locatie`, nested `AquoPlusObservationMetadata`) found during design research — see the
spec's "Vooronderzoek" section for the `204`/`400` responses that led to this schema.

- [ ] **Step 1: Create the file**

```ts
// app/api/header-data/route.ts
// Server-side aggregation of weather (Open-Meteo) and Maas water level
// (Rijkswaterstaat) for the skyline header colophon. Cached at the edge for
// 15 minutes so visitors never wait on either external API.

import type { HeaderData } from "../../components/editorial/sky/types";

const LAT = 51.92;
const LON = 4.48;
const MAAS_STATION = "hoekvanholland";
const RWS_URL =
  "https://ddapi20-waterwebservices.rijkswaterstaat.nl/ONLINEWAARNEMINGENSERVICES/OphalenWaarnemingen";
const RWS_MISSING = 100000;

type OpenMeteoResponse = {
  current?: {
    temperature_2m?: number;
    weather_code?: number;
    wind_speed_10m?: number;
    wind_direction_10m?: number;
  };
};

async function fetchWeather(signal: AbortSignal): Promise<Partial<HeaderData>> {
  const url = new URL("https://api.open-meteo.com/v1/forecast");
  url.searchParams.set("latitude", String(LAT));
  url.searchParams.set("longitude", String(LON));
  url.searchParams.set("current", "temperature_2m,weather_code,wind_speed_10m,wind_direction_10m");
  url.searchParams.set("timezone", "Europe/Amsterdam");

  const res = await fetch(url, { signal });
  if (!res.ok) throw new Error(`Open-Meteo gaf ${res.status}`);
  const json: OpenMeteoResponse = await res.json();
  const current = json.current ?? {};

  return {
    temperature: current.temperature_2m,
    weatherCode: current.weather_code,
    windSpeed: current.wind_speed_10m,
    windDirection: current.wind_direction_10m,
  };
}

type RwsMeting = { Meetwaarde?: { Waarde_Numeriek?: number } };
type RwsSeries = { AquoMetadata?: { Eenheid?: { Code?: string } }; MetingenLijst?: RwsMeting[] };
type RwsResponse = { Succesvol?: boolean; WaarnemingenLijst?: RwsSeries[] };

async function fetchWaterLevel(signal: AbortSignal): Promise<Partial<HeaderData>> {
  const end = new Date();
  const begin = new Date(end.getTime() - 3 * 3600 * 1000);
  const iso = (d: Date) => d.toISOString().replace("Z", "+00:00");

  const body = {
    Locatie: { Code: MAAS_STATION },
    AquoPlusWaarnemingMetadata: {
      AquoMetadata: { Compartiment: { Code: "OW" }, Grootheid: { Code: "WATHTE" } },
      AquoPlusObservationMetadata: { ProcesType: "meting" },
    },
    Periode: { Begindatumtijd: iso(begin), Einddatumtijd: iso(end) },
  };

  const res = await fetch(RWS_URL, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
    signal,
  });

  if (res.status === 204) return {};
  if (!res.ok) throw new Error(`Rijkswaterstaat gaf ${res.status}`);

  const json: RwsResponse = await res.json();
  if (!json.Succesvol) return {};

  const series = json.WaarnemingenLijst?.[0];
  const unit = series?.AquoMetadata?.Eenheid?.Code ?? "cm";
  const readings = (series?.MetingenLijst ?? [])
    .map((m) => m.Meetwaarde?.Waarde_Numeriek)
    .filter((v): v is number => Number.isFinite(v) && Math.abs(v as number) < RWS_MISSING);

  const last = readings.at(-1);
  if (last === undefined) return {};

  const metres = unit.toLowerCase() === "cm" ? last / 100 : last;
  return { waterLevel: Number(metres.toFixed(2)) };
}

async function getHeaderData(): Promise<HeaderData> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 4000);

  try {
    const [weather, water] = await Promise.allSettled([
      fetchWeather(controller.signal),
      fetchWaterLevel(controller.signal),
    ]);

    return {
      ...(weather.status === "fulfilled" ? weather.value : {}),
      ...(water.status === "fulfilled" ? water.value : {}),
      generatedAt: new Date().toISOString(),
    };
  } finally {
    clearTimeout(timeout);
  }
}

export const revalidate = 900;

export async function GET() {
  const data = await getHeaderData();
  return new Response(JSON.stringify(data), {
    headers: {
      "content-type": "application/json",
      "cache-control": "public, max-age=0, s-maxage=900, stale-while-revalidate=3600",
    },
  });
}
```

- [ ] **Step 2: Verify statically**

Run: `npm run lint`
Expected: no errors.

Run: `npm run build`
Expected: succeeds, route appears in the build output as a dynamic/edge function (or static with
revalidate) for `/api/header-data`.

- [ ] **Step 3: Verify live**

Run: `npm run dev -- -p 3100` in the background, wait for it to serve (`curl -sf
http://localhost:3100 >/dev/null`), then:

```bash
curl -s http://localhost:3100/api/header-data
```

Expected: a JSON object containing at least `temperature`, `weatherCode`, `windSpeed`,
`windDirection`, `generatedAt`, and (assuming Rijkswaterstaat is reachable) `waterLevel` as a small
number like `1.1`. Stop the dev server afterward (`lsof -ti:3100 -sTCP:LISTEN | xargs -r kill` or the
Windows equivalent).

- [ ] **Step 4: Commit**

```bash
git add app/api/header-data/route.ts
git commit -m "Add /api/header-data route aggregating weather and water level"
```

---

### Task 5: CSS for windows, crane rotation, and precipitation

**Files:**
- Modify: `app/components/editorial/Editorial.module.css`

- [ ] **Step 1: Add the new classes**

Find the end of the file (after the last `@media (max-width: 640px)` block's closing `}`), and append:

```css

/* --- Levende skyline: ramen, kranen, neerslag ---------------------- */

.skyWindow {
  fill: var(--mint-deep);
  fill-opacity: 0;
  stroke: none;
  transition: fill-opacity 900ms ease-out;
}

.skyWindowLit {
  fill-opacity: 0.75;
}

.skyCraneJib {
  transition: transform 2400ms cubic-bezier(0.33, 1, 0.68, 1);
}

.skyDrop {
  stroke: var(--skyline-stroke);
  stroke-width: 0.6;
  opacity: 0.4;
  animation: skyFall 1.4s linear infinite;
}

.skyFlake {
  fill: var(--skyline-stroke);
  opacity: 0.35;
  animation: skyDrift 5s linear infinite;
}

.skyPrecipStorm .skyDrop {
  animation-duration: 0.85s;
  opacity: 0.55;
}

@keyframes skyFall {
  from { transform: translateY(-14%); }
  to   { transform: translateY(114%); }
}

@keyframes skyDrift {
  from { transform: translate(0, -14%); }
  to   { transform: translate(-6px, 114%); }
}

@media (prefers-reduced-motion: reduce) {
  .skyDrop,
  .skyFlake {
    animation: none;
  }
  .skyWindow,
  .skyCraneJib {
    transition: none;
  }
}
```

**Important:** `.skyWindow` explicitly sets `stroke: none`. The windows are added inside an existing
`<g stroke="var(--skyline-stroke)" ...>` group in `RotterdamSkyline.tsx` (Task 6) — without this
override, unlit windows would inherit a visible 1px outline and would NOT be invisible at rest,
breaking the "pixel-identical by default" requirement.

- [ ] **Step 2: Verify**

Run: `npm run lint`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add app/components/editorial/Editorial.module.css
git commit -m "Add CSS for sky windows, crane rotation, and precipitation"
```

---

### Task 6: RotterdamSkyline.tsx — additive windows, restructured cranes, haze

**Files:**
- Modify: `app/components/editorial/RotterdamSkyline.tsx`

This task ONLY adds new elements and wraps existing crane lines in a new (initially-identity)
transform group — every existing `<path>`/`<line>` stays byte-for-byte the same. At the default props
(`litWindows` empty, `craneAngles` all `0`, `hazeFactor` `1`), the rendered SVG must look pixel-identical
to the current version.

- [ ] **Step 1: Replace the entire file**

```tsx
// app/components/editorial/RotterdamSkyline.tsx
// Hairline silhouettes of recognizable Rotterdam buildings.
// Drawn faint and small as background texture, fades out as bridge fades in.

import styles from "./Editorial.module.css";

type WindowGroup = { x: number; width: number; floorYs: readonly number[] };

const WINDOW_GROUPS: readonly WindowGroup[] = [
  { x: 515, width: 40, floorYs: [105, 135, 165, 195] },
  { x: 565, width: 40, floorYs: [80, 110, 140, 170, 200] },
  { x: 715, width: 55, floorYs: [85, 105, 125, 145, 165, 185, 205] },
  { x: 775, width: 55, floorYs: [65, 85, 105, 145, 165, 185, 205] },
  { x: 840, width: 50, floorYs: [110, 130, 150, 170, 190, 210] },
  { x: 960, width: 40, floorYs: Array.from({ length: 18 }, (_, i) => 45 + i * 10) },
  { x: 1020, width: 45, floorYs: [95, 115, 135, 155, 175, 195, 215] },
];

const WINDOWS_PER_GAP = 2;
const WINDOW_WIDTH = 5;
const WINDOW_HEIGHT = 6;

type SkyWindow = { x: number; y: number; index: number };

const SKY_WINDOWS: readonly SkyWindow[] = WINDOW_GROUPS.flatMap(({ x, width, floorYs }) =>
  Array.from({ length: floorYs.length - 1 }, (_, gap) => {
    const top = floorYs[gap];
    const bottom = floorYs[gap + 1];
    const y = top + (bottom - top) / 2 - WINDOW_HEIGHT / 2;
    const slot = (width - WINDOW_WIDTH) / (WINDOWS_PER_GAP + 1);
    return Array.from({ length: WINDOWS_PER_GAP }, (_, w) => ({
      x: x + slot * (w + 1),
      y,
    }));
  }).flat()
).map((pos, index) => ({ ...pos, index }));

/** Exported so useSkyState.ts can hash exactly this many window indices — one source of truth. */
export const SKY_WINDOW_COUNT = SKY_WINDOWS.length;

const EMPTY_LIT_WINDOWS: ReadonlySet<number> = new Set();
const DEFAULT_CRANE_ANGLES: readonly [number, number, number] = [0, 0, 0];

type RotterdamSkylineProps = {
  progress: number;
  litWindows?: ReadonlySet<number>;
  craneAngles?: readonly [number, number, number];
  hazeFactor?: number;
};

export default function RotterdamSkyline({
  progress,
  litWindows = EMPTY_LIT_WINDOWS,
  craneAngles = DEFAULT_CRANE_ANGLES,
  hazeFactor = 1,
}: RotterdamSkylineProps) {
  const op = Math.max(0, 1 - progress * 1.6) * hazeFactor;
  return (
    <svg
      viewBox="0 0 1600 240"
      preserveAspectRatio="xMidYMax slice"
      style={{
        position: "absolute", left: 0, right: 0, top: 0,
        width: "100%", height: 240,
        opacity: op * 0.55,
        pointerEvents: "none",
      }}
      aria-hidden="true"
    >
      <g fill="none" stroke="var(--skyline-stroke)" strokeWidth="1" strokeLinejoin="miter">
        <line x1="0" y1="232" x2="1600" y2="232" stroke="var(--skyline-fill-light)" />

        {/* far left blocks */}
        <path d="M40 232 L40 200 L70 200 L70 188 L100 188 L100 210 L140 210 L140 232 Z" />
        <path d="M150 232 L150 178 L180 178 L180 232 Z" />
        <path d="M195 232 L195 195 L240 195 L240 232 Z" />

        {/* Markthal arch */}
        <path d="M270 232 L270 175 Q335 105 400 175 L400 232 Z" />
        <path d="M280 232 L280 195 L390 195 L390 232" stroke="var(--skyline-fill-light)" />

        <path d="M420 232 L420 200 L460 200 L460 232 Z" />
        <path d="M470 232 L470 175 L495 175 L495 232 Z" />

        {/* Delftse Poort — twin towers */}
        <path d="M515 232 L515 90 L555 90 L555 232 Z" />
        <path d="M565 232 L565 60 L605 60 L605 232 Z" />
        {[105,135,165,195].map((y) => (
          <line key={`dp-l-${y}`} x1="515" y1={y} x2="555" y2={y} stroke="var(--skyline-fill-light)" />
        ))}
        {[80,110,140,170,200].map((y) => (
          <line key={`dp-r-${y}`} x1="565" y1={y} x2="605" y2={y} stroke="var(--skyline-fill-light)" />
        ))}

        <path d="M620 232 L620 180 L660 180 L660 232 Z" />
        <path d="M670 232 L670 165 L695 165 L695 232 Z" />

        {/* De Rotterdam — three offset stacked towers */}
        <path d="M715 232 L715 70 L770 70 L770 232 Z" />
        <path d="M775 232 L775 50 L830 50 L830 130 L835 130 L835 232 Z" />
        <path d="M840 232 L840 95 L890 95 L890 232 Z" />
        {[85,105,125,145,165,185,205].map((y) => (
          <line key={`drA-${y}`} x1="715" y1={y} x2="770" y2={y} stroke="var(--skyline-fill-light)" />
        ))}
        {[65,85,105,145,165,185,205].map((y) => (
          <line key={`drB-${y}`} x1="775" y1={y} x2="830" y2={y} stroke="var(--skyline-fill-light)" />
        ))}
        {[110,130,150,170,190,210].map((y) => (
          <line key={`drC-${y}`} x1="840" y1={y} x2="890" y2={y} stroke="var(--skyline-fill-light)" />
        ))}

        <path d="M905 232 L905 195 L935 195 L935 232 Z" />

        {/* Maastoren */}
        <path d="M960 232 L960 30 L1000 30 L1000 232 Z" />
        <path d="M985 30 L985 10 L995 10 L995 30" />
        {Array.from({ length: 18 }).map((_, i) => (
          <line key={`m-${i}`} x1="960" y1={45 + i * 10} x2="1000" y2={45 + i * 10} stroke="var(--skyline-fill-light)" />
        ))}

        {/* Montevideo */}
        <path d="M1020 232 L1020 78 L1065 78 L1065 232 Z" />
        <path d="M1040 78 L1040 60 L1055 60 L1055 78" />
        {[95,115,135,155,175,195,215].map((y) => (
          <line key={`mv-${y}`} x1="1020" y1={y} x2="1065" y2={y} stroke="var(--skyline-fill-light)" />
        ))}

        <path d="M1080 232 L1080 180 L1120 180 L1120 232 Z" />
        <path d="M1130 232 L1130 195 L1160 195 L1160 232 Z" />
        <path d="M1170 232 L1170 165 L1200 165 L1200 232 Z" />

        {/* Cube houses cluster */}
        <g transform="translate(1220 200)">
          <rect x="-12" y="-12" width="24" height="24" transform="rotate(45)" />
          <rect x="18" y="-12" width="24" height="24" transform="rotate(45 30 0)" />
          <rect x="48" y="-12" width="24" height="24" transform="rotate(45 60 0)" />
        </g>

        {/* Harbor cranes — jib+stays isolated into their own group so they can
            rotate around the mast-top pivot; angle 0 is pixel-identical to a
            plain straight line. */}
        <g stroke="var(--skyline-stroke)">
          <line x1="1340" y1="232" x2="1340" y2="120" />
          <g
            className={styles.skyCraneJib}
            style={{ transformOrigin: "1340px 120px", transform: `rotate(${craneAngles[0]}deg)` }}
          >
            <line x1="1340" y1="120" x2="1395" y2="120" />
            <line x1="1340" y1="120" x2="1300" y2="135" />
            <line x1="1395" y1="120" x2="1390" y2="155" />
          </g>

          <line x1="1430" y1="232" x2="1430" y2="100" />
          <g
            className={styles.skyCraneJib}
            style={{ transformOrigin: "1430px 100px", transform: `rotate(${craneAngles[1]}deg)` }}
          >
            <line x1="1430" y1="100" x2="1495" y2="100" />
            <line x1="1430" y1="100" x2="1390" y2="115" />
            <line x1="1495" y1="100" x2="1490" y2="135" />
          </g>

          <line x1="1525" y1="232" x2="1525" y2="135" />
          <g
            className={styles.skyCraneJib}
            style={{ transformOrigin: "1525px 135px", transform: `rotate(${craneAngles[2]}deg)` }}
          >
            <line x1="1525" y1="135" x2="1580" y2="135" />
            <line x1="1525" y1="135" x2="1485" y2="150" />
            <line x1="1580" y1="135" x2="1575" y2="170" />
          </g>
        </g>

        <path d="M1280 232 L1280 200 L1310 200 L1310 232 Z" />

        {/* Lit windows — fill-opacity 0 and stroke:none by default, so they
            are completely invisible until litWindows marks them. */}
        <g>
          {SKY_WINDOWS.map((win) => (
            <rect
              key={`window-${win.index}`}
              x={win.x}
              y={win.y}
              width={WINDOW_WIDTH}
              height={WINDOW_HEIGHT}
              className={`${styles.skyWindow} ${litWindows.has(win.index) ? styles.skyWindowLit : ""}`}
            />
          ))}
        </g>
      </g>
    </svg>
  );
}
```

- [ ] **Step 2: Verify**

Run: `npm run lint`
Expected: no errors.

Run: `npm run build`
Expected: succeeds.

- [ ] **Step 3: Verify visual parity**

Run: `npm run dev -- -p 3100` in the background, wait for it to serve, then:

```bash
curl -s http://localhost:3100 | grep -o '<path d="M40 232[^"]*"' 
curl -s http://localhost:3100 | grep -c 'class="[^"]*skyWindow[^"]*"'
```

Expected: the first command still finds the original far-left-blocks path unchanged (proves existing
paths weren't touched); the second reports `94` (the total window count — 7 building groups × their
gap counts × 2 windows per gap). Stop the dev server afterward.

- [ ] **Step 4: Commit**

```bash
git add app/components/editorial/RotterdamSkyline.tsx
git commit -m "Add invisible window rects and rotatable crane jibs to the skyline"
```

---

### Task 7: `useSkyState` hook

**Files:**
- Create: `app/components/editorial/sky/useSkyState.ts`

- [ ] **Step 1: Create the file**

```ts
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

    const weatherText = weather
      ? (() => {
          const { label } = condition(weather.weatherCode);
          const parts = [`${Math.round(weather.temperature ?? 0)}°`, label];
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
```

- [ ] **Step 2: Verify**

Run: `npm run lint`
Expected: no errors.

Run: `npm run build`
Expected: succeeds (this hook isn't consumed anywhere yet — that's Task 10 — so no runtime check here).

- [ ] **Step 3: Commit**

```bash
git add app/components/editorial/sky/useSkyState.ts
git commit -m "Add useSkyState hook combining astronomy, weather, and window/crane state"
```

---

### Task 8: `SkyOverlay.tsx` — sun/moon and precipitation

**Files:**
- Create: `app/components/editorial/sky/SkyOverlay.tsx`

- [ ] **Step 1: Create the file**

```tsx
// app/components/editorial/sky/SkyOverlay.tsx
// Sun/moon over the horizon, and rain/snow hairlines — both purely decorative,
// layered inside the same sticky background viewport as the skyline and bridge.
// Same viewBox as RotterdamSkyline so the horizon lines up exactly.

import styles from "../Editorial.module.css";
import { hash } from "./weather";
import type { CelestialBody, PrecipMode } from "./types";

const VIEWBOX_WIDTH = 1600;
const VIEWBOX_HEIGHT = 240;
const HORIZON_Y = 232;

export function SkyCelestial({ body, progress }: { body: CelestialBody; progress: number }) {
  const op = Math.max(0, 1 - progress * 1.6);
  return (
    <svg
      viewBox={`0 0 ${VIEWBOX_WIDTH} ${VIEWBOX_HEIGHT}`}
      preserveAspectRatio="xMidYMax slice"
      style={{
        position: "absolute", left: 0, right: 0, top: 0,
        width: "100%", height: VIEWBOX_HEIGHT,
        opacity: op,
        pointerEvents: "none",
      }}
      aria-hidden="true"
    >
      {body.kind === "sun" ? (
        <g fill="none" stroke="var(--skyline-stroke)" strokeWidth="1">
          <circle cx={body.cx} cy={body.cy} r={body.r} />
          {body.rays &&
            Array.from({ length: 8 }, (_, i) => {
              const angle = i * (Math.PI / 4);
              return (
                <line
                  key={`sun-ray-${i}`}
                  x1={body.cx + Math.cos(angle) * (body.r * 1.4)}
                  y1={body.cy + Math.sin(angle) * (body.r * 1.4)}
                  x2={body.cx + Math.cos(angle) * (body.r * 1.9)}
                  y2={body.cy + Math.sin(angle) * (body.r * 1.9)}
                  strokeWidth="0.6"
                  strokeLinecap="round"
                />
              );
            })}
        </g>
      ) : (
        <g>
          <circle cx={body.cx} cy={body.cy} r={body.r} fill="none" stroke="var(--skyline-stroke)" strokeWidth="1" />
          <path d={body.path} fill="var(--skyline-stroke)" fillOpacity={0.82} />
        </g>
      )}
    </svg>
  );
}

export function SkyPrecipitation({ mode }: { mode: PrecipMode }) {
  if (!mode) return null;

  const count = mode === "snow" ? 44 : 80;
  const drops = Array.from({ length: count }, (_, i) => ({
    x: hash(i * 2654435761) * VIEWBOX_WIDTH,
    y: hash(i * 40503 + 11) * HORIZON_Y,
    delay: (hash(i * 7 + 3) * -1.6).toFixed(2),
  }));

  return (
    <svg
      viewBox={`0 0 ${VIEWBOX_WIDTH} ${VIEWBOX_HEIGHT}`}
      preserveAspectRatio="xMidYMax slice"
      style={{
        position: "absolute", left: 0, right: 0, top: 0,
        width: "100%", height: VIEWBOX_HEIGHT,
        pointerEvents: "none",
      }}
      aria-hidden="true"
    >
      <g className={mode === "storm" ? styles.skyPrecipStorm : undefined}>
        {drops.map((drop, i) =>
          mode === "snow" ? (
            <circle
              key={`flake-${i}`}
              cx={drop.x}
              cy={drop.y}
              r={1.1}
              className={styles.skyFlake}
              style={{ animationDelay: `${drop.delay}s` }}
            />
          ) : (
            <line
              key={`drop-${i}`}
              x1={drop.x}
              y1={drop.y}
              x2={drop.x - 2}
              y2={drop.y + HORIZON_Y * 0.075}
              className={styles.skyDrop}
              style={{ animationDelay: `${drop.delay}s` }}
            />
          )
        )}
      </g>
    </svg>
  );
}
```

- [ ] **Step 2: Verify**

Run: `npm run lint`
Expected: no errors.

Run: `npm run build`
Expected: succeeds.

- [ ] **Step 3: Commit**

```bash
git add app/components/editorial/sky/SkyOverlay.tsx
git commit -m "Add SkyCelestial and SkyPrecipitation overlay components"
```

---

### Task 9: `EdHero` takes a `colophon` prop

**Files:**
- Modify: `app/components/editorial/Sections.tsx`

- [ ] **Step 1: Replace the hardcoded meta line**

Find:

```tsx
export function EdHero() {
  return (
    <section className={styles.heroSection}>
      <div
        className={styles.heroMeta}
        style={{
          ...editorialStyles.mono,
          fontSize: 11,
          color: "var(--ink-3)",
          letterSpacing: 0.5,
          textTransform: "uppercase",
        }}
      >
        <span>No. 01 &middot; Rotterdam &middot; 51.92N 4.48E</span>
        <span>Editie / Mei 2026</span>
      </div>
```

Replace with:

```tsx
type HeroColophon = {
  month: string;
  weather: string | null;
  water: string | null;
  sun: string;
};

export function EdHero({ colophon }: { colophon: HeroColophon }) {
  const leftParts = ["No. 01", "Rotterdam", "51.92N 4.48E", colophon.water].filter(
    (part): part is string => Boolean(part)
  );
  const rightParts = [colophon.month, colophon.weather, colophon.sun].filter(
    (part): part is string => Boolean(part)
  );

  return (
    <section className={styles.heroSection}>
      <div
        className={styles.heroMeta}
        style={{
          ...editorialStyles.mono,
          fontSize: 11,
          color: "var(--ink-3)",
          letterSpacing: 0.5,
          textTransform: "uppercase",
        }}
      >
        <span>{leftParts.join(" · ")}</span>
        <span>{rightParts.join(" · ")}</span>
      </div>
```

Everything below this point in `EdHero` (the `heroGrid` with the title, intro paragraph, and quote
card) stays exactly as it is — only the `heroMeta` block and the function signature change.

- [ ] **Step 2: Verify**

Run: `npm run lint`
Expected: an error at the call site in `Editorial.tsx` (`<EdHero />` with no props) — this is EXPECTED
and will be fixed in Task 10. Confirm the error is specifically about the missing `colophon` prop and
nothing else is broken.

- [ ] **Step 3: Commit**

```bash
git add app/components/editorial/Sections.tsx
git commit -m "Make EdHero render a dynamic colophon instead of hardcoded meta text"
```

---

### Task 10: Wire everything into `Editorial.tsx`

**Files:**
- Modify: `app/components/editorial/Editorial.tsx`

This is the integration task — it fetches weather data, ticks the clock, computes sky state, and
renders the new overlay components plus the updated `EdHero`.

- [ ] **Step 1: Replace the entire file**

```tsx
// app/components/editorial/Editorial.tsx
"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import styles from "./Editorial.module.css";
import { lightTokens, darkTokens, editorialStyles } from "./tokens";
import RotterdamSkyline from "./RotterdamSkyline";
import Erasmusbrug from "./Erasmusbrug";
import { SkyCelestial, SkyPrecipitation } from "./sky/SkyOverlay";
import { useSkyState } from "./sky/useSkyState";
import type { HeaderData } from "./sky/types";
import {
  EdNav, EdHero, EdStrip, EdAbout, EdAiDev, EdProjects, EdNumbers, EdContact, DarkToggle,
} from "./Sections";

const WEATHER_REFRESH_MS = 15 * 60_000;
const CLOCK_TICK_MS = 60_000;

export default function Editorial() {
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const [progress, setProgress] = useState(0);
  const [dark, setDark] = useState(false);
  const [weather, setWeather] = useState<HeaderData | null>(null);
  const [now, setNow] = useState(() => new Date());

  // Reflect dark mode on <html> so globals.css can flip body bg + selection
  useEffect(() => {
    document.documentElement.dataset.theme = dark ? "dark" : "light";
  }, [dark]);

  // Track page scroll progress to drive the skyline → bridge crossfade
  useEffect(() => {
    const onScroll = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const p = max > 0 ? window.scrollY / max : 0;
      setProgress(p);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Fetch the weather/water colophon data once, then refresh every 15 minutes.
  // Fails silently — the header stays on its astronomical (sun/moon-only) state.
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const res = await fetch("/api/header-data", { headers: { accept: "application/json" } });
        if (!res.ok || cancelled) return;
        const json: HeaderData = await res.json();
        if (!cancelled) setWeather(json);
      } catch {
        // De header blijft staan op de astronomische stand.
      }
    };
    load();
    const reload = window.setInterval(load, WEATHER_REFRESH_MS);
    return () => {
      cancelled = true;
      window.clearInterval(reload);
    };
  }, []);

  // Re-paint the sun/moon/window state once a minute.
  useEffect(() => {
    const tick = window.setInterval(() => setNow(new Date()), CLOCK_TICK_MS);
    return () => window.clearInterval(tick);
  }, []);

  const sky = useSkyState(weather, now);
  const tokens = (dark ? darkTokens : lightTokens) as CSSProperties;

  return (
    <div
      ref={scrollRef}
      className={styles.root}
      style={{ ...tokens, ...editorialStyles.page } as CSSProperties}
    >
      {/* Sticky wrapper keeps the toggle pinned top-left of the viewport */}
      <div style={{ position: "sticky", top: 0, height: 0, zIndex: 50 }}>
        <DarkToggle dark={dark} onToggle={() => setDark(!dark)} />
      </div>

      {/* Skyline + bridge + sky overlay live in a fixed-viewport sticky
          overlay so they stay anchored as the user scrolls the page. */}
      <div style={{ position: "sticky", top: 0, height: 0, zIndex: 1, pointerEvents: "none" }}>
        <div
          className={styles.backgroundViewport}
          style={{
            position: "absolute", top: 0, left: 0, right: 0,
            pointerEvents: "none", overflow: "hidden",
          }}
        >
          <SkyCelestial body={sky.body} progress={progress} />
          <RotterdamSkyline
            progress={progress}
            litWindows={sky.litWindows}
            craneAngles={sky.craneAngles}
            hazeFactor={sky.hazeFactor}
          />
          <Erasmusbrug progress={progress} />
          <SkyPrecipitation mode={sky.precipMode} />
        </div>
      </div>

      <EdNav />
      <EdHero colophon={sky.colophon} />
      <EdStrip />
      <EdAbout />
      <EdAiDev />
      <EdProjects />
      <EdNumbers />
      <EdContact />
    </div>
  );
}
```

- [ ] **Step 2: Verify**

Run: `npm run lint`
Expected: no errors (the Task 9 error about the missing `colophon` prop is now resolved).

Run: `npm run build`
Expected: succeeds with no TypeScript errors.

- [ ] **Step 3: Commit**

```bash
git add app/components/editorial/Editorial.tsx
git commit -m "Wire sky state, weather fetch, and clock tick into Editorial"
```

---

### Task 11: End-to-end verification

**Files:** none (verification only)

- [ ] **Step 1: Static checks**

Run: `npm run lint`
Expected: no errors.

Run: `npm run build`
Expected: succeeds.

- [ ] **Step 2: Live checks**

Start the dev server in the background on a free port and wait for it:

```bash
npm run dev -- -p 3100 &
timeout 30 bash -c 'until curl -sf http://localhost:3100 >/dev/null; do sleep 1; done'
```

Then:

```bash
curl -s http://localhost:3100/api/header-data
curl -s http://localhost:3100 | grep -o 'No\. 01[^<]*'
curl -s http://localhost:3100 | grep -c 'skyWindow'
curl -s http://localhost:3100 | grep -o 'skyCraneJib'
```

Expected:
- `/api/header-data` returns JSON with `temperature`, `weatherCode`, `windSpeed`, `windDirection`,
  `generatedAt`, and (if Rijkswaterstaat is reachable) `waterLevel`.
- The left colophon line contains `No. 01 · Rotterdam · 51.92N 4.48E`, optionally followed by
  `· Maas ...` if `waterLevel` was present in the API response.
- The window-rect count grep returns a number ≥ 94 (94 unlit `skyWindow` occurrences, plus more if any
  happen to also carry the `skyWindowLit` class at the time of the check).
- `skyCraneJib` is found at least 3 times (one per crane).

Stop the dev server: `lsof -ti:3100 -sTCP:LISTEN | xargs -r kill` (or the Windows equivalent used
earlier in this project).

- [ ] **Step 3: Report to the user for manual browser QA**

Give the user a fresh local dev URL and ask them to check, in their own browser:
- Dark/light toggle still works and the colophon text is legible in both themes.
- The skyline still looks visually identical to before at a glance (no stray visible window outlines,
  no rotated cranes at rest).
- Resize to mobile width (~400px) — the colophon lines wrap/stack sensibly, no horizontal overflow.
- (Optional, hard to verify live) if the user happens to check near dusk, some windows should start
  lighting up; if it's raining/snowing in Rotterdam, hairlines should appear over the skyline.

No commit for this task — it's verification only.

## Self-Review Notes

- **Spec coverage:** Task 4 implements the corrected Rijkswaterstaat schema and `hoekvanholland`
  station from the spec's "Vooronderzoek" section. Task 6 implements the additive-window /
  restructured-crane approach agreed in the "SVG-aanpak" clarifying question. Task 5's `stroke: none`
  on `.skyWindow` is the specific fix that guarantees the "pixel-identical by default" hard requirement
  survives the fact that windows live inside a `stroke`-carrying ancestor `<g>`. Task 9/10 implement the
  colophon segment replacement exactly as described (month + sun always available client-side, weather
  gated on the fetch, water gated on both the fetch and RWS actually returning a reading).
- **Type consistency:** `SkyState.colophon` (Task 7) and `HeroColophon` (Task 9) have the identical
  shape (`month: string; weather: string | null; water: string | null; sun: string`) — checked
  side-by-side; `Editorial.tsx` (Task 10) passes `sky.colophon` directly into `<EdHero colophon={...}>`
  with no transformation needed, which only type-checks because the shapes genuinely match.
  `SKY_WINDOW_COUNT` (Task 6) is imported and used as the loop bound in Task 7 — no duplicated magic
  number between the two files.
- **Placeholder scan:** all code blocks are complete, copy-pasteable files/diffs; no TBD markers.
