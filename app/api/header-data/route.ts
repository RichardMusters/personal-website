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
