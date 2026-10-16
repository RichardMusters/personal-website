import { NextRequest, NextResponse } from "next/server";
import { maakFotoToken } from "@/lib/sneaker-photo";
import { leesZoekresultaat, sneakerSchema, veiligeUrl, type OpenAIResponse } from "@/lib/sneaker-openai";
import shopsJson from "@/config/shops.json";
import { buildSystemPrompt, type ShopConfig } from "@/lib/sneaker-prompt";
import type { SneakerResultaat, Aanbieding, Voorkeuren } from "@/lib/sneaker-types";

export const runtime = "nodejs";
export const maxDuration = 60;

const shops = shopsJson as ShopConfig;
const MODEL = process.env.OPENAI_MODEL ?? "gpt-6-luna";
const LIMIT_PER_DAG = Number(process.env.RATE_LIMIT_PER_DAY ?? 10);
const MAX_IMAGE_BASE64 = 3_000_000; // ~2,2 MB beeld; de client verkleint al
const TOEGESTANE_TYPES = ["image/jpeg", "image/png", "image/webp"];

const STANDAARD_VOORKEUREN: Voorkeuren = {
  bezorgland: "Nederland",
  maat: "45",
  maatSysteem: "EU",
  merkFilter: "Nike",
  maxPrijs: null,
  resaleToegestaan: false,
};


// --- Eenvoudige rate limit + cache (in-memory, per serverless instance) ---
const hits = new Map<string, { count: number; reset: number }>();
const cache = new Map<string, { data: SneakerResultaat; verloopt: number }>();
const DAG = 24 * 60 * 60 * 1000;

function isGelimiteerd(ip: string): boolean {
  const nu = Date.now();
  const h = hits.get(ip);
  if (!h || h.reset < nu) {
    hits.set(ip, { count: 1, reset: nu + DAG });
    return false;
  }
  h.count++;
  return h.count > LIMIT_PER_DAG;
}

// --- Domeinhulpjes ---
function domeinVan(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "").toLowerCase();
  } catch {
    return "";
  }
}
function matcht(domein: string, lijst: { domein: string }[]): boolean {
  return lijst.some((s) => domein === s.domein || domein.endsWith("." + s.domein));
}
function rangMatch(m: Aanbieding["matchZekerheid"]): number {
  return m === "exact" ? 0 : m === "waarschijnlijk" ? 1 : 2;
}
function rangMaat(m: Aanbieding["maatBeschikbaarheid"]): number {
  return m === "beschikbaar" ? 0 : m === "onzeker" ? 1 : 2;
}

export async function POST(req: NextRequest) {
  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json({ fout: "OPENAI_API_KEY ontbreekt op de server." }, { status: 500 });
  }

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "onbekend";
  if (isGelimiteerd(ip)) {
    return NextResponse.json(
      { fout: `Je hebt het maximum van ${LIMIT_PER_DAG} zoekopdrachten per dag bereikt. Probeer het morgen opnieuw.` },
      { status: 429 }
    );
  }

  let body: { query?: string; image?: { mimeType: string; data: string }; voorkeuren?: Partial<Voorkeuren> };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ fout: "Ongeldig verzoek." }, { status: 400 });
  }

  if (!body || typeof body !== "object" || (body.query !== undefined && typeof body.query !== "string")) {
    return NextResponse.json({ fout: "Ongeldig verzoek." }, { status: 400 });
  }
  const query = (body.query ?? "").trim().slice(0, 300);
  const image = body.image;
  const voorkeuren: Voorkeuren = { ...STANDAARD_VOORKEUREN, ...body.voorkeuren };

  if (!query && !image) {
    return NextResponse.json({ fout: "Voer een SKU of omschrijving in, of upload een foto." }, { status: 400 });
  }
  if (image && (!TOEGESTANE_TYPES.includes(image.mimeType) || typeof image.data !== "string" || !image.data || image.data.length > MAX_IMAGE_BASE64 || !/^[A-Za-z0-9+/]+={0,2}$/.test(image.data))) {
    return NextResponse.json({ fout: "Foto moet JPG, PNG of WebP zijn en kleiner dan 2 MB." }, { status: 400 });
  }

  // Cache alleen tekstzoekopdrachten (SKU's), niet foto's — voorkeuren horen bij de sleutel
  const cacheKey = !image ? `${query.toLowerCase()}::${JSON.stringify(voorkeuren)}` : null;
  if (cacheKey) {
    const c = cache.get(cacheKey);
    if (c && c.verloopt > Date.now()) return NextResponse.json(c.data);
  }

  const content: ({ type: "input_text"; text: string } | { type: "input_image"; image_url: string; detail: "auto" })[] = [
    { type: "input_text", text: query ? "Zoekopdracht van de bezoeker: " + query : "Identificeer deze sneaker en zoek aanbiedingen." },
  ];
  if (image) content.push({ type: "input_image", image_url: "data:" + image.mimeType + ";base64," + image.data, detail: "auto" });

  try {
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: { Authorization: "Bearer " + process.env.OPENAI_API_KEY, "Content-Type": "application/json" },
      signal: AbortSignal.any([req.signal, AbortSignal.timeout(50_000)]),
      cache: "no-store",
      body: JSON.stringify({
        model: MODEL,
        store: false,
        reasoning: { effort: "low" },
        instructions: buildSystemPrompt(shops, voorkeuren),
        input: [{ role: "user", content }],
        tools: [{ type: "web_search" }],
        tool_choice: "required",
        max_tool_calls: 3,
        include: ["web_search_call.action.sources"],
        max_output_tokens: 5000,
        text: { format: { type: "json_schema", name: "sneaker_resultaat", strict: true, schema: sneakerSchema } },
      }),
    });
    if (!response.ok) {
      console.error("OpenAI zoekdienst HTTP-status:", response.status);
      const status = response.status === 429 ? 429 : 502;
      return NextResponse.json({ fout: status === 429
        ? "De limiet van de zoekdienst is bereikt. Probeer het later opnieuw."
        : "De zoekdienst is tijdelijk niet beschikbaar. Controleer de OpenAI-configuratie op de server." }, { status });
    }
    const poging = leesZoekresultaat(await response.json() as OpenAIResponse);
    if (!poging) {
      return NextResponse.json({ fout: "Het zoekresultaat was onvolledig. Probeer het opnieuw." }, { status: 502 });
    }
    const { resultaat, bronnen, geopend } = poging;
    const bronUrls = new Set(bronnen.map((b) => b.url));

    // Hard filter: geblokkeerde domeinen en (indien niet toegestaan) resale eruit, voorkeur markeren, bron controleren
    const waarschuwingen: string[] = [];
    const aanbiedingen: Aanbieding[] = (resultaat.aanbiedingen ?? [])
      .map((a) => {
        const url = veiligeUrl(a.url);
        const domein = url ? domeinVan(url) : "";
        const bronGeverifieerd = !!url && bronUrls.has(url);
        const bevestigd = !!url && geopend.has(url) && a.bevestigd === true && a.prijs != null;
        const maatBeschikbaarheid = a.maatBeschikbaarheid === "beschikbaar" && !bevestigd ? "onzeker" as const : a.maatBeschikbaarheid;
        return {
          ...a,
          domein,
          bevestigd,
          maatBeschikbaarheid,
          voorkeur: matcht(domein, shops.voorkeur),
          bronGeverifieerd,
          bevestigdWeergave: bevestigd && maatBeschikbaarheid === "beschikbaar" && a.matchZekerheid === "exact",
        };
      })
      .filter((a) => {
        if (!a.domein || !a.bronGeverifieerd || a.maatBeschikbaarheid === "uitverkocht" || a.matchZekerheid === "andere_uitvoering") return false;
        if (matcht(a.domein, shops.geblokkeerd)) {
          waarschuwingen.push(`${a.domein} is weggelaten omdat deze winkel op de waarschuwingslijst staat.`);
          return false;
        }
        if (!voorkeuren.resaleToegestaan && (a.type === "resale" || matcht(a.domein, shops.resale))) {
          waarschuwingen.push(`${a.winkel} (resale) is weggelaten — resale staat uit in je voorkeuren.`);
          return false;
        }
        return true;
      })
      .sort((x, y) => {
        const matchVerschil = rangMatch(x.matchZekerheid) - rangMatch(y.matchZekerheid);
        if (matchVerschil !== 0) return matchVerschil;
        const maatVerschil = rangMaat(x.maatBeschikbaarheid) - rangMaat(y.maatBeschikbaarheid);
        if (maatVerschil !== 0) return maatVerschil;
        const prijsX = x.totaalprijs ?? x.prijs ?? Infinity;
        const prijsY = y.totaalprijs ?? y.prijs ?? Infinity;
        return prijsX - prijsY || Number(y.voorkeur) - Number(x.voorkeur);
      }).slice(0, 5);

    const data: SneakerResultaat = {
      ...resultaat,
      aanbiedingen,
      fotoToken: maakFotoToken(resultaat.sneaker.sku, aanbiedingen.filter(a => a.matchZekerheid === "exact").map(a => a.url)),
      besteMatchToelichting: null, // Server sorteert opnieuw; modeltoelichting kan naar een andere winkel verwijzen.
      bronnen,
      waarschuwingen,
      gecontroleerdOp: new Date().toISOString(),
    };
    // Geen lege/negatieve resultaten cachen — anders blokkeert één mislukte zoekpoging alle volgende
    // pogingen voor hetzelfde zoekterm, terwijl voorraad juist snel kan veranderen.
    if (cacheKey && data.gevonden && data.aanbiedingen.length > 0) {
      cache.set(cacheKey, { data, verloopt: Date.now() + 5 * 60 * 1000 });
    }

    return NextResponse.json(data);
  } catch (err: unknown) {
    if (err instanceof Error && ["TimeoutError", "AbortError"].includes(err.name)) {
      return NextResponse.json({ fout: "Het zoeken duurde te lang. Probeer een exacte productcode." }, { status: 504 });
    }
    console.error("OpenAI zoekdienst mislukt:", err instanceof Error ? err.name : "UnknownError");
    return NextResponse.json({ fout: "Zoeken mislukt. Probeer het opnieuw." }, { status: 500 });
  }
}
