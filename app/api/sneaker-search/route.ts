import { NextRequest, NextResponse } from "next/server";
import { STANDAARD_VOORKEUREN, zoekSneaker } from "@/lib/sneaker-zoek";
import type { SneakerResultaat, Voorkeuren } from "@/lib/sneaker-types";

export const runtime = "nodejs";
export const maxDuration = 60;

const LIMIT_PER_DAG = Number(process.env.RATE_LIMIT_PER_DAY ?? 10);
const MAX_IMAGE_BASE64 = 3_000_000; // ~2,2 MB beeld; de client verkleint al
const TOEGESTANE_TYPES = ["image/jpeg", "image/png", "image/webp"];


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

  const uitkomst = await zoekSneaker({ query, image, voorkeuren, signal: req.signal });
  if (!uitkomst.ok) return NextResponse.json({ fout: uitkomst.fout }, { status: uitkomst.status });
  const data = uitkomst.data;

  // Geen lege/negatieve resultaten cachen — anders blokkeert één mislukte zoekpoging alle volgende
  // pogingen voor hetzelfde zoekterm, terwijl voorraad juist snel kan veranderen.
  if (cacheKey && data.gevonden && data.aanbiedingen.length > 0) {
    cache.set(cacheKey, { data, verloopt: Date.now() + 5 * 60 * 1000 });
  }

  return NextResponse.json(data);
}
