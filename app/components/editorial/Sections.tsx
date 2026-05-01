import styles from "./Editorial.module.css";
import { editorialStyles, navLink } from "./tokens";

export function EdNav() {
  return (
    <div className={styles.nav}>
      <div className={styles.navBrand}>
        <span style={{
          width: 28, height: 28, borderRadius: "50%",
          background: "var(--mint-deep)",
          display: "inline-flex", alignItems: "center", justifyContent: "center",
          color: "var(--bg-sand)", fontSize: 11, fontWeight: 600, letterSpacing: 0.5,
        }}>RM</span>
        <span style={{ fontSize: 14, fontWeight: 500, letterSpacing: -0.1 }}>Richard Musters</span>
      </div>

      <nav className={styles.navLinks}>
        <a style={navLink} href="#about">Over</a>
        <a style={navLink} href="#work">Werk</a>
        <a style={navLink} href="#contact">Contact</a>
      </nav>

      <a
        className={styles.navCta}
        href="#contact"
        style={{
          ...editorialStyles.mono,
          fontSize: 12,
          padding: "8px 14px",
          borderRadius: 999,
          background: "var(--ink)",
          color: "var(--bg-sand)",
          textDecoration: "none",
          letterSpacing: 0.3,
        }}
      >
        rmusters1985@gmail.com &rarr;
      </a>
    </div>
  );
}

export function EdHero() {
  return (
    <section className={styles.heroSection}>
      <div
        className={styles.heroMeta}
        style={{
          ...editorialStyles.mono,
          fontSize: 11,
          color: "var(--ink-3)",
          letterSpacing: 0.5,
          textTransform: "uppercase",
        }}
      >
        <span>No. 01 &middot; Rotterdam &middot; 51.92N 4.48E</span>
        <span>Editie / Mei 2026</span>
      </div>

      <div className={styles.heroGrid}>
        <div>
          <div
            className={styles.heroEyebrow}
            style={{
              ...editorialStyles.mono,
              fontSize: 11,
              letterSpacing: 1,
              textTransform: "uppercase",
              color: "var(--mint-deep)",
              marginBottom: 20,
            }}
          >
            <span
              style={{
                display: "inline-block",
                width: 24,
                height: 1,
                background: "var(--mint-deep)",
              }}
            />
            IT Manager &middot; Alfist &middot; Levensgenieter
          </div>

          <h1 className={styles.heroTitle} style={editorialStyles.serif}>
            Richard
            <br />
            <em
              style={{
                fontStyle: "italic",
                fontVariationSettings: '"opsz" 144, "SOFT" 100',
                color: "var(--mint-deep)",
              }}
            >
              Musters
            </em>
          </h1>

          <p className={styles.heroIntro}>
            Ik ben iemand met een brede interesse in alles wat met IT te maken heeft en blijf
            graag op de hoogte van de nieuwste ontwikkelingen in technologie. Naast mijn passie
            voor IT heb ik een zwak voor Alfa Romeo - de combinatie van design, karakter en
            rijbeleving. In mijn vrije tijd sta ik graag achter de Bastard om te barbecuen en
            nieuwe gerechten uit te proberen. Boven alles ben ik een echte levensgenieter:
            ik haal plezier uit de kleine dingen, goed eten, mooie auto&apos;s en gezellige momenten
            met vrienden en familie.
          </p>
        </div>

        <div style={{ position: "relative" }}>
          <div className={styles.quoteCard}>
            <div className={styles.quoteMark} style={editorialStyles.serif}>&ldquo;</div>
            <p className={styles.quoteText} style={editorialStyles.serif}>
              De beste IT-systemen zijn onzichtbaar voor eindgebruikers
              en onmisbaar voor het bedrijf.
            </p>
            <div className={styles.quoteMeta}>
              <span
                style={{
                  ...editorialStyles.mono,
                  fontSize: 11,
                  color: "var(--mint-deep)",
                  letterSpacing: 0.5,
                }}
              >
                uit een gesprek, 2024
              </span>
              <span
                style={{
                  ...editorialStyles.mono,
                  fontSize: 11,
                  color: "var(--ink-3)",
                }}
              >
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
  const items = [
    "AZURE",
    "BUSINESS CENTRAL",
    "FABRIC",
    "COPILOT",
    "CLAUDE",
    "GIULIETTA",
    "159",
    "145",
    "THE BASTARD",
    "KAMADO",
    "FOODIE",
  ];

  return (
    <div className={styles.stripOuter}>
      <div className={styles.stripTrack} style={editorialStyles.mono}>
        {[...items, ...items].map((it, i) => (
          <span key={`${it}-${i}`} className={styles.stripItem}>
            {it}
            <span
              style={{
                width: 4,
                height: 4,
                borderRadius: "50%",
                background: "var(--mint-deep)",
              }}
            />
          </span>
        ))}
      </div>
    </div>
  );
}

export function EdAbout() {
  return (
    <section id="about" className={styles.aboutSection}>
      <div className={styles.sectionHeader} style={{ marginBottom: 56 }}>
        <span
          style={{
            ...editorialStyles.mono,
            fontSize: 11,
            letterSpacing: 1.5,
            textTransform: "uppercase",
            color: "var(--ink-3)",
          }}
        >
          Hoofdstuk Een - Het Vak
        </span>
        <span style={{ ...editorialStyles.mono, fontSize: 11, color: "var(--ink-3)" }}>03</span>
      </div>

      <div className={styles.aboutGrid}>
        <div>
          <h2 id="work" className={styles.aboutTitle} style={editorialStyles.serif}>
            Het werk achter
            <br />
            <em style={{ fontStyle: "italic", color: "var(--mint-deep)" }}>de stilte.</em>
          </h2>
        </div>

        <div className={styles.aboutBody}>
          <p style={{ margin: "0 0 22px" }}>
            <span className={styles.dropcap} style={editorialStyles.serif}>R</span>
            ichard leidt sinds 2021 de IT-afdeling van Harmony Verzekeringen.
            Een team van acht. Een jaarbudget van 2,3 miljoen. Een infrastructuur
            die elke dag zonder ophef moet draaien - want bij een verzekeraar
            zijn de werkdagen van anderen het product.
          </p>
          <p style={{ margin: "0 0 22px" }}>
            Daarvoor: implementatiespecialist, IT-consultant in het MKB, en
            ooit begonnen tussen camera&apos;s en kassasystemen bij Foto Klein.
            Een loopbaan opgebouwd van onderaf - en dat hoor je terug in
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
    <section className={styles.numbersSection}>
      <div className={styles.numbersHeader}>
        <span
          style={{
            ...editorialStyles.mono,
            fontSize: 11,
            letterSpacing: 1.5,
            textTransform: "uppercase",
            color: "#a8d8c8",
          }}
        >
          De cijfers - kort
        </span>
        <span style={{ ...editorialStyles.mono, fontSize: 11, color: "rgba(244,241,234,0.4)" }}>04</span>
      </div>

      <div className={styles.numbersGrid}>
        {items.map((it) => (
          <div key={it.k} className={styles.numberCard}>
            <div className={styles.numberValue} style={editorialStyles.serif}>{it.k}</div>
            <div className={styles.numberLabel}>{it.v}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

export function EdContact() {
  return (
    <section id="contact" className={styles.contactSection}>
      <div className={styles.contactAmpersand} style={editorialStyles.serif}>&amp;</div>

      <div className={styles.sectionHeader} style={{ marginBottom: 48 }}>
        <span
          style={{
            ...editorialStyles.mono,
            fontSize: 11,
            letterSpacing: 1.5,
            textTransform: "uppercase",
            color: "var(--ink-3)",
          }}
        >
          Hoofdstuk Vijf - Contact
        </span>
        <span style={{ ...editorialStyles.mono, fontSize: 11, color: "var(--ink-3)" }}>05</span>
      </div>

      <h2 className={styles.contactTitle} style={editorialStyles.serif}>
        Een goed gesprek
        <br />
        <em style={{ fontStyle: "italic", color: "var(--mint-deep)" }}>begint hier.</em>
      </h2>

      <p className={styles.contactIntro}>
        Open voor gesprekken over IT-strategie, digitale transformatie en
        leiderschap binnen de Nederlandse verzekerings- en techsector.
      </p>

      <div className={styles.contactActions}>
        <a
          href="mailto:rmusters@harmony.nl"
          style={{
            padding: "16px 22px",
            borderRadius: 999,
            background: "var(--ink)",
            color: "var(--bg-sand)",
            fontSize: 14,
            textDecoration: "none",
            display: "inline-flex",
            alignItems: "center",
            gap: 10,
          }}
        >
          rmusters1985@gmail.com
          <span style={{ ...editorialStyles.mono, opacity: 0.6 }}>&rarr;</span>
        </a>

        <a
          href="#"
          style={{
            padding: "16px 22px",
            borderRadius: 999,
            background: "transparent",
            color: "var(--ink)",
            border: "1px solid var(--ink)",
            fontSize: 14,
            textDecoration: "none",
            display: "inline-flex",
            alignItems: "center",
            gap: 10,
          }}
        >
          LinkedIn
          <span style={{ ...editorialStyles.mono, opacity: 0.6 }}>&rarr;</span>
        </a>
      </div>

      <div className={styles.contactFooter} style={editorialStyles.mono}>
        <span>&copy; 2026 Richard Musters &middot; Rotterdam</span>
        <span>Een mooi leven begint * met een Alfa Romeo</span>
      </div>
    </section>
  );
}

export function DarkToggle({ dark, onToggle }: { dark: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label={dark ? "Schakel naar lichte modus" : "Schakel naar donkere modus"}
      className={styles.toggleButton}
    >
      <span
        className={styles.toggleKnob}
        style={{
          left: dark ? 30 : 2,
          background: dark ? "var(--mint-2)" : "var(--mint-deep)",
        }}
      >
        {dark ? "\u263E" : "\u2600"}
      </span>
    </button>
  );
}
