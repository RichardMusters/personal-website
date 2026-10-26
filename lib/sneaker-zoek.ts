import { kiesFotoBronnen, maakFotoToken } from "@/lib/sneaker-photo";
import { controleerShopify } from "@/lib/sneaker-shopify";
import { leesZoekresultaat, sneakerSchema, veiligeUrl, type OpenAIResponse } from "@/lib/sneaker-openai";
import shopsJson from "@/config/shops.json";
import { buildSystemPrompt, type ShopConfig } from "@/lib/sneaker-prompt";
import type { SneakerResultaat, Aanbieding, Voorkeuren } from "@/lib/sneaker-types";

// Gedeelde zoeklogica: gebruikt door /api/sneaker-search (live) en /api/sneaker-plan/run (gepland).

const shops = shopsJson as ShopConfig;
const MODEL = process.env.OPENAI_MODEL ?? "gpt-6-luna";

export const STANDAARD_VOORKEUREN: Voorkeuren = {
  bezorgland: "Nederland",
  maat: "45",
  maatSysteem: "EU",
  merkFilter: "Nike",
  maxPrijs: null,
  resaleToegestaan: false,
};

export type ZoekUitkomst = { ok: true; data: SneakerResultaat } | { ok: false; status: number; fout: string };

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

const MAX_SHOPIFY_CHECKS = 8;

// Past aanbiedingen in place aan op basis van Shopify-voorraaddata. Niet-Shopify-winkels blijven ongewijzigd.
async function controleerViaShopify(aanbiedingen: Aanbieding[], sku: string | null, voorkeuren: Voorkeuren, signal?: AbortSignal) {
  const teControleren = aanbiedingen
    .filter((a) => a.domein && a.bronGeverifieerd && a.matchZekerheid !== "andere_uitvoering" && !matcht(a.domein, shops.geblokkeerd))
    .slice(0, MAX_SHOPIFY_CHECKS);
  const timeout = signal ? AbortSignal.any([signal, AbortSignal.timeout(6000)]) : AbortSignal.timeout(6000);

  await Promise.all(teControleren.map(async (a) => {
    const controle = await controleerShopify(a.url, sku, voorkeuren, timeout);
    if (!controle || controle.status === "onbekend") return;
    const maat = `${voorkeuren.maatSysteem} ${voorkeuren.maat}`;

    if (controle.status === "uitverkocht") {
      a.maatBeschikbaarheid = "uitverkocht"; // valt daarna uit de selectie
      a.bevestigdWeergave = false;
      return;
    }

    a.prijs ??= controle.prijs;
    if (a.totaalprijs == null && a.prijs != null) {
      a.totaalprijs = a.verzendkosten === "gratis" ? a.prijs : typeof a.verzendkosten === "number" ? a.prijs + a.verzendkosten : null;
    }
    a.maatBeschikbaarheid = "beschikbaar";
    // SKU is in de winkeldata teruggevonden → exact dezelfde schoen.
    if (sku) a.matchZekerheid = "exact";
    a.bevestigd = a.prijs != null;
    a.bevestigdWeergave = a.bevestigd && a.matchZekerheid === "exact";
    a.opmerking = [`Maat ${maat} op voorraad volgens de winkeldata.`, a.opmerking].filter(Boolean).join(" ");
  }));
}

const MAX_BRON_CHECKS = 6;

// Shopify-productpagina's die wel in de zoekresultaten staan maar die het model niet als aanbieding gaf
// (meestal omdat het de voorraad niet kon controleren). Alleen bij voorraad in de gevraagde maat + gevonden SKU toevoegen.
async function shopifyUitBronnen(bronnen: { url: string }[], bestaand: Aanbieding[], sku: string | null, voorkeuren: Voorkeuren, signal?: AbortSignal): Promise<Aanbieding[]> {
  if (!sku) return [];
  const bekendeDomeinen = new Set(bestaand.map((a) => a.domein));
  const perDomein = new Map<string, string>();
  for (const { url } of bronnen) {
    const domein = domeinVan(url);
    if (!domein || !/\/products\//.test(url) || bekendeDomeinen.has(domein) || perDomein.has(domein)) continue;
    if (matcht(domein, shops.geblokkeerd) || (!voorkeuren.resaleToegestaan && matcht(domein, shops.resale))) continue;
    perDomein.set(domein, url);
  }
  const timeout = signal ? AbortSignal.any([signal, AbortSignal.timeout(6000)]) : AbortSignal.timeout(6000);
  const maat = `${voorkeuren.maatSysteem} ${voorkeuren.maat}`;

  const resultaten = await Promise.all([...perDomein].slice(0, MAX_BRON_CHECKS).map(async ([domein, url]): Promise<Aanbieding | null> => {
    const controle = await controleerShopify(url, sku, voorkeuren, timeout);
    if (controle?.status !== "beschikbaar") return null;
    const bekend = [...shops.voorkeur, ...shops.resale].find((s) => domein === s.domein || domein.endsWith("." + s.domein));
    return {
      winkel: bekend?.naam ?? domein,
      url,
      prijs: controle.prijs,
      valuta: "EUR",
      verzendkosten: null,
      totaalprijs: null,
      verzendingBuitenEU: false,
      type: "nieuw",
      maatBeschikbaarheid: "beschikbaar",
      matchZekerheid: "exact",
      bevestigd: controle.prijs != null,
      opmerking: `Maat ${maat} op voorraad volgens de winkeldata. Verzending naar ${voorkeuren.bezorgland} niet gecontroleerd.`,
      domein,
      voorkeur: matcht(domein, shops.voorkeur),
      bronGeverifieerd: true,
      bevestigdWeergave: controle.prijs != null,
    };
  }));
  return resultaten.filter((a): a is Aanbieding => a !== null);
}

export async function zoekSneaker({
  query,
  image,
  voorkeuren,
  signal,
  maxAanroepen = 5,
}: {
  query: string;
  image?: { mimeType: string; data: string };
  voorkeuren: Voorkeuren;
  signal?: AbortSignal;
  /** Meer webaanroepen = meer productpagina's openen (trager, duurder). */
  maxAanroepen?: number;
}): Promise<ZoekUitkomst> {
  const content: ({ type: "input_text"; text: string } | { type: "input_image"; image_url: string; detail: "auto" })[] = [
    { type: "input_text", text: query ? "Zoekopdracht van de bezoeker: " + query : "Identificeer deze sneaker en zoek aanbiedingen." },
  ];
  if (image) content.push({ type: "input_image", image_url: "data:" + image.mimeType + ";base64," + image.data, detail: "auto" });

  try {
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: { Authorization: "Bearer " + process.env.OPENAI_API_KEY, "Content-Type": "application/json" },
      signal: signal ? AbortSignal.any([signal, AbortSignal.timeout(50_000)]) : AbortSignal.timeout(50_000),
      cache: "no-store",
      body: JSON.stringify({
        model: MODEL,
        store: false,
        reasoning: { effort: "low" },
        instructions: buildSystemPrompt(shops, voorkeuren, maxAanroepen),
        input: [{ role: "user", content }],
        tools: [{ type: "web_search" }],
        tool_choice: "required",
        max_tool_calls: maxAanroepen,
        include: ["web_search_call.action.sources"],
        max_output_tokens: 5000,
        text: { format: { type: "json_schema", name: "sneaker_resultaat", strict: true, schema: sneakerSchema } },
      }),
    });
    if (!response.ok) {
      console.error("OpenAI zoekdienst HTTP-status:", response.status);
      const status = response.status === 429 ? 429 : 502;
      return {
        ok: false,
        status,
        fout: status === 429
          ? "De limiet van de zoekdienst is bereikt. Probeer het later opnieuw."
          : "De zoekdienst is tijdelijk niet beschikbaar. Controleer de OpenAI-configuratie op de server.",
      };
    }
    const poging = leesZoekresultaat(await response.json() as OpenAIResponse);
    if (!poging) {
      return { ok: false, status: 502, fout: "Het zoekresultaat was onvolledig. Probeer het opnieuw." };
    }
    const { resultaat, bronnen, geopend } = poging;
    const bronUrls = new Set(bronnen.map((b) => b.url));

    // Hard filter: geblokkeerde domeinen en (indien niet toegestaan) resale eruit, voorkeur markeren, bron controleren
    const waarschuwingen: string[] = [];
    const kandidaten: Aanbieding[] = (resultaat.aanbiedingen ?? [])
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
      });

    // Extra check: bij Shopify-winkels de voorraad van de gevraagde maat zelf uitlezen (bevestigt of schrapt aanbiedingen).
    // Tegelijk: Shopify-winkels uit de zoekresultaten die het model niet als aanbieding noemde.
    const [, extra] = await Promise.all([
      controleerViaShopify(kandidaten, resultaat.sneaker.sku, voorkeuren, signal),
      shopifyUitBronnen(bronnen, kandidaten, resultaat.sneaker.sku, voorkeuren, signal),
    ]);
    kandidaten.push(...extra);

    const aanbiedingen = kandidaten
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
      // Een identificatiebron kan een foto hebben, ook zonder bestelbare aanbieding.
      fotoToken: maakFotoToken(resultaat.sneaker.sku, kiesFotoBronnen(
        resultaat.sneaker.sku,
        (resultaat.aanbiedingen ?? []).filter(a => a.matchZekerheid === "exact" && bronUrls.has(veiligeUrl(a.url) ?? "") && !matcht(domeinVan(a.url), shops.geblokkeerd)).map(a => a.url),
        bronnen.filter(b => !matcht(domeinVan(b.url), shops.geblokkeerd)).map(b => b.url),
      )),
      besteMatchToelichting: null, // Server sorteert opnieuw; modeltoelichting kan naar een andere winkel verwijzen.
      bronnen,
      waarschuwingen,
      gecontroleerdOp: new Date().toISOString(),
    };
    return { ok: true, data };
  } catch (err: unknown) {
    if (err instanceof Error && ["TimeoutError", "AbortError"].includes(err.name)) {
      return { ok: false, status: 504, fout: "Het zoeken duurde te lang. Probeer een exacte productcode." };
    }
    console.error("OpenAI zoekdienst mislukt:", err instanceof Error ? err.name : "UnknownError");
    return { ok: false, status: 500, fout: "Zoeken mislukt. Probeer het opnieuw." };
  }
}
