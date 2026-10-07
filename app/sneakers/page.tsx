"use client";

import { useEffect, useRef, useState } from "react";
import type { SneakerResultaat, Voorkeuren } from "@/lib/sneaker-types";
import styles from "./sneakers.module.css";

type Foto = { mimeType: string; data: string; preview: string; naam: string };

const STANDAARD_VOORKEUREN: Voorkeuren = {
  bezorgland: "Nederland",
  maat: "45",
  maatSysteem: "EU",
  merkFilter: "Nike",
  maxPrijs: null,
  resaleToegestaan: false,
};
const STANDAARD_MAAT: Record<Voorkeuren["maatSysteem"], string> = { EU: "45", US: "11" };
const VOORKEUREN_KEY = "sneakers:voorkeuren";

// Verkleint de foto in de browser naar max 1024px (scheelt tokens en uploadtijd)
async function verkleinFoto(file: File, max = 1024): Promise<Foto> {
  const bitmap = await createImageBitmap(file);
  const schaal = Math.min(1, max / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * schaal);
  canvas.height = Math.round(bitmap.height * schaal);
  canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
  return { mimeType: "image/jpeg", data: dataUrl.split(",")[1], preview: dataUrl, naam: file.name };
}

const euro = (n: number | null, valuta = "EUR") =>
  n == null ? "onbekend" : new Intl.NumberFormat("nl-NL", { style: "currency", currency: valuta || "EUR" }).format(n);

function maatReeks(van: number, tot: number): string[] {
  const reeks: string[] = [];
  for (let m = van; m <= tot; m += 0.5) {
    reeks.push(Number.isInteger(m) ? String(m) : m.toFixed(1));
  }
  return reeks;
}

// EU-maatreeks van Nike, New Balance en adidas: 30 t/m 49 in halve maten.
const SCHOENMATEN_EU = maatReeks(30, 49);
// Amerikaanse herenmaat (Nike/adidas/New Balance): 3 t/m 18 in halve maten.
const SCHOENMATEN_US = maatReeks(3, 18);

const maatLabel = { beschikbaar: "Beschikbaar", uitverkocht: "Uitverkocht", onzeker: "Niet te controleren" } as const;
const matchLabel = { exact: "Exacte match", waarschijnlijk: "Waarschijnlijke match", andere_uitvoering: "Andere uitvoering" } as const;

export default function SneakersPage() {
  const [query, setQuery] = useState("");
  const [foto, setFoto] = useState<Foto | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [laden, setLaden] = useState(false);
  const [fout, setFout] = useState<string | null>(null);
  const [resultaat, setResultaat] = useState<SneakerResultaat | null>(null);
  const [voorkeuren, setVoorkeuren] = useState<Voorkeuren>(STANDAARD_VOORKEUREN);
  const [weergave, setWeergave] = useState<"zoek" | "resultaat">("zoek");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  // Voorkeuren lokaal onthouden (geen serveropslag) zodat je ze niet elke keer opnieuw hoeft in te vullen.
  // Pas na mount lezen (localStorage bestaat niet tijdens SSR), vandaar de sync hier i.p.v. in de initializer.
  useEffect(() => {
    try {
      const opgeslagen = localStorage.getItem(VOORKEUREN_KEY);
      if (opgeslagen) {
        // eslint-disable-next-line react-hooks/set-state-in-effect -- eenmalige hydratie vanuit localStorage na mount
        setVoorkeuren({ ...STANDAARD_VOORKEUREN, ...JSON.parse(opgeslagen) });
      }
    } catch {
      /* negeren, standaardvoorkeuren blijven gelden */
    }
  }, []);

  function wijzigVoorkeur<K extends keyof Voorkeuren>(key: K, value: Voorkeuren[K]) {
    setVoorkeuren((prev) => {
      const next = { ...prev, [key]: value };
      try {
        localStorage.setItem(VOORKEUREN_KEY, JSON.stringify(next));
      } catch {
        /* privénavigatie o.i.d. — niet kritiek */
      }
      return next;
    });
  }

  function wijzigMaatSysteem(systeem: Voorkeuren["maatSysteem"]) {
    setVoorkeuren((prev) => {
      const next = { ...prev, maatSysteem: systeem, maat: STANDAARD_MAAT[systeem] };
      try {
        localStorage.setItem(VOORKEUREN_KEY, JSON.stringify(next));
      } catch {
        /* privénavigatie o.i.d. — niet kritiek */
      }
      return next;
    });
  }

  async function kiesFoto(file: File | undefined) {
    if (!file) return;
    try {
      setFoto(await verkleinFoto(file));
      setFout(null);
    } catch {
      setFout("Deze foto kan niet worden gelezen. Gebruik een JPG of PNG.");
    }
  }

  function verwijderFoto() {
    setFoto(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
    if (cameraInputRef.current) cameraInputRef.current.value = "";
  }

  function nieuweZoekactie() {
    setQuery("");
    verwijderFoto();
    setResultaat(null);
    setFout(null);
    setLaden(false);
    setWeergave("zoek");
  }

  async function zoek() {
    if (!query.trim() && !foto) {
      setFout("Voer een SKU of omschrijving in, of kies een foto.");
      return;
    }
    setWeergave("resultaat");
    setLaden(true);
    setFout(null);
    setResultaat(null);
    try {
      const res = await fetch("/api/sneaker-search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query,
          image: foto ? { mimeType: foto.mimeType, data: foto.data } : undefined,
          voorkeuren,
        }),
      });
      const data = await res.json();
      if (!res.ok) setFout(data.fout ?? "Zoeken mislukt.");
      else setResultaat(data);
    } catch {
      setFout("Geen verbinding met de server. Controleer je internet en probeer het opnieuw.");
    } finally {
      setLaden(false);
    }
  }

  const s = resultaat?.sneaker;
  const bevestigd = resultaat?.aanbiedingen.filter((a) => a.bevestigdWeergave) ?? [];
  const onbevestigd = resultaat?.aanbiedingen.filter((a) => !a.bevestigdWeergave) ?? [];
  const besteMatch = bevestigd[0];
  const gecontroleerdOp = resultaat?.gecontroleerdOp
    ? new Date(resultaat.gecontroleerdOp).toLocaleString("nl-NL", { dateStyle: "long", timeStyle: "short" })
    : null;

  return (
    <main className={styles.page}>
      <div className={styles.inner}>
        <p className={styles.eyebrow}>
          <span className={styles.eyebrowDot} aria-hidden />
          PRIVÉ &mdash; EXCLUSIEVE SNEAKERS
        </p>

        <h1 className={styles.title}>
          Vind sneakers
          <br />
          <span className={styles.titleAccent}>die niemand anders heeft.</span>
        </h1>

        <p className={styles.intro}>
          Zoek op SKU, omschrijving of een foto van het paar dat je zoekt.
        </p>

      {weergave === "zoek" && (
        <>
        <details className={styles.prefs}>
          <summary>Voorkeuren &mdash; merk: {voorkeuren.merkFilter || "alle"}, maat {voorkeuren.maatSysteem} {voorkeuren.maat}, bezorgland: {voorkeuren.bezorgland}</summary>
          <div className={styles.prefsGrid}>
            <label className={styles.prefsField}>
              <span>Merk (leeg = alle merken)</span>
              <input
                type="text"
                value={voorkeuren.merkFilter ?? ""}
                onChange={(e) => wijzigVoorkeur("merkFilter", e.target.value || null)}
                placeholder="Nike"
              />
            </label>
            <label className={styles.prefsField}>
              <span>Maat</span>
              <div className={styles.maatVeld}>
                <div className={styles.maatToggle} role="group" aria-label="Maatsysteem">
                  <button
                    type="button"
                    aria-pressed={voorkeuren.maatSysteem === "EU"}
                    className={voorkeuren.maatSysteem === "EU" ? `${styles.maatToggleBtn} ${styles.maatToggleBtnActief}` : styles.maatToggleBtn}
                    onClick={() => wijzigMaatSysteem("EU")}
                  >
                    EU
                  </button>
                  <button
                    type="button"
                    aria-pressed={voorkeuren.maatSysteem === "US"}
                    className={voorkeuren.maatSysteem === "US" ? `${styles.maatToggleBtn} ${styles.maatToggleBtnActief}` : styles.maatToggleBtn}
                    onClick={() => wijzigMaatSysteem("US")}
                  >
                    US
                  </button>
                </div>
                <select value={voorkeuren.maat} onChange={(e) => wijzigVoorkeur("maat", e.target.value)}>
                  {(voorkeuren.maatSysteem === "EU" ? SCHOENMATEN_EU : SCHOENMATEN_US).map((maat) => (
                    <option key={maat} value={maat}>
                      {maat}
                    </option>
                  ))}
                </select>
              </div>
            </label>
            <label className={styles.prefsField}>
              <span>Bezorgland</span>
              <input
                type="text"
                value={voorkeuren.bezorgland}
                onChange={(e) => wijzigVoorkeur("bezorgland", e.target.value)}
                placeholder="Nederland"
              />
            </label>
            <label className={styles.prefsField}>
              <span>Max. richtprijs (optioneel)</span>
              <input
                type="number"
                min={0}
                value={voorkeuren.maxPrijs ?? ""}
                onChange={(e) => wijzigVoorkeur("maxPrijs", e.target.value ? Number(e.target.value) : null)}
                placeholder="Geen maximum"
              />
            </label>
            <label className={styles.prefsCheckbox}>
              <input
                type="checkbox"
                checked={voorkeuren.resaleToegestaan}
                onChange={(e) => wijzigVoorkeur("resaleToegestaan", e.target.checked)}
              />
              <span>Toon ook tweedehands / resale (StockX, GOAT e.d.)</span>
            </label>
          </div>
        </details>

        <form
          role="search"
          className={styles.searchField}
          onSubmit={(e) => {
            e.preventDefault();
            if (!laden) zoek();
          }}
        >
          <label htmlFor="sneaker-query" className="sr-only">
            Zoek op SKU of omschrijving
          </label>
          <svg
            className={styles.searchIcon}
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden
          >
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-3.5-3.5" />
          </svg>
          <input
            id="sneaker-query"
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Bijv. DD1391-100 of 'Jordan 4 Retro Military Black'"
            className={styles.searchInput}
            maxLength={300}
          />
          <button type="submit" className={styles.searchButton} disabled={laden}>
            {laden ? "Zoeken…" : "Zoeken"}
          </button>
        </form>

        <div className={styles.divider}>
          <span className={styles.dividerLine} aria-hidden />
          <span>of zoek op foto</span>
          <span className={styles.dividerLine} aria-hidden />
        </div>

        <div className={styles.photoChoices}>
          <div
            className={dragActive ? `${styles.photoChoice} ${styles.photoChoiceActive}` : styles.photoChoice}
            role="button"
            tabIndex={0}
            aria-label="Kies een foto uit je bibliotheek"
            onClick={() => fileInputRef.current?.click()}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") fileInputRef.current?.click();
            }}
            onDragOver={(e) => {
              e.preventDefault();
              setDragActive(true);
            }}
            onDragLeave={() => setDragActive(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragActive(false);
              kiesFoto(e.dataTransfer.files?.[0]);
            }}
          >
            <span className={styles.photoChoiceIcon}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <rect x="3" y="5" width="18" height="14" rx="2" />
                <path d="m3 16 5-5 4 4 3-3 6 6" />
                <circle cx="8.5" cy="9" r="1.5" />
              </svg>
            </span>
            <p className={styles.photoChoiceTitle}>Kies foto uit bibliotheek</p>
            <p className={styles.photoChoiceHint}>Sleep een foto hierheen of klik om te bladeren &mdash; JPG of PNG</p>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="sr-only"
              onChange={(e) => kiesFoto(e.target.files?.[0])}
            />
          </div>

          <div
            className={styles.photoChoice}
            role="button"
            tabIndex={0}
            aria-label="Open de camera om een foto te maken"
            onClick={() => cameraInputRef.current?.click()}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") cameraInputRef.current?.click();
            }}
          >
            <span className={styles.photoChoiceIcon}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <path d="M4 8a2 2 0 0 1 2-2h1.5l1-1.5h7l1 1.5H18a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z" />
                <circle cx="12" cy="13" r="3.5" />
              </svg>
            </span>
            <p className={styles.photoChoiceTitle}>Gebruik camera</p>
            <p className={styles.photoChoiceHint}>Maak nu een foto &mdash; alleen op telefoon of tablet</p>
            <input
              ref={cameraInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="sr-only"
              onChange={(e) => kiesFoto(e.target.files?.[0])}
            />
          </div>
        </div>

        {foto && (
          <div className={styles.fotoPreview}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={foto.preview} alt="Geselecteerde sneaker" />
            <span className={styles.fotoPreviewNaam}>{foto.naam}</span>
            <button type="button" onClick={verwijderFoto} className={styles.linkKnop}>
              Verwijderen
            </button>
          </div>
        )}
        </>
      )}

      {weergave === "resultaat" && (
        <>
        <button type="button" className={styles.terugKnop} onClick={nieuweZoekactie}>
          ← Nieuwe zoekactie
        </button>

        {laden && (
          <p className={styles.statusText}>
            Sneaker herkennen en winkels doorzoeken. Dit duurt meestal 5 tot 15 seconden.
          </p>
        )}
        {fout && (
          <p className={styles.errorText} role="alert">
            {fout}
          </p>
        )}

        {resultaat && !resultaat.gevonden && (
          <p className={styles.statusText}>
            Geen sneaker gevonden. Probeer een duidelijkere foto of voeg het merk toe aan je zoekopdracht.
          </p>
        )}

        {resultaat?.gevonden && s && (
          <section className={styles.resultaat} aria-live="polite">
            <article className={styles.label}>
              <p className={styles.labelBrand}>{s.merk ?? "Merk onbekend"}</p>
              <h2 className={styles.labelModel}>{s.model ?? "Model onbekend"}</h2>
              {s.colorway && <p className={styles.labelColorway}>{s.colorway}</p>}
              <dl className={styles.specs}>
                <div>
                  <dt>Style code</dt>
                  <dd className={styles.sku}>{s.sku ?? "Onbekend"}</dd>
                </div>
                <div>
                  <dt>Release</dt>
                  <dd>{s.releasedatum ?? "Onbekend"}</dd>
                </div>
                <div>
                  <dt>Retailprijs</dt>
                  <dd>{euro(s.retailprijs)}</dd>
                </div>
              </dl>
              {resultaat.zekerheid !== "hoog" && (
                <p className={styles.confidence}>
                  Herkenning met {resultaat.zekerheid === "middel" ? "redelijke" : "lage"} zekerheid. Controleer de style code.
                </p>
              )}
            </article>

            {s.omschrijving && <p className={styles.omschrijving}>{s.omschrijving}</p>}

            {besteMatch && (
              <div className={styles.blok}>
                <h3 className={styles.sectionTitle}>Beste match</h3>
                <div className={styles.besteMatch}>
                  <div className={styles.offerLink} style={{ textDecoration: "none" }}>
                    <span className={styles.offerShop}>{besteMatch.winkel}</span>
                    <span className={styles.offerPrice}>{euro(besteMatch.totaalprijs ?? besteMatch.prijs, besteMatch.valuta)}</span>
                  </div>
                  {resultaat.besteMatchToelichting && (
                    <p className={styles.besteMatchToelichting}>{resultaat.besteMatchToelichting}</p>
                  )}
                  <a href={besteMatch.url} target="_blank" rel="noopener noreferrer nofollow" className={styles.besteMatchLink}>
                    Bekijk productpagina →
                  </a>
                </div>
              </div>
            )}

            {resultaat.alternatieven?.length > 0 && (
              <div className={styles.blok}>
                <h3 className={styles.sectionTitle}>Vergelijkbare alternatieven</h3>
                <p className={styles.altNote}>Let op: dit is niet dezelfde schoen.</p>
                <div className={styles.altList}>
                  {resultaat.alternatieven.map((a, i) => (
                    <button
                      key={i}
                      type="button"
                      className={styles.altChip}
                      onClick={() => {
                        setQuery(a.sku ?? a.model);
                        verwijderFoto();
                      }}
                    >
                      {a.model}
                      {a.sku ? ` (${a.sku})` : ""}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className={styles.blok}>
              <h3 className={styles.sectionTitle}>Beste aanbiedingen</h3>
              {bevestigd.length === 0 ? (
                <p className={styles.statusText}>Geen volledig bevestigde aanbiedingen gevonden.</p>
              ) : (
                <ul className={styles.offerList}>
                  {bevestigd.slice(0, 5).map((a, i) => (
                    <OfferItem key={i} a={a} euro={euro} />
                  ))}
                </ul>
              )}
            </div>

            {onbevestigd.length > 0 && (
              <div className={styles.blok}>
                <h3 className={styles.sectionTitle}>Onbevestigde aanbiedingen</h3>
                <p className={styles.altNote}>
                  Maat, prijs of uitvoering kon hier niet volledig worden gecontroleerd.
                </p>
                <ul className={styles.offerList}>
                  {onbevestigd.map((a, i) => (
                    <OfferItem key={i} a={a} euro={euro} />
                  ))}
                </ul>
              </div>
            )}

            {resultaat.waarschuwingen && resultaat.waarschuwingen.length > 0 && (
              <ul className={styles.warnings}>
                {resultaat.waarschuwingen.map((w, i) => (
                  <li key={i}>{w}</li>
                ))}
              </ul>
            )}

            {resultaat.tips?.length > 0 && (
              <div className={styles.blok}>
                <h3 className={styles.sectionTitle}>Goed om te weten</h3>
                <ul className={styles.tips}>
                  {resultaat.tips.map((t, i) => (
                    <li key={i}>{t}</li>
                  ))}
                </ul>
              </div>
            )}

            {resultaat.bronnen && resultaat.bronnen.length > 0 && (
              <details className={styles.sources}>
                <summary>Gebruikte bronnen ({resultaat.bronnen.length})</summary>
                <ul>
                  {resultaat.bronnen.map((b, i) => (
                    <li key={i}>
                      <a href={b.url} target="_blank" rel="noopener noreferrer nofollow">
                        {b.titel || b.url}
                      </a>
                    </li>
                  ))}
                </ul>
              </details>
            )}

            <p className={styles.disclaimer}>
              Prijzen en voorraad kunnen afwijken. Controleer altijd de winkel zelf.
              {gecontroleerdOp && ` Gecontroleerd: ${gecontroleerdOp}.`}
            </p>
          </section>
        )}
        </>
      )}

        <p className={styles.note}>Zoekresultaten worden aangedreven door de Gemini API van Google</p>
      </div>
    </main>
  );
}

function OfferItem({
  a,
  euro,
}: {
  a: SneakerResultaat["aanbiedingen"][number];
  euro: (n: number | null, valuta?: string) => string;
}) {
  return (
    <li className={styles.offerItem}>
      <a href={a.url} target="_blank" rel="noopener noreferrer nofollow" className={styles.offerLink}>
        <span className={styles.offerShop}>{a.winkel}</span>
        <span className={styles.offerPrice}>{euro(a.totaalprijs ?? a.prijs, a.valuta)}</span>
      </a>
      <span className={styles.offerMeta}>
        {a.type === "resale" ? "Resale" : "Nieuw"}
        <span className={a.matchZekerheid === "exact" ? styles.badgeOk : a.matchZekerheid === "waarschijnlijk" ? styles.badgeWarn : styles.badgeDanger}>
          {matchLabel[a.matchZekerheid]}
        </span>
        <span className={a.maatBeschikbaarheid === "beschikbaar" ? styles.badgeOk : a.maatBeschikbaarheid === "onzeker" ? styles.badgeWarn : styles.badgeDanger}>
          Maat: {maatLabel[a.maatBeschikbaarheid]}
        </span>
        {a.voorkeur && <span className={styles.badgeOk}>Vertrouwde winkel</span>}
        {a.verzendingBuitenEU && <span className={styles.badgeWarn}>Verzending buiten EU</span>}
      </span>
      <span className={styles.offerNote}>
        {a.prijs != null && (
          <>
            Schoen: {euro(a.prijs, a.valuta)} &middot; Verzending:{" "}
            {a.verzendkosten === "gratis" ? "gratis" : a.verzendkosten != null ? euro(a.verzendkosten, a.valuta) : "onbekend"}
          </>
        )}
      </span>
      {a.opmerking && <span className={styles.offerNote}>{a.opmerking}</span>}
    </li>
  );
}
