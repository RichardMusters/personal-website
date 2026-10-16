import type { SneakerResultaat } from "./sneaker-types";

const text = { type: "string" };
const nullableText = { type: ["string", "null"] };
const money = { type: ["number", "null"], minimum: 0 };
const bool = { type: "boolean" };
const choice = (...values: string[]) => ({ type: "string", enum: values });
const object = (properties: Record<string, unknown>) => ({
  type: "object", properties, required: Object.keys(properties), additionalProperties: false,
});

export const sneakerSchema = object({
  gevonden: bool,
  zekerheid: choice("hoog", "middel", "laag"),
  sneaker: object({ merk: nullableText, model: nullableText, colorway: nullableText,
    sku: nullableText, releasedatum: nullableText, retailprijs: money, omschrijving: nullableText }),
  besteMatchToelichting: nullableText,
  alternatieven: { type: "array", maxItems: 3, items: object({ model: text, sku: nullableText }) },
  aanbiedingen: { type: "array", maxItems: 5, items: object({
    winkel: text, url: text, prijs: money, valuta: choice("EUR"),
    verzendkosten: { anyOf: [money, { const: "gratis", type: "string" }] },
    totaalprijs: money, verzendingBuitenEU: bool, type: choice("nieuw", "resale"),
    maatBeschikbaarheid: choice("beschikbaar", "uitverkocht", "onzeker"),
    matchZekerheid: choice("exact", "waarschijnlijk", "andere_uitvoering"),
    bevestigd: bool, opmerking: nullableText,
  }) },
  tips: { type: "array", maxItems: 3, items: text },
});

type SearchOutput = {
  type: string;
  status?: string;
  action?: { type: string; url?: string; sources?: { url: string; title?: string }[] };
  content?: { type: string; text?: string; annotations?: { type: string; url?: string; title?: string }[] }[];
};
export type OpenAIResponse = { status: string; output: SearchOutput[] };

export function veiligeUrl(value: string): string | null {
  try {
    const url = new URL(value);
    if (!["https:", "http:"].includes(url.protocol) || url.username || url.password) return null;
    url.hash = "";
    return url.href;
  } catch { return null; }
}

export function leesZoekresultaat(response: OpenAIResponse) {
  if (response.status !== "completed" || !Array.isArray(response.output)) return null;
  const tekst = response.output.flatMap((item) => item.type === "message" ? item.content ?? [] : [])
    .filter((part) => part.type === "output_text").map((part) => part.text ?? "").join("");
  let resultaat: SneakerResultaat;
  try { resultaat = JSON.parse(tekst); } catch { return null; }
  if (!resultaat || typeof resultaat.gevonden !== "boolean" || !resultaat.sneaker ||
      !Array.isArray(resultaat.aanbiedingen) || !Array.isArray(resultaat.tips)) return null;
  const bronnen = new Map<string, { titel: string; url: string }>();
  const geopend = new Set<string>();
  function voegToe(url?: string, titel?: string) {
    const veilig = url && veiligeUrl(url);
    if (veilig) bronnen.set(veilig, { titel: titel || new URL(veilig).hostname, url: veilig });
  }
  for (const item of response.output) {
    if (item.type === "web_search_call" && item.status === "completed") {
      for (const bron of item.action?.sources ?? []) voegToe(bron.url, bron.title);
      if (item.action?.type === "open_page" && item.action.url) {
        const url = veiligeUrl(item.action.url);
        if (url) { geopend.add(url); voegToe(url); }
      }
    }
    for (const part of item.content ?? []) {
      for (const citation of part.annotations ?? []) {
        if (citation.type === "url_citation") voegToe(citation.url, citation.title);
      }
    }
  }
  return { resultaat, bronnen: [...bronnen.values()], geopend };
}
