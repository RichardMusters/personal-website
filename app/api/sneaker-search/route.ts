import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import shopsJson from "@/config/shops.json";
import { buildSystemPrompt, type ShopConfig } from "@/lib/sneaker-prompt";
import type { SneakerResultaat, Aanbieding, Voorkeuren } from "@/lib/sneaker-types";

export const runtime = "nodejs";
export const maxDuration = 60;

const shops = shopsJson as ShopConfig;
const MODEL = process.env.GEMINI_MODEL ?? "gemini-3.8-flash";
const LIMIT_PER_DAG = Number(process.env.RATE_LIMIT_PER_DAY ?? 10);
const MAX_IMAGE_BASE64 = 3_000_000; // ~2,2 MB beeld; de client verkleint al
const TOEGESTANE_TYPES = ["image/jpeg", "image/png", "image/webp"];

const STANDAARD_VOORKEUREN: Voorkeuren = {
  bezorgland: "Nederland",
  maat: "45",
  merkFilter: "Nike",
  maxPrijs: null,
  resaleToegestaan: false,
};

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

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
function parseJson(tekst: string): SneakerResultaat | null {
  const start = tekst.indexOf("{");
  const eind = tekst.lastIndexOf("}");
  if (start === -1 || eind === -1) return null;
  try {
    return JSON.parse(tekst.slice(start, eind + 1));
  } catch {
    return null;
  }
}

function rangMatch(m: Aanbieding["matchZekerheid"]): number {
  return m === "exact" ? 0 : m === "waarschijnlijk" ? 1 : 2;
}
function rangMaat(m: Aanbieding["maatBeschikbaarheid"]): number {
  return m === "beschikbaar" ? 0 : m === "onzeker" ? 1 : 2;
}

export async function POST(req: NextRequest) {
  if (!process.env.GEMINI_API_KEY) {
    return NextResponse.json({ fout: "GEMINI_API_KEY ontbreekt op de server." }, { status: 500 });
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

  const query = (body.query ?? "").trim().slice(0, 300);
  const image = body.image;
  const voorkeuren: Voorkeuren = { ...STANDAARD_VOORKEUREN, ...body.voorkeuren };

  if (!query && !image) {
    return NextResponse.json({ fout: "Voer een SKU of omschrijving in, of upload een foto." }, { status: 400 });
  }
  if (image && (!TOEGESTANE_TYPES.includes(image.mimeType) || image.data.length > MAX_IMAGE_BASE64)) {
    return NextResponse.json({ fout: "Foto moet JPG, PNG of WebP zijn en kleiner dan 2 MB." }, { status: 400 });
  }

  // Cache alleen tekstzoekopdrachten (SKU's), niet foto's — voorkeuren horen bij de sleutel
  const cacheKey = !image ? `${query.toLowerCase()}::${JSON.stringify(voorkeuren)}` : null;
  if (cacheKey) {
    const c = cache.get(cacheKey);
    if (c && c.verloopt > Date.now()) return NextResponse.json(c.data);
  }

  const parts: ({ text: string } | { inlineData: { mimeType: string; data: string } })[] = [];
  if (image) parts.push({ inlineData: { mimeType: image.mimeType, data: image.data } });
  parts.push({
    text: query
      ? `Zoekopdracht van de bezoeker: ${query}`
      : "Identificeer de sneaker op deze foto en zoek waar hij te koop is.",
  });

  try {
    const response = await ai.models.generateContent({
      model: MODEL,
      contents: [{ role: "user", parts }],
      config: {
        systemInstruction: buildSystemPrompt(shops, voorkeuren),
        tools: [{ googleSearch: {} }],
        temperature: 0.2,
      },
    });

    const resultaat = parseJson(response.text ?? "");
    if (!resultaat) {
      return NextResponse.json({ fout: "Het zoekresultaat kon niet worden gelezen. Probeer het opnieuw." }, { status: 502 });
    }

    // Bronnen die Gemini echt via Google Search heeft gebruikt.
    // De uri is vaak een Google-redirect; de title bevat meestal het domein.
    const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks ?? [];
    const bronnen = chunks
      .filter((c) => c.web?.uri)
      .map((c) => ({ titel: c.web?.title ?? "", url: c.web?.uri ?? "" }));
    const bronDomeinen = new Set(
      bronnen.flatMap((b) => [b.titel.replace(/^www\./, "").toLowerCase(), domeinVan(b.url)]).filter(Boolean)
    );

    // Hard filter: geblokkeerde domeinen en (indien niet toegestaan) resale eruit, voorkeur markeren, bron controleren
    const waarschuwingen: string[] = [];
    const aanbiedingen: Aanbieding[] = (resultaat.aanbiedingen ?? [])
      .map((a) => {
        const domein = domeinVan(a.url);
        return {
          ...a,
          domein,
          voorkeur: matcht(domein, shops.voorkeur),
          bronGeverifieerd: [...bronDomeinen].some((d) => d === domein || d.endsWith("." + domein) || domein.endsWith("." + d)),
          bevestigdWeergave: a.bevestigd === true && a.maatBeschikbaarheid === "beschikbaar" && a.matchZekerheid === "exact",
        };
      })
      .filter((a) => {
        if (!a.domein) return false;
        if (matcht(a.domein, shops.geblokkeerd)) {
          waarschuwingen.push(`${a.domein} is weggelaten omdat deze winkel op de waarschuwingslijst staat.`);
          return false;
        }
        if (!voorkeuren.resaleToegestaan && a.type === "resale") {
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
        if (x.voorkeur !== y.voorkeur) return x.voorkeur ? -1 : 1;
        const prijsX = x.totaalprijs ?? x.prijs ?? Infinity;
        const prijsY = y.totaalprijs ?? y.prijs ?? Infinity;
        return prijsX - prijsY;
      });

    const data: SneakerResultaat = {
      ...resultaat,
      aanbiedingen,
      bronnen,
      waarschuwingen,
      gecontroleerdOp: new Date().toISOString(),
    };
    if (cacheKey) cache.set(cacheKey, { data, verloopt: Date.now() + 6 * 60 * 60 * 1000 });

    return NextResponse.json(data);
  } catch (err: unknown) {
    console.error("Gemini-fout:", err);
    const status = (err as { status?: number })?.status;
    if (status === 429) {
      return NextResponse.json(
        { fout: "De gratis limiet van de zoekdienst is voor nu bereikt. Probeer het later opnieuw." },
        { status: 429 }
      );
    }
    return NextResponse.json({ fout: "Zoeken mislukt. Probeer het opnieuw." }, { status: 500 });
  }
}
