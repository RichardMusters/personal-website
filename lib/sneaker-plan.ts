import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import { createClient, type RedisClientType } from "redis";
import type { GeplandeZoekactie } from "@/lib/sneaker-types";

// Geplande zoekacties: opslag in Upstash Redis, timing via Upstash QStash, meldingen via Telegram.
// Alles via de REST-API's, zodat er geen extra dependencies nodig zijn.

const BEWAARTERMIJN_S = 30 * 24 * 60 * 60;
const LIJST_KEY = "sneaker-plannen";

// --- Toegangscode ---
export function codeKlopt(code: string | null): boolean {
  const verwacht = process.env.PLAN_CODE;
  if (!verwacht || !code) return false;
  const a = Buffer.from(code);
  const b = Buffer.from(verwacht);
  return a.length === b.length && timingSafeEqual(a, b);
}

// --- Redis ---
// REDIS_URL (Vercel Redis-integratie) gaat via een TCP-client; anders de Upstash REST-API
// (KV_REST_API_* via de Marketplace, of UPSTASH_REDIS_REST_* bij een handmatige setup).
let tcpClient: Promise<RedisClientType> | null = null;

function tcpRedis(url: string) {
  tcpClient ??= (createClient({ url }) as RedisClientType)
    .on("error", (err) => console.error("Redis-fout:", err))
    .connect()
    .catch((err) => {
      tcpClient = null; // volgende aanroep opnieuw laten verbinden
      throw err;
    });
  return tcpClient;
}

async function redis<T = unknown>(...commando: (string | number)[]): Promise<T> {
  if (process.env.REDIS_URL) {
    const client = await tcpRedis(process.env.REDIS_URL);
    return (await client.sendCommand(commando.map(String))) as T;
  }
  const url = process.env.UPSTASH_REDIS_REST_URL ?? process.env.KV_REST_API_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN ?? process.env.KV_REST_API_TOKEN;
  if (!url || !token) throw new Error("Redis-configuratie ontbreekt");
  const res = await fetch(url, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify(commando),
    cache: "no-store",
  });
  const data = (await res.json()) as { result?: T; error?: string };
  if (!res.ok || data.error) throw new Error(`Redis-fout: ${data.error ?? res.status}`);
  return data.result as T;
}

export async function bewaarPlan(plan: GeplandeZoekactie): Promise<void> {
  await redis("SET", `sneaker-plan:${plan.id}`, JSON.stringify(plan), "EX", BEWAARTERMIJN_S);
  await redis("ZADD", LIJST_KEY, Date.parse(plan.aangemaakt), plan.id);
}

export async function haalPlan(id: string): Promise<GeplandeZoekactie | null> {
  const ruw = await redis<string | null>("GET", `sneaker-plan:${id}`);
  return ruw ? (JSON.parse(ruw) as GeplandeZoekactie) : null;
}

export async function haalPlannen(): Promise<GeplandeZoekactie[]> {
  const ids = await redis<string[]>("ZRANGE", LIJST_KEY, 0, 49, "REV");
  if (ids.length === 0) return [];
  const ruw = await redis<(string | null)[]>("MGET", ...ids.map((id) => `sneaker-plan:${id}`));
  // Verlopen plannen ook uit de lijst halen
  const verlopen = ids.filter((_, i) => !ruw[i]);
  if (verlopen.length) await redis("ZREM", LIJST_KEY, ...verlopen);
  return ruw.filter((r): r is string => !!r).map((r) => JSON.parse(r) as GeplandeZoekactie);
}

export async function verwijderPlan(id: string): Promise<void> {
  await redis("DEL", `sneaker-plan:${id}`);
  await redis("ZREM", LIJST_KEY, id);
}

// --- QStash ---
const qstashUrl = () => (process.env.QSTASH_URL ?? "https://qstash.upstash.io").replace(/\/$/, "");

export async function planBericht(doel: string, body: unknown, tijdstip: Date): Promise<string> {
  const token = process.env.QSTASH_TOKEN;
  if (!token) throw new Error("QSTASH_TOKEN ontbreekt");
  const res = await fetch(`${qstashUrl()}/v2/publish/${doel}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      "Upstash-Not-Before": String(Math.floor(tijdstip.getTime() / 1000)),
      // Elke zoekactie is een betaalde OpenAI-call — niet eindeloos herhalen bij fouten.
      "Upstash-Retries": "1",
    },
    body: JSON.stringify(body),
  });
  const data = (await res.json().catch(() => ({}))) as { messageId?: string; error?: string };
  if (!res.ok || !data.messageId) throw new Error(`QStash-fout: ${data.error ?? res.status}`);
  return data.messageId;
}

export async function annuleerBerichten(messageIds: string[]): Promise<void> {
  const token = process.env.QSTASH_TOKEN;
  if (!token) return;
  await Promise.all(
    messageIds.map((id) =>
      fetch(`${qstashUrl()}/v2/messages/${id}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } }).catch(() => null),
    ),
  );
}

// Controleert de Upstash-Signature (JWT, HS256) zodat alleen QStash de run-route kan aanroepen.
export function qstashHandtekeningKlopt(handtekening: string | null, body: string): boolean {
  if (!handtekening) return false;
  const sleutels = [process.env.QSTASH_CURRENT_SIGNING_KEY, process.env.QSTASH_NEXT_SIGNING_KEY].filter(Boolean) as string[];
  const [kop, inhoud, sig] = handtekening.split(".");
  if (!kop || !inhoud || !sig) return false;

  const geldig = sleutels.some((sleutel) => {
    const verwacht = createHmac("sha256", sleutel).update(`${kop}.${inhoud}`).digest("base64url");
    const a = Buffer.from(verwacht);
    const b = Buffer.from(sig);
    return a.length === b.length && timingSafeEqual(a, b);
  });
  if (!geldig) return false;

  try {
    const claims = JSON.parse(Buffer.from(inhoud, "base64url").toString()) as { iss?: string; exp?: number; nbf?: number; body?: string };
    const nu = Math.floor(Date.now() / 1000);
    if (claims.iss !== "Upstash") return false;
    if (claims.exp && nu > claims.exp + 60) return false;
    if (claims.nbf && nu < claims.nbf - 60) return false;
    const hash = createHash("sha256").update(body).digest("base64url");
    return (claims.body ?? "").replace(/=+$/, "") === hash;
  } catch {
    return false;
  }
}

// --- Telegram ---
export const escapeHtml = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

export async function stuurTelegram(tekst: string): Promise<void> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) {
    console.error("Telegram-configuratie ontbreekt; melding niet verstuurd.");
    return;
  }
  const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text: tekst, parse_mode: "HTML", disable_web_page_preview: true }),
  });
  if (!res.ok) console.error("Telegram-melding mislukt:", res.status, await res.text().catch(() => ""));
}
