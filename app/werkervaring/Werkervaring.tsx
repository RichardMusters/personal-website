"use client";

import type { CSSProperties, ReactNode } from "react";
import ed from "../components/editorial/Editorial.module.css";
import { EditorialShell } from "../components/editorial/Editorial";
import { EdNav, EdContact } from "../components/editorial/Sections";
import { editorialStyles } from "../components/editorial/tokens";
import type { SkyColophon } from "../components/editorial/sky/useSkyState";
import styles from "./werkervaring.module.css";
import {
  headings, intro, facts, roles, featuredLabels, featured, skillsIntro, coreSkillsTitle,
  coreSkills, skills, educationIntro, education, contactIntro,
} from "./data";

const label: CSSProperties = {
  ...editorialStyles.mono,
  fontSize: 11,
  letterSpacing: 1.5,
  textTransform: "uppercase",
  color: "var(--ink-3)",
};

const accent: CSSProperties = { fontStyle: "italic", color: "var(--mint-deep)" };

function SectionHeader({ title, number }: { title: string; number: string }) {
  return (
    <div className={ed.sectionHeader} style={{ marginBottom: 56 }}>
      <span style={label}>- {title}</span>
      <span style={{ ...editorialStyles.mono, fontSize: 11, color: "var(--ink-3)" }}>{number}</span>
    </div>
  );
}

function Heading({ children, style }: { children: ReactNode; style?: CSSProperties }) {
  return (
    <h2 className={ed.aboutTitle} style={{ ...editorialStyles.serif, ...style }}>
      {children}
    </h2>
  );
}

function Hero({ colophon }: { colophon: SkyColophon }) {
  const left = ["No. 02", "Werkervaring", colophon.water].filter((p): p is string => Boolean(p));
  const right = [colophon.month, colophon.weather].filter((p): p is string => Boolean(p));

  return (
    <section className={ed.heroSection}>
      <div
        className={ed.heroMeta}
        style={{ ...editorialStyles.mono, fontSize: 11, color: "var(--ink-3)", letterSpacing: 0.5, textTransform: "uppercase" }}
      >
        <span>{left.join(" · ")}</span>
        <span>{right.join(" · ")}</span>
      </div>

      <div className={ed.heroGrid}>
        <div>
          <div
            style={{
              ...editorialStyles.mono,
              fontSize: 11,
              letterSpacing: 1,
              textTransform: "uppercase",
              color: "var(--mint-deep)",
              marginBottom: 20,
            }}
          >
            {intro.eyebrow}
          </div>
          <h1 className={styles.heroTitle} style={editorialStyles.serif}>
            {headings.hero.title}
            <br />
            <em style={{ ...accent, fontVariationSettings: '"opsz" 144, "SOFT" 100' }}>{headings.hero.accent}</em>
          </h1>
          {intro.paragraphs.map((p, i) => (
            <p
              key={i}
              className={ed.heroIntro}
              style={{ maxWidth: "52ch", marginBottom: i === intro.paragraphs.length - 1 ? 0 : 16 }}
            >
              {p}
            </p>
          ))}
        </div>

        <div className={ed.quoteCard}>
          <div style={{ ...label, color: "var(--mint-deep)", marginBottom: 20 }}>In het kort</div>
          <dl className={styles.facts}>
            {facts.map((f) => (
              <div key={f.label} className={styles.factRow}>
                <dt style={editorialStyles.mono}>{f.label}</dt>
                <dd style={editorialStyles.serif}>{f.value}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </section>
  );
}

function Timeline() {
  return (
    <section id="loopbaan" className={ed.aboutSection}>
      <SectionHeader title={headings.loopbaan.label} number="01" />
      <Heading style={{ marginBottom: 48 }}>
        {headings.loopbaan.title}
        <br />
        <em style={accent}>{headings.loopbaan.accent}</em>
      </Heading>

      <ol className={styles.timeline}>
        {roles.map((r) => (
          <li key={`${r.company}-${r.period}`} className={`${styles.role} ${r.compact ? styles.roleCompact : ""}`}>
            <div className={styles.rolePeriod} style={editorialStyles.mono}>{r.period}</div>
            <div className={styles.roleBody}>
              <h3 className={styles.roleTitle} style={editorialStyles.serif}>
                {r.role}
                <span className={styles.roleCompany}> · {r.company}</span>
              </h3>
              <p className={styles.roleSummary}>{r.summary}</p>
              {r.highlights && (
                <ul className={styles.highlights}>
                  {r.highlights.map((h) => <li key={h}>{h}</li>)}
                </ul>
              )}
              {r.tags && (
                <div className={styles.tags}>
                  {r.tags.map((t) => (
                    <span key={t} className={styles.tag} style={editorialStyles.mono}>{t}</span>
                  ))}
                </div>
              )}
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}

function Featured() {
  return (
    <section className={ed.projectsSection}>
      <SectionHeader title={headings.featured.label} number="02" />
      <Heading style={{ marginBottom: 40 }}>
        {headings.featured.title}
        <br />
        <em style={accent}>{headings.featured.accent}</em>
      </Heading>

      <div className={styles.featuredGrid}>
        {featured.map((p) => (
          <article key={p.title} className={ed.projectCard}>
            <span className={styles.featuredContext} style={editorialStyles.mono}>{p.context}</span>
            <h3 className={ed.projectTitle} style={{ ...editorialStyles.serif, marginTop: 10 }}>{p.title}</h3>
            <dl className={styles.par}>
              <dt style={editorialStyles.mono}>{featuredLabels.problem}</dt>
              <dd>{p.problem}</dd>
              <dt style={editorialStyles.mono}>{featuredLabels.approach}</dt>
              <dd>{p.approach}</dd>
              <dt style={editorialStyles.mono}>{featuredLabels.result}</dt>
              <dd>{p.result}</dd>
            </dl>
            <div className={styles.tags}>
              {p.tags.map((t) => (
                <span key={t} className={styles.tag} style={editorialStyles.mono}>{t}</span>
              ))}
            </div>
            {p.href && (
              <a href={p.href} target="_blank" rel="noreferrer" className={ed.inlineLink} style={editorialStyles.mono}>
                Lees meer &rarr;
              </a>
            )}
          </article>
        ))}
      </div>
    </section>
  );
}

function Skills() {
  return (
    <section className={ed.aboutSection}>
      <SectionHeader title={headings.skills.label} number="03" />
      <div className={ed.aboutGrid}>
        <div>
          <Heading>
            {headings.skills.title}
            <br />
            <em style={accent}>{headings.skills.accent}</em>
          </Heading>
          <p className={styles.sectionIntro}>{skillsIntro}</p>
          <h3 style={{ ...label, color: "var(--mint-deep)", margin: "32px 0 0" }}>{coreSkillsTitle}</h3>
          <ul className={styles.coreList}>
            {coreSkills.map((c) => <li key={c}>{c}</li>)}
          </ul>
        </div>

        <div className={styles.skillGrid}>
          {skills.map((g) => (
            <div key={g.title} className={styles.skillGroup}>
              <h3 style={{ ...label, color: "var(--mint-deep)", margin: "0 0 14px" }}>{g.title}</h3>
              <ul>
                {g.items.map((i) => <li key={i}>{i}</li>)}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Education() {
  return (
    <section className={ed.aboutSection}>
      <SectionHeader title={headings.education.label} number="04" />
      <div className={ed.aboutGrid} style={{ marginBottom: 40 }}>
        <Heading>
          {headings.education.title}
          <br />
          <em style={accent}>{headings.education.accent}</em>
        </Heading>
        <p className={styles.sectionIntro} style={{ marginTop: 0, alignSelf: "end" }}>{educationIntro}</p>
      </div>
      <ul className={styles.education}>
        {education.map((e) => (
          <li key={e.title}>
            <span style={editorialStyles.serif} className={styles.educationTitle}>{e.title}</span>
            {e.org && <span className={styles.educationOrg} style={editorialStyles.mono}>{e.org}</span>}
          </li>
        ))}
      </ul>
    </section>
  );
}

export default function Werkervaring() {
  return (
    <EditorialShell>
      {(colophon) => (
        <>
          <EdNav current="werkervaring" />
          <Hero colophon={colophon} />
          <Timeline />
          <Featured />
          <Skills />
          <Education />
          <EdContact number="05" intro={contactIntro} />
        </>
      )}
    </EditorialShell>
  );
}
