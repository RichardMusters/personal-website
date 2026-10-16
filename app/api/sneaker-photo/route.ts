import { leesFotoToken, zoekProductFotos } from "@/lib/sneaker-photo";

export const runtime = "nodejs";
export const maxDuration = 10;

export async function GET(req: Request) {
  const data = leesFotoToken(new URL(req.url).searchParams.get("token") ?? "");
  if (!data) return Response.json({ foto: null }, { status: 400 });
  const fotos = await zoekProductFotos(data.sku, data.urls, AbortSignal.any([req.signal, AbortSignal.timeout(5000)]));
  return Response.json({ foto: fotos[0] ?? null, fotos }, { headers: { "Cache-Control": "private, max-age=300" } });
}
