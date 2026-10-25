import { annuleerBerichten, bewaarPlan, escapeHtml, haalPlan, qstashHandtekeningKlopt, stuurTelegram } from "@/lib/sneaker-plan";
import { zoekSneaker } from "@/lib/sneaker-zoek";
import type { GeplandeZoekactie, PlanRun, SneakerResultaat } from "@/lib/sneaker-types";

// Wordt door QStash aangeroepen op elk gepland tijdstip.
export const runtime = "nodejs";
export const maxDuration = 60;

const euro = (n: number | null, valuta = "EUR") =>
  n == null ? "prijs onbekend" : new Intl.NumberFormat("nl-NL", { style: "currency", currency: valuta || "EUR" }).format(n);

function naamVan(data: SneakerResultaat | null, plan: GeplandeZoekactie) {
  const s = data?.sneaker;
  return [s?.merk, s?.model, s?.colorway].filter(Boolean).join(" ") || plan.query;
}

function aanbiedingRegels(run: PlanRun, alleenBevestigd: boolean) {
  return run.aanbiedingen
    .filter((a) => !alleenBevestigd || a.bevestigd)
    .map((a) => `• <a href="${escapeHtml(a.url)}">${escapeHtml(a.winkel)}</a> — ${euro(a.prijs, a.valuta)}`)
    .join("\n");
}

export async function POST(req: Request) {
  const ruweBody = await req.text();
  const lokaalZonderSleutels = process.env.NODE_ENV === "development" && !process.env.QSTASH_CURRENT_SIGNING_KEY;
  if (!lokaalZonderSleutels && !qstashHandtekeningKlopt(req.headers.get("upstash-signature"), ruweBody)) {
    return Response.json({ fout: "Ongeldige handtekening." }, { status: 401 });
  }

  let bericht: { id?: string; index?: number };
  try {
    bericht = JSON.parse(ruweBody);
  } catch {
    return Response.json({ fout: "Ongeldig verzoek." }, { status: 400 });
  }

  const plan = await haalPlan(String(bericht.id ?? ""));
  const index = Number(bericht.index ?? 0);
  // Geannuleerd, al gevonden of dubbel afgeleverd: niets doen (200, zodat QStash niet opnieuw probeert).
  if (!plan || plan.status !== "actief" || plan.runs.length > index) {
    return Response.json({ overgeslagen: true });
  }

  const uitkomst = await zoekSneaker({ query: plan.query, voorkeuren: plan.voorkeuren });
  const data = uitkomst.ok ? uitkomst.data : null;
  const bevestigd = data?.aanbiedingen.filter((a) => a.bevestigdWeergave) ?? [];

  // Tijdens het zoeken (tot ~50 s) kan het plan geannuleerd of verwijderd zijn.
  const actueel = await haalPlan(plan.id);
  if (!actueel || actueel.status !== "actief") return Response.json({ overgeslagen: true });

  const run: PlanRun = {
    gepland: plan.tijdstippen[index] ?? new Date().toISOString(),
    uitgevoerd: new Date().toISOString(),
    status: !uitkomst.ok ? "fout" : bevestigd.length > 0 ? "gevonden" : "niet_gevonden",
    samenvatting: !uitkomst.ok
      ? uitkomst.fout
      : bevestigd.length > 0
        ? `Leverbaar bij ${bevestigd.length} winkel${bevestigd.length === 1 ? "" : "s"} in maat ${plan.voorkeuren.maatSysteem} ${plan.voorkeuren.maat}.`
        : (data?.aanbiedingen.length ?? 0) > 0
          ? `${data!.aanbiedingen.length} onbevestigde aanbieding(en), maat of prijs niet te controleren.`
          : "Nog nergens leverbaar.",
    aanbiedingen: (data?.aanbiedingen ?? []).map((a) => ({
      winkel: a.winkel,
      url: a.url,
      prijs: a.totaalprijs ?? a.prijs,
      valuta: a.valuta,
      bevestigd: !!a.bevestigdWeergave,
    })),
  };
  plan.runs.push(run);

  const laatste = index >= plan.tijdstippen.length - 1;
  const teller = `Check ${index + 1} van ${plan.tijdstippen.length}`;
  const naam = escapeHtml(naamVan(data, plan));
  const sku = data?.sneaker.sku ? ` (${escapeHtml(data.sneaker.sku)})` : "";

  if (run.status === "gevonden") {
    plan.status = "gevonden";
    await annuleerBerichten(plan.messageIds.slice(index + 1));
    await stuurTelegram(
      `🟢 <b>Leverbaar: ${naam}</b>${sku}\nMaat ${plan.voorkeuren.maatSysteem} ${escapeHtml(plan.voorkeuren.maat)}\n\n${aanbiedingRegels(run, true)}\n\n<i>${teller} · zoekopdracht: ${escapeHtml(plan.query)}</i>`,
    );
  } else if (laatste) {
    plan.status = "afgerond";
    const onbevestigd = aanbiedingRegels(run, false);
    await stuurTelegram(
      `🔴 <b>Niet gevonden: ${naam}</b>${sku}\nNa ${plan.tijdstippen.length} checks nog niet bevestigd leverbaar in maat ${plan.voorkeuren.maatSysteem} ${escapeHtml(plan.voorkeuren.maat)}.` +
        (run.status === "fout" ? `\nLaatste check mislukt: ${escapeHtml(run.samenvatting)}` : "") +
        (onbevestigd ? `\n\nOnbevestigd (zelf controleren):\n${onbevestigd}` : "") +
        `\n\n<i>Zoekopdracht: ${escapeHtml(plan.query)}</i>`,
    );
  }

  await bewaarPlan(plan);
  return Response.json({ ok: true, status: run.status });
}
