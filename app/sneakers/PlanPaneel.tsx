"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { GeplandeZoekactie, Voorkeuren } from "@/lib/sneaker-types";
import styles from "./sneakers.module.css";

const CODE_KEY = "sneakers:plan-code";
const MAX_CHECKS = 8;

const statusLabel: Record<GeplandeZoekactie["status"], string> = {
  actief: "Actief",
  gevonden: "Gevonden",
  afgerond: "Afgerond",
  geannuleerd: "Geannuleerd",
};

const tijd = (iso: string) =>
  new Date(iso).toLocaleString("nl-NL", { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });

// datetime-local verwacht lokale tijd zonder tijdzone: "2026-10-27T21:00"
function naarLokaal(d: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function standaardEinde() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  d.setHours(21, 0, 0, 0);
  return naarLokaal(d);
}

// Verdeelt de checks gelijkmatig tussen nu en het laatste tijdstip (de laatste valt precies op het einde).
function berekenTijdstippen(einde: string, aantal: number, nu: number): Date[] {
  const eind = new Date(einde).getTime();
  if (isNaN(eind) || eind <= nu + 60_000) return [];
  return Array.from({ length: aantal }, (_, i) => {
    const t = nu + ((eind - nu) * (i + 1)) / aantal;
    return new Date(Math.round(t / 60_000) * 60_000);
  });
}

export default function PlanPaneel({ query, voorkeuren }: { query: string; voorkeuren: Voorkeuren }) {
  const [code, setCode] = useState("");
  const [codeInvoer, setCodeInvoer] = useState("");
  const [einde, setEinde] = useState(standaardEinde);
  const [aantal, setAantal] = useState(4);
  const [plannen, setPlannen] = useState<GeplandeZoekactie[]>([]);
  const [bezig, setBezig] = useState(false);
  const [melding, setMelding] = useState<{ tekst: string; fout: boolean } | null>(null);
  const [nu, setNu] = useState(() => Date.now());

  useEffect(() => {
    try {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- eenmalige hydratie vanuit localStorage na mount
      setCode(localStorage.getItem(CODE_KEY) ?? "");
    } catch {
      /* geen opslag beschikbaar — code opnieuw invullen */
    }
    // Voorbeeldtijden actueel houden
    const timer = setInterval(() => setNu(Date.now()), 60_000);
    return () => clearInterval(timer);
  }, []);

  const tijdstippen = useMemo(() => berekenTijdstippen(einde, aantal, nu), [einde, aantal, nu]);

  const api = useCallback(
    async (method: string, pad = "", body?: unknown) => {
      const res = await fetch(`/api/sneaker-plan${pad}`, {
        method,
        headers: { "Content-Type": "application/json", "x-plan-code": code },
        body: body ? JSON.stringify(body) : undefined,
      });
      const data = await res.json().catch(() => ({}));
      if (res.status === 401) {
        setCode("");
        try {
          localStorage.removeItem(CODE_KEY);
        } catch {}
      }
      if (!res.ok) throw new Error(data.fout ?? "Er ging iets mis.");
      return data;
    },
    [code],
  );

  const laadPlannen = useCallback(async () => {
    try {
      const data = await api("GET");
      setPlannen(data.plannen ?? []);
    } catch (err) {
      setMelding({ tekst: (err as Error).message, fout: true });
    }
  }, [api]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- lijst ophalen zodra er een code is
    if (code) laadPlannen();
  }, [code, laadPlannen]);

  function bewaarCode() {
    const c = codeInvoer.trim();
    if (!c) return;
    try {
      localStorage.setItem(CODE_KEY, c);
    } catch {}
    setCode(c);
    setCodeInvoer("");
    setMelding(null);
  }

  async function inplannen() {
    if (!query.trim()) {
      setMelding({ tekst: "Vul eerst een SKU of omschrijving in het zoekveld in.", fout: true });
      return;
    }
    if (tijdstippen.length === 0) {
      setMelding({ tekst: "Kies een laatste check in de toekomst.", fout: true });
      return;
    }
    setBezig(true);
    setMelding(null);
    try {
      await api("POST", "", { query, voorkeuren, tijdstippen: tijdstippen.map((t) => t.toISOString()) });
      setMelding({ tekst: `Ingepland: ${tijdstippen.length} checks. Je krijgt een Telegram-bericht zodra hij leverbaar is.`, fout: false });
      await laadPlannen();
    } catch (err) {
      setMelding({ tekst: (err as Error).message, fout: true });
    } finally {
      setBezig(false);
    }
  }

  async function annuleer(id: string, verwijder = false) {
    try {
      await api("DELETE", `?id=${encodeURIComponent(id)}${verwijder ? "&verwijder=1" : ""}`);
      await laadPlannen();
    } catch (err) {
      setMelding({ tekst: (err as Error).message, fout: true });
    }
  }

  return (
    <details className={styles.prefs}>
      <summary>Later opnieuw zoeken &mdash; meldt via Telegram wanneer hij leverbaar is</summary>

      {!code ? (
        <div className={styles.planCode}>
          <label className={styles.prefsField}>
            <span>Toegangscode</span>
            <input
              type="password"
              value={codeInvoer}
              onChange={(e) => setCodeInvoer(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && bewaarCode()}
              autoComplete="current-password"
            />
          </label>
          <button type="button" className={styles.planKnop} onClick={bewaarCode}>
            Ontgrendel
          </button>
        </div>
      ) : (
        <>
          <p className={styles.planZoekt}>
            Zoekt naar: <strong>{query.trim() || "— vul het zoekveld in —"}</strong> &middot; maat {voorkeuren.maatSysteem} {voorkeuren.maat}
          </p>
          <div className={styles.prefsGrid}>
            <label className={styles.prefsField}>
              <span>Laatste check (bijv. de avond voor de release)</span>
              <input type="datetime-local" value={einde} min={naarLokaal(new Date(nu))} onChange={(e) => setEinde(e.target.value)} />
            </label>
            <label className={styles.prefsField}>
              <span>Aantal checks</span>
              <select value={aantal} onChange={(e) => setAantal(Number(e.target.value))}>
                {Array.from({ length: MAX_CHECKS }, (_, i) => i + 1).map((n) => (
                  <option key={n} value={n}>
                    {n}&times;
                  </option>
                ))}
              </select>
            </label>
          </div>

          {tijdstippen.length > 0 && (
            <ul className={styles.planTijden}>
              {tijdstippen.map((t) => (
                <li key={t.getTime()}>{tijd(t.toISOString())}</li>
              ))}
            </ul>
          )}

          <button type="button" className={styles.planKnop} onClick={inplannen} disabled={bezig}>
            {bezig ? "Inplannen…" : "Inplannen"}
          </button>

          {plannen.length > 0 && (
            <ul className={styles.planLijst}>
              {plannen.map((p) => {
                const laatsteRun = p.runs[p.runs.length - 1];
                const volgende = p.status === "actief" ? p.tijdstippen[p.runs.length] : null;
                return (
                  <li key={p.id} className={styles.planItem}>
                    <div className={styles.planItemKop}>
                      <strong>{p.query}</strong>
                      <span className={p.status === "gevonden" ? styles.badgeOk : p.status === "actief" ? styles.badgeWarn : styles.badgeDanger}>
                        {statusLabel[p.status]}
                      </span>
                    </div>
                    <span className={styles.offerNote}>
                      {p.runs.length}/{p.tijdstippen.length} checks gedaan
                      {volgende && <> &middot; volgende: {tijd(volgende)}</>}
                    </span>
                    {laatsteRun && <span className={styles.offerNote}>Laatste: {laatsteRun.samenvatting}</span>}
                    {laatsteRun?.aanbiedingen
                      .filter((a) => a.bevestigd)
                      .map((a) => (
                        <a key={a.url} href={a.url} target="_blank" rel="noopener noreferrer nofollow" className={styles.planLink}>
                          {a.winkel} →
                        </a>
                      ))}
                    <div className={styles.planActies}>
                      {p.status === "actief" ? (
                        <button type="button" className={styles.linkKnop} onClick={() => annuleer(p.id)}>
                          Annuleren
                        </button>
                      ) : (
                        <button type="button" className={styles.linkKnop} onClick={() => annuleer(p.id, true)}>
                          Verwijderen
                        </button>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </>
      )}

      {melding && (
        <p className={melding.fout ? styles.errorText : styles.statusText} role={melding.fout ? "alert" : "status"}>
          {melding.tekst}
        </p>
      )}
    </details>
  );
}
