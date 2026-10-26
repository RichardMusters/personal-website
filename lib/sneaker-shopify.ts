import { haalVeiligeJson } from "@/lib/sneaker-photo";
import type { Voorkeuren } from "@/lib/sneaker-types";

// Extra controle na de AI-zoekactie: veel sneakerwinkels draaien op Shopify en geven per maat de voorraad vrij
// via <productpagina>.js. Daarmee bevestigen we aanbiedingen die het model niet zelf kon controleren.

type ShopifyVariant = { title?: string; option1?: string | null; option2?: string | null; option3?: string | null; available?: boolean; price?: number; sku?: string | null };
type ShopifyProduct = { title?: string; handle?: string; description?: string; options?: ({ name?: string } | string)[]; variants?: ShopifyVariant[] };

export type ShopifyControle =
  | { status: "beschikbaar"; prijs: number | null }
  | { status: "uitverkocht" }
  | { status: "onbekend" }; // wel Shopify, maar maat of SKU niet eenduidig te controleren

const normaliseer = (v: string) => v.toLowerCase().replace(/[^a-z0-9]/g, "");

// https://winkel.nl/nl/products/naam?variant=1 → https://winkel.nl/nl/products/naam.js
export function shopifyJsonUrl(productUrl: string): string | null {
  try {
    const url = new URL(productUrl);
    const match = url.pathname.match(/^(.*\/products\/[^/]+?)(?:\.js|\.json)?\/?$/);
    return match ? `${url.origin}${match[1]}.js` : null;
  } catch {
    return null;
  }
}

// Maatlabels zoals "45", "EU 45", "45 1/3", "US 11 / EU 45", "44,5" → maten per maatsysteem.
// Een kaal getal telt alleen als EU wanneer het ≥ 30 is; kleine kale getallen kunnen UK of US zijn en tellen niet mee.
export function leesMaten(label: string): { EU: number[]; US: number[] } {
  const maten = { EU: [] as number[], US: [] as number[] };
  const tekst = label.toLowerCase().replace(/,/g, ".").replace(/½/g, ".5").replace(/\s+1\/2/g, ".5");
  // Splitsen op "|", " - " en "/" — maar niet op de "/" in een breuk als "45 1/3".
  for (const deel of tekst.split(/\||\s-\s|(?<!\d)\/|\/(?!\d)/)) {
    const getal = deel.match(/\d+(?:\.\d+)?(?:\s*\d\/3)?/);
    if (!getal) continue;
    const waarde = parseFloat(getal[0].replace(/\s*1\/3/, ".33").replace(/\s*2\/3/, ".67"));
    // "US 11", "US11" en "11 US" herkennen, maar niet "plus" o.i.d.
    const label = (code: string) => new RegExp(`(^|[^a-z])${code}(?![a-z])`).test(deel);
    if (["uk", "cm", "mx", "wmn", "wmns", "w"].some(label)) continue;
    if (label("us")) maten.US.push(waarde);
    else if (label("eu") || label("fr") || waarde >= 30) maten.EU.push(waarde);
  }
  return maten;
}

function maatMatcht(label: string, voorkeuren: Voorkeuren): boolean {
  const gezocht = parseFloat(voorkeuren.maat.replace(",", "."));
  if (isNaN(gezocht)) return false;
  return leesMaten(label)[voorkeuren.maatSysteem].some((m) => Math.abs(m - gezocht) < 0.01);
}

function maatOptieIndex(product: ShopifyProduct): number {
  const namen = (product.options ?? []).map((o) => (typeof o === "string" ? o : o.name ?? "").toLowerCase());
  const index = namen.findIndex((n) => /maat|size|taille|gr(ö|o|oe)(ß|ss)e|talla|taglia|storlek|størrelse/.test(n));
  return index >= 0 ? index : namen.length === 1 ? 0 : -1;
}

export function beoordeelProduct(product: ShopifyProduct, sku: string | null, voorkeuren: Voorkeuren): ShopifyControle {
  const varianten = product.variants ?? [];
  if (!varianten.length) return { status: "onbekend" };

  // SKU moet in handle, titel, beschrijving of variant-SKU voorkomen, anders weten we niet zeker dat het dezelfde schoen is.
  if (sku) {
    const code = normaliseer(sku);
    const teksten = [product.handle, product.title, product.description, ...varianten.map((v) => v.sku)].filter(Boolean) as string[];
    if (!teksten.some((t) => normaliseer(t).includes(code))) return { status: "onbekend" };
  }

  const optie = maatOptieIndex(product);
  if (optie < 0) return { status: "onbekend" };
  const passend = varianten.filter((v) => {
    const label = [v.option1, v.option2, v.option3][optie] ?? v.title ?? "";
    return maatMatcht(label, voorkeuren);
  });
  if (!passend.length) return { status: "onbekend" };

  const beschikbaar = passend.find((v) => v.available);
  if (!beschikbaar) return { status: "uitverkocht" };
  // Shopify .js geeft prijzen in centen.
  return { status: "beschikbaar", prijs: typeof beschikbaar.price === "number" ? beschikbaar.price / 100 : null };
}

/** null = geen Shopify-winkel of niet op te halen; dan blijft de aanbieding zoals het model hem gaf. */
// Valuta van de winkel (uit /cart.js). De .js-prijzen bevatten geen valuta; een UK- of US-winkel rekent niet in euro.
async function winkelValuta(productUrl: string, signal: AbortSignal): Promise<string | null> {
  try {
    const cart = (await haalVeiligeJson(`${new URL(productUrl).origin}/cart.js`, signal)) as { currency?: string };
    return typeof cart?.currency === "string" ? cart.currency.toUpperCase() : null;
  } catch {
    return null;
  }
}

export async function controleerShopify(productUrl: string, sku: string | null, voorkeuren: Voorkeuren, signal: AbortSignal): Promise<ShopifyControle | null> {
  const jsonUrl = shopifyJsonUrl(productUrl);
  if (!jsonUrl) return null;
  try {
    const [product, valuta] = await Promise.all([haalVeiligeJson(jsonUrl, signal) as Promise<ShopifyProduct>, winkelValuta(productUrl, signal)]);
    if (!product || !Array.isArray(product.variants)) return null;
    const controle = beoordeelProduct(product, sku, voorkeuren);
    // Alleen europrijzen overnemen; bij een andere of onbekende valuta de prijs weglaten.
    if (controle.status === "beschikbaar" && valuta !== "EUR") return { status: "beschikbaar", prijs: null };
    return controle;
  } catch {
    return null;
  }
}
