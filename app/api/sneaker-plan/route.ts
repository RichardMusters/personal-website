import { randomUUID } from "node:crypto";
import { annuleerBerichten, bewaarPlan, codeKlopt, haalPlan, haalPlannen, planBericht, verwijderPlan } from "@/lib/sneaker-plan";
import { STANDAARD_VOORKEUREN } from "@/lib/sneaker-zoek";
import type { GeplandeZoekactie, Voorkeuren } from "@/lib/sneaker-types";

export const runtime = "nodejs";
export const maxDuration = 30;

const MAX_TIJDSTIPPEN = 8;
const MAX_ACTIEF = 10;
const MAX_VOORUIT_MS = 14 * 24 * 60 * 60 * 1000;

function geenToegang() {
  return Response.json({ fout: "Onjuiste of ontbrekende code." }, { status: 401 });
}

// QStash moet de site publiek kunnen bereiken; lokaal kun je PLAN_CALLBACK_BASE op een tunnel-URL zetten.
function callbackUrl(req: Request) {
  const basis = (process.env.PLAN_CALLBACK_BASE ?? new URL(req.url).origin).replace(/\/$/, "");
  return `${basis}/api/sneaker-plan/run`;
}

export async function GET(req: Request) {
  if (!codeKlopt(req.headers.get("x-plan-code"))) return geenToegang();
  try {
    return Response.json({ plannen: await haalPlannen() });
  } catch (err) {
    console.error(err);
    return Response.json({ fout: "Geplande zoekacties konden niet worden opgehaald." }, { status: 500 });
  }
}

export async function POST(req: Request) {
  if (!codeKlopt(req.headers.get("x-plan-code"))) return geenToegang();

  let body: { query?: unknown; tijdstippen?: unknown; voorkeuren?: Partial<Voorkeuren> };
  try {
    body = await req.json();
  } catch {
    return Response.json({ fout: "Ongeldig verzoek." }, { status: 400 });
  }

  const query = typeof body.query === "string" ? body.query.trim().slice(0, 300) : "";
  if (!query) return Response.json({ fout: "Voer een SKU of omschrijving in om te plannen." }, { status: 400 });

  const nu = Date.now();
  const tijdstippen = (Array.isArray(body.tijdstippen) ? body.tijdstippen : [])
    .map((t) => new Date(typeof t === "string" ? t : NaN))
    .filter((d) => !isNaN(d.getTime()) && d.getTime() > nu - 60_000 && d.getTime() < nu + MAX_VOORUIT_MS)
    .sort((a, b) => a.getTime() - b.getTime());
  if (tijdstippen.length === 0 || tijdstippen.length > MAX_TIJDSTIPPEN) {
    return Response.json({ fout: `Kies 1 tot ${MAX_TIJDSTIPPEN} tijdstippen in de komende 14 dagen.` }, { status: 400 });
  }

  try {
    const actief = (await haalPlannen()).filter((p) => p.status === "actief").length;
    if (actief >= MAX_ACTIEF) {
      return Response.json({ fout: `Er staan al ${MAX_ACTIEF} geplande zoekacties actief. Annuleer er eerst een.` }, { status: 429 });
    }

    const plan: GeplandeZoekactie = {
      id: randomUUID(),
      query,
      voorkeuren: { ...STANDAARD_VOORKEUREN, ...body.voorkeuren },
      aangemaakt: new Date().toISOString(),
      tijdstippen: tijdstippen.map((d) => d.toISOString()),
      messageIds: [],
      status: "actief",
      runs: [],
    };

    const doel = callbackUrl(req);
    try {
      for (const [index, tijdstip] of tijdstippen.entries()) {
        plan.messageIds.push(await planBericht(doel, { id: plan.id, index }, tijdstip));
      }
    } catch (err) {
      // Half ingeplande berichten niet laten rondslingeren
      await annuleerBerichten(plan.messageIds);
      throw err;
    }

    await bewaarPlan(plan);
    return Response.json({ plan });
  } catch (err) {
    console.error(err);
    return Response.json({ fout: "Inplannen mislukt. Controleer de Upstash-configuratie op de server." }, { status: 500 });
  }
}

// ?id=…            → annuleren (resterende zoekacties worden geschrapt, historie blijft)
// ?id=…&verwijder=1 → helemaal verwijderen
export async function DELETE(req: Request) {
  if (!codeKlopt(req.headers.get("x-plan-code"))) return geenToegang();
  const params = new URL(req.url).searchParams;
  const id = params.get("id") ?? "";
  try {
    const plan = await haalPlan(id);
    if (!plan) return Response.json({ fout: "Niet gevonden." }, { status: 404 });
    if (plan.status === "actief") await annuleerBerichten(plan.messageIds.slice(plan.runs.length));
    if (params.get("verwijder")) {
      await verwijderPlan(id);
      return Response.json({ ok: true });
    }
    if (plan.status === "actief") plan.status = "geannuleerd";
    await bewaarPlan(plan);
    return Response.json({ plan });
  } catch (err) {
    console.error(err);
    return Response.json({ fout: "Annuleren mislukt." }, { status: 500 });
  }
}
