import type { SneakerSuggestie } from "@/lib/sneaker-types";

export const runtime = "nodejs";
export const maxDuration = 10;

// Cached StockX-catalogus van pckt.sh (data max. 24 uur oud) — snel en goedkoop genoeg voor autocomplete.
const PCKT_URL = "https://api.pckt.sh/v1/catalog/stockx/search";
const MAX_SUGGESTIES = 8;
const CACHE_MS = 10 * 60 * 1000;

type PcktProduct = {
  id?: string;
  title?: string;
  brand?: string;
  model?: string;
  sku?: string;
  image_url?: string;
};

// --- In-memory cache per query (per serverless instance) ---
const cache = new Map<string, { data: SneakerSuggestie[]; verloopt: number }>();

export async function GET(req: Request) {
  const query = (new URL(req.url).searchParams.get("q") ?? "").trim().slice(0, 100);
  if (query.length < 2) return Response.json({ suggesties: [] });

  const sleutel = process.env.PCKT_API_KEY;
  if (!sleutel) return Response.json({ suggesties: [], fout: "PCKT_API_KEY ontbreekt" }, { status: 500 });

  const cacheKey = query.toLowerCase();
  const gecached = cache.get(cacheKey);
  if (gecached && gecached.verloopt > Date.now()) return Response.json({ suggesties: gecached.data });

  try {
    const res = await fetch(`${PCKT_URL}?${new URLSearchParams({ query, page: "1" })}`, {
      headers: { Authorization: `Bearer ${sleutel}`, "Content-Type": "application/json" },
      signal: AbortSignal.any([req.signal, AbortSignal.timeout(5000)]),
    });
    if (!res.ok) {
      console.error("pckt suggesties mislukt:", res.status, await res.text().catch(() => ""));
      return Response.json({ suggesties: [] }, { status: 502 });
    }

    const producten = (await res.json()) as PcktProduct[];
    const suggesties: SneakerSuggestie[] = (Array.isArray(producten) ? producten : [])
      .filter((p) => p.title)
      .slice(0, MAX_SUGGESTIES)
      .map((p) => ({
        id: p.id ?? p.sku ?? p.title!,
        titel: p.title!,
        merk: p.brand ?? null,
        sku: p.sku || null,
        afbeelding: p.image_url || null,
      }));

    cache.set(cacheKey, { data: suggesties, verloopt: Date.now() + CACHE_MS });
    return Response.json({ suggesties }, { headers: { "Cache-Control": "private, max-age=300" } });
  } catch {
    return Response.json({ suggesties: [] }, { status: 504 });
  }
}
