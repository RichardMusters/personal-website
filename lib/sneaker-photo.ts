import { createHmac, timingSafeEqual } from "node:crypto";
import { lookup } from "node:dns/promises";
import { isIP } from "node:net";
import { request } from "node:https";

type PhotoRequest = { sku: string; urls: string[]; expires: number };

// Only URLs supplied by our search endpoint may be fetched by the photo endpoint.
export function maakFotoToken(sku: string | null, urls: string[]): string | null {
  const key = process.env.OPENAI_API_KEY;
  if (!key || !sku || !urls.length) return null;
  const payload = Buffer.from(JSON.stringify({ sku, urls: urls.slice(0, 2), expires: Date.now() + 15 * 60_000 })).toString("base64url");
  return `${payload}.${createHmac("sha256", key).update(payload).digest("base64url")}`;
}

export function leesFotoToken(token: string): PhotoRequest | null {
  const key = process.env.OPENAI_API_KEY;
  if (!key || token.length > 12000) return null;
  const [payload, signature, extra] = token.split(".");
  if (!payload || !signature || extra) return null;
  const expected = createHmac("sha256", key).update(payload).digest();
  const actual = Buffer.from(signature, "base64url");
  if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) return null;
  try {
    const data = JSON.parse(Buffer.from(payload, "base64url").toString()) as PhotoRequest;
    return typeof data.sku === "string" && Array.isArray(data.urls) && data.urls.length <= 2 &&
      data.urls.every(url => typeof url === "string") && data.expires > Date.now() ? data : null;
  } catch { return null; }
}

export function publiekeIPv4(ip: string): boolean {
  if (isIP(ip) !== 4) return false;
  const [a, b] = ip.split(".").map(Number);
  return !(a === 0 || a === 10 || a === 127 || a >= 224 ||
    (a === 100 && b >= 64 && b <= 127) || (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) || (a === 192 && [0, 168].includes(b)) ||
    (a === 198 && [18, 19, 51].includes(b)) || (a === 203 && b === 0));
}

function veiligeHttps(value: string, base?: string): URL | null {
  try {
    const url = new URL(value, base);
    return url.protocol === "https:" && !url.username && !url.password &&
      (!url.port || url.port === "443") && !isIP(url.hostname) && url.hostname.includes(".") ? url : null;
  } catch { return null; }
}

async function publiekAdres(url: URL) {
  const addresses = await lookup(url.hostname, { family: 4, all: true });
  if (!addresses.length || addresses.some(a => !publiekeIPv4(a.address))) throw new Error("Non-public host");
  return addresses[0].address;
}

async function haalPagina(url: URL, signal: AbortSignal, redirects = 0): Promise<{ html: string; url: string }> {
  const address = await publiekAdres(url);
  signal.throwIfAborted();
  // Pin the validated DNS address so a second lookup cannot redirect to a private network.
  const response = await new Promise<{ status: number; location?: string; html: string }>((resolve, reject) => {
    const req = request(url, { signal, family: 4, headers: { Accept: "text/html", "User-Agent": "SneakerPhoto/1.0" },
      lookup: (_hostname, _options, callback) => callback(null, address, 4),
    }, res => {
      const status = res.statusCode ?? 500;
      if (status >= 300 && status < 400) {
        res.resume(); resolve({ status, location: res.headers.location, html: "" }); return;
      }
      if (status !== 200 || !res.headers["content-type"]?.includes("text/html")) {
        res.resume(); reject(new Error("No HTML")); return;
      }
      const chunks: Buffer[] = [];
      let size = 0;
      res.on("data", (chunk: Buffer) => {
        size += chunk.length;
        if (size > 1_500_000) { req.destroy(new Error("Page too large")); return; }
        chunks.push(chunk);
      });
      res.on("end", () => resolve({ status, html: Buffer.concat(chunks).toString("utf8") }));
      res.on("error", reject);
    });
    req.on("error", reject);
    req.end();
  });
  if (response.location) {
    const next = veiligeHttps(response.location, url.href);
    if (!next || redirects >= 2) throw new Error("Invalid redirect");
    return haalPagina(next, signal, redirects + 1);
  }
  return { html: response.html, url: url.href };
}

const normaliseer = (value: string) => value.toLowerCase().replace(/[^a-z0-9]/g, "");
function decode(value: string): string {
  return value.replace(/&amp;/gi, "&").replace(/&quot;/gi, '"').replace(/&#39;|&apos;/gi, "'")
    .replace(/&#(x[0-9a-f]+|\d+);/gi, (match, code: string) => {
      const n = code[0].toLowerCase() === "x" ? parseInt(code.slice(1), 16) : Number(code);
      return n > 0 && n <= 0x10ffff ? String.fromCodePoint(n) : match;
    });
}

export function vindProductFoto(html: string, pageUrl: string, sku: string): string | null {
  const code = normaliseer(sku);
  if (code.length < 5) return null;
  function imageUrl(value: unknown): string | null {
    if (Array.isArray(value)) return value.map(imageUrl).find(Boolean) ?? null;
    if (value && typeof value === "object") return imageUrl((value as Record<string, unknown>).url ?? (value as Record<string, unknown>).contentUrl);
    return typeof value === "string" ? veiligeHttps(decode(value), pageUrl)?.href ?? null : null;
  }
  function product(value: unknown): string | null {
    if (Array.isArray(value)) return value.map(product).find(Boolean) ?? null;
    if (!value || typeof value !== "object") return null;
    const item = value as Record<string, unknown>;
    const types = Array.isArray(item["@type"]) ? item["@type"] : [item["@type"]];
    if (types.includes("Product") && [item.sku, item.mpn, item.productID].some(id => typeof id === "string" && normaliseer(id) === code)) {
      const image = imageUrl(item.image);
      if (image) return image;
    }
    // Do not take images from unrelated recommended products.
    return product(item["@graph"]) ?? product(item.mainEntity) ?? product(item.hasVariant);
  }
  for (const match of html.matchAll(/<script\b[^>]*type\s*=\s*["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)) {
    try { const image = product(JSON.parse(match[1])); if (image) return image; } catch { /* malformed shop metadata */ }
  }
  const meta = new Map<string, string>();
  for (const tag of html.matchAll(/<meta\b[^>]*>/gi)) {
    const attrs = new Map<string, string>();
    for (const attr of tag[0].matchAll(/([\w:-]+)\s*=\s*(?:"([^"]*)"|'([^']*)')/g)) attrs.set(attr[1].toLowerCase(), decode(attr[2] ?? attr[3]));
    const name = attrs.get("property") ?? attrs.get("name");
    if (name && attrs.has("content")) meta.set(name.toLowerCase(), attrs.get("content")!);
  }
  // OG images are only eligible when the page URL or its own metadata identifies this SKU.
  const identity = [pageUrl, meta.get("og:title"), meta.get("og:description"), meta.get("product:retailer_item_id")];
  return identity.some(v => v && normaliseer(v).includes(code))
    ? imageUrl(meta.get("og:image") ?? meta.get("twitter:image")) : null;
}

export async function zoekProductFoto(sku: string, urls: string[], signal: AbortSignal) {
  const candidates = await Promise.all(urls.map(async source => {
    try {
      const url = veiligeHttps(source);
      if (!url) return null;
      const page = await haalPagina(url, signal);
      const image = vindProductFoto(page.html, page.url, sku);
      if (!image) return null;
      await publiekAdres(new URL(image));
      return { url: image, bron: page.url };
    } catch { return null; }
  }));
  return candidates.find(Boolean) ?? null;
}
