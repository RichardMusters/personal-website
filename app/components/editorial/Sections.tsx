// app/components/editorial/Sections.tsx
import { editorialStyles, navLink } from "./tokens";

export function EdNav() {
  return (
    <div style={{
      display: "flex", alignItems: "center", justifyContent: "space-between",
      padding: "24px 56px 24px 104px", borderBottom: "1px solid var(--line)",
      position: "relative", zIndex: 5,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <span style={{
          width: 28, height: 28, borderRadius: "50%",
          background: "var(--mint-deep)",
          display: "inline-flex", alignItems: "center", justifyContent: "center",
          color: "var(--bg-sand)", fontSize: 11, fontWeight: 600, letterSpacing: 0.5,
        }}>RM</span>
        <span style={{ fontSize: 14, fontWeight: 500, letterSpacing: -0.1 }}>Richard Musters</span>
      </div>
      <nav style={{ display: "flex", gap: 32, fontSize: 13, color: "var(--ink-2)" }}>
        <a style={navLink} href="#about">Over</a>
        <a style={navLink} href="#work">Werk</a>
        <a style={navLink} href="#writing">Schrijfsels</a>
        <a style={navLink} href="#contact">Contact</a>
      </nav>
      <a href="#contact" style={{
        ...editorialStyles.mono,
        fontSize: 12, padding: "8px 14px", borderRadius: 999,
        background: "var(--ink)", color: "var(--bg-sand)", textDecoration: "none",
        letterSpacing: 0.3,
      }}>
        rmusters1985@gmail.com ↗
      </a>
    </div>
  );
}

export function EdHero() {
  return (
    <section style={{ padding: "80px 56px 96px", position: "relative", zIndex: 2 }}>
      <div style={{
        display: "flex", justifyContent: "space-between",
        ...editorialStyles.mono, fontSize: 11, color: "var(--ink-3)",
        letterSpacing: 0.5, textTransform: "uppercase", marginBottom: 64,
      }}>
        <span>№ 01 · Rotterdam · 51.92°N 4.48°E</span>
        <span>Editie / Mei 2026</span>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1.2fr", gap: 64, alignItems: "end" }}>
        <div>
          <div style={{
            ...editorialStyles.mono, fontSize: 11, letterSpacing: 1,
            textTransform: "uppercase", color: "var(--mint-deep)", marginBottom: 20,
            display: "inline-flex", alignItems: "center", gap: 8,
          }}>
            <span style={{
              display: "inline-block", width: 24, height: 1, background: "var(--mint-deep)",
            }} />
            IT Manager · Alfist · Levensgenieter
          </div>
          <h1 style={{
            ...editorialStyles.serif,
            fontSize: 96, lineHeight: 0.92, letterSpacing: -0.04,
            margin: "0 0 28px", color: "var(--ink)",
          }}>
            Richard
            <br />
            <em style={{
              fontStyle: "italic",
              fontVariationSettings: '"opsz" 144, "SOFT" 100',
              color: "var(--mint-deep)",
            }}>Musters</em>
          </h1>
          <p style={{ fontSize: 18, color: "var(--ink-2)", maxWidth: "38ch", margin: 0 }}>
            Ik ben iemand met een brede interesse in alles wat met IT te maken heeft en blijf 
            graag op de hoogte van de nieuwste ontwikkelingen in technologie. Naast mijn passie 
            voor IT heb ik een zwak voor Alfa Romeo – de combinatie van design, karakter en 
            rijbeleving. In mijn vrije tijd sta ik graag achter de Bastard om te barbecueën en 
            nieuwe gerechten uit te proberen. Boven alles ben ik een echte levensgenieter: 
            ik haal plezier uit de kleine dingen, goed eten, mooie auto’s en gezellige momenten 
            met vrienden en familie
          </p>
        </div>

        <div style={{ position: "relative" }}>
          <div style={{
            background: "var(--mint-tint)",
            borderRadius: 4,
            padding: "40px 36px",
            position: "relative",
            border: "1px solid var(--line)",
          }}>
            <div style={{
              ...editorialStyles.serif, fontSize: 80,
              color: "var(--mint-deep)", lineHeight: 0.6,
              position: "absolute", top: 20, left: 24, opacity: 0.4,
            }}>&ldquo;</div>
            <p style={{
              ...editorialStyles.serif, fontSize: 28, lineHeight: 1.25,
              margin: "12px 0 0", color: "var(--ink)",
              fontVariationSettings: '"opsz" 36, "SOFT" 80',
              fontStyle: "italic", fontWeight: 350,
            }}>
              De beste IT-systemen zijn onzichtbaar voor eindgebruikers
              en onmisbaar voor het bedrijf.
            </p>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 28 }}>
              <span style={{ ...editorialStyles.mono, fontSize: 11, color: "var(--mint-deep)", letterSpacing: 0.5 }}>
                — uit een gesprek, 2024
              </span>
              <span style={{
                fontSize: 11, ...editorialStyles.mono, color: "var(--ink-3)",
              }}>
                pp. 02
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export function EdStrip() {
  const items = ["AZURE", "BUSINESS CENTRAL", "FABRIC", "COPILOT", "CLAUDE", "GIULIETTA", "159", "145", "THE BASTARD", "KAMADO", "FOODIE"];
  return (
    <div style={{
      borderTop: "1px solid var(--line)",
      borderBottom: "1px solid var(--line)",
      background: "var(--bg-sand-2)",
      padding: "20px 0",
      overflow: "hidden",
      whiteSpace: "nowrap",
      position: "relative", zIndex: 2,
    }}>
      <div style={{
        display: "inline-flex", gap: 56, paddingLeft: 56,
        ...editorialStyles.mono, fontSize: 12,
        color: "var(--ink-2)", letterSpacing: 0.3,
      }}>
        {[...items, ...items].map((it, i) => (
          <span key={i} style={{ display: "inline-flex", alignItems: "center", gap: 16 }}>
            {it}
            <span style={{ width: 4, height: 4, borderRadius: "50%", background: "var(--mint-deep)" }} />
          </span>
        ))}
      </div>
    </div>
  );
}

export function EdAbout() {
  return (
    <section id="about" style={{ padding: "96px 56px", position: "relative", zIndex: 2 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 56, alignItems: "baseline" }}>
        <span style={{
          ...editorialStyles.mono, fontSize: 11, letterSpacing: 1.5,
          textTransform: "uppercase", color: "var(--ink-3)",
        }}>Hoofdstuk Een — Het Vak</span>
        <span style={{ ...editorialStyles.mono, fontSize: 11, color: "var(--ink-3)" }}>03</span>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "0.8fr 1.4fr", gap: 88 }}>
        <div>
          <h2 style={{
            ...editorialStyles.serif, fontSize: 56, lineHeight: 1, margin: 0,
            letterSpacing: -0.02,
          }}>
            Het werk achter
            <br />
            <em style={{ fontStyle: "italic", color: "var(--mint-deep)" }}>de stilte.</em>
          </h2>
        </div>
        <div style={{ fontSize: 17, lineHeight: 1.7, color: "var(--ink-2)", maxWidth: "62ch" }}>
          <p style={{ margin: "0 0 22px" }}>
            <span style={{
              ...editorialStyles.serif,
              fontSize: 64, float: "left",
              lineHeight: 0.85, marginRight: 8, marginTop: 6,
              color: "var(--accent)",
            }}>R</span>
            ichard leidt sinds 2021 de IT-afdeling van Harmony Verzekeringen.
            Een team van acht. Een jaarbudget van 2,3 miljoen. Een infrastructuur
            die elke dag zonder ophef moet draaien — want bij een verzekeraar
            zijn de werkdagen van anderen het product.
          </p>
          <p style={{ margin: "0 0 22px" }}>
            Daarvoor: implementatiespecialist, IT-consultant in het MKB, en
            ooit begonnen tussen camera&apos;s en kassasystemen bij Foto Klein.
            Een loopbaan opgebouwd van onderaf — en dat hoor je terug in
            zijn aanpak. Strategie zonder stoffigheid.
          </p>
          <p style={{ margin: 0 }}>
            Hij gelooft dat betrouwbare infrastructuur geen kostenpost is,
            maar concurrentievoordeel. Dat goede beveiliging onzichtbaar is.
            En dat de meest waardevolle IT-beslissingen zelden over technologie gaan.
          </p>
        </div>
      </div>
    </section>
  );
}

export function EdNumbers() {
  const items = [
    { k: "12+", v: "jaar in de IT" },
    { k: "14", v: "jaar Harmony Service Center" },
    { k: "35", v: "jaar Goeree Overlakkee" },
    { k: "5", v: "jaar Rotterdam" },
  ];
  return (
    <section style={{
      padding: "64px 56px",
      background: "#1a2426",
      color: "#f4f1ea",
      position: "relative", zIndex: 3,
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 32 }}>
        <span style={{ ...editorialStyles.mono, fontSize: 11, letterSpacing: 1.5, textTransform: "uppercase", color: "#a8d8c8" }}>
          De cijfers — kort
        </span>
        <span style={{ ...editorialStyles.mono, fontSize: 11, color: "rgba(244,241,234,0.4)" }}>04</span>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 0 }}>
        {items.map((it, i) => (
          <div key={i} style={{
            paddingRight: 24,
            borderLeft: i === 0 ? "none" : "1px solid rgba(244,241,234,0.15)",
            paddingLeft: i === 0 ? 0 : 32,
          }}>
            <div style={{
              ...editorialStyles.serif, fontSize: 64, lineHeight: 1,
              fontVariationSettings: '"opsz" 144, "SOFT" 30',
              color: "#f4f1ea",
            }}>{it.k}</div>
            <div style={{ fontSize: 13, color: "rgba(244,241,234,0.6)", marginTop: 12, maxWidth: "18ch" }}>
              {it.v}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export function EdContact() {
  return (
    <section id="contact" style={{ padding: "96px 56px 80px", position: "relative", zIndex: 2 }}>
      <div style={{
        position: "absolute", right: 56, top: 60,
        ...editorialStyles.serif, fontSize: 280, lineHeight: 0.8,
        color: "var(--mint-tint)",
        fontStyle: "italic",
        userSelect: "none", pointerEvents: "none",
      }}>&amp;</div>

      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 48, alignItems: "baseline" }}>
        <span style={{
          ...editorialStyles.mono, fontSize: 11, letterSpacing: 1.5,
          textTransform: "uppercase", color: "var(--ink-3)",
        }}>Hoofdstuk Vijf — Contact</span>
        <span style={{ ...editorialStyles.mono, fontSize: 11, color: "var(--ink-3)" }}>05</span>
      </div>

      <h2 style={{
        ...editorialStyles.serif, fontSize: 88, lineHeight: 0.95, margin: "0 0 28px",
        letterSpacing: -0.03, maxWidth: "14ch", position: "relative",
      }}>
        Een goed gesprek
        <br />
        <em style={{ fontStyle: "italic", color: "var(--mint-deep)" }}>begint hier.</em>
      </h2>
      <p style={{ fontSize: 18, color: "var(--ink-2)", maxWidth: "46ch", marginBottom: 40, position: "relative" }}>
        Open voor gesprekken over IT-strategie, digitale transformatie en
        leiderschap binnen de Nederlandse verzekerings- en techsector.
      </p>

      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", position: "relative" }}>
        <a href="mailto:rmusters@harmony.nl" style={{
          padding: "16px 22px", borderRadius: 999,
          background: "var(--ink)", color: "var(--bg-sand)",
          fontSize: 14, textDecoration: "none",
          display: "inline-flex", alignItems: "center", gap: 10,
        }}>
          rmusters1985@gmail.com
          <span style={{ ...editorialStyles.mono, opacity: 0.6 }}>↗</span>
        </a>
        <a href="#" style={{
          padding: "16px 22px", borderRadius: 999,
          background: "transparent", color: "var(--ink)",
          border: "1px solid var(--ink)",
          fontSize: 14, textDecoration: "none",
          display: "inline-flex", alignItems: "center", gap: 10,
        }}>
          LinkedIn
          <span style={{ ...editorialStyles.mono, opacity: 0.6 }}>↗</span>
        </a>
      </div>

      <div style={{
        marginTop: 96, paddingTop: 24, borderTop: "1px solid var(--line)",
        display: "flex", justifyContent: "space-between",
        ...editorialStyles.mono, fontSize: 11, color: "var(--ink-3)", letterSpacing: 0.3,
        position: "relative",
      }}>
        <span>© 2026 Richard Musters · Rotterdam</span>
        <span>Een mooi leven begint * met een Alfa Romeo</span>
      </div>
    </section>
  );
}

export function DarkToggle({ dark, onToggle }: { dark: boolean; onToggle: () => void }) {
  return (
    <button
      onClick={onToggle}
      aria-label={dark ? "Schakel naar lichte modus" : "Schakel naar donkere modus"}
      style={{
        position: "absolute",
        left: 24, top: 24,
        zIndex: 10,
        width: 56, height: 28,
        borderRadius: 999,
        border: "1px solid var(--line)",
        background: "var(--bg-sand-2)",
        cursor: "pointer",
        padding: 0,
        display: "flex", alignItems: "center",
        boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
        transition: "background-color .35s ease, border-color .35s ease",
      }}
    >
      <span style={{
        position: "absolute",
        left: dark ? 30 : 2,
        top: 2,
        width: 22, height: 22,
        borderRadius: "50%",
        background: dark ? "var(--mint-2)" : "var(--mint-deep)",
        transition: "left .3s cubic-bezier(.4,1.4,.5,1), background-color .35s ease",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 11,
        color: "var(--bg-sand)",
      }}>
        {dark ? "☾" : "☀"}
      </span>
    </button>
  );
}
