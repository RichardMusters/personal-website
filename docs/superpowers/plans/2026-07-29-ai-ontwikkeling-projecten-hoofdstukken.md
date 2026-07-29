# AI & Ontwikkeling / Projecten Hoofdstukken Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add two new editorial "hoofdstukken" — "AI & Ontwikkeling" and "Projecten" (sneak previews of websites and MCP's) — between the existing "Het Vak" and "De cijfers" sections, and renumber/relabel the sections after them.

**Architecture:** Pure additions to the existing `app/components/editorial/` component set. Two new exported components in `Sections.tsx` (`EdAiDev`, `EdProjects`), new CSS classes in `Editorial.module.css`, one new design token in `tokens.ts`, and a render-order + nav change in `Editorial.tsx`. No new files, no new dependencies, no routing changes.

**Tech Stack:** Next.js 16 (App Router), React 19, TypeScript, CSS Modules. No test runner configured in this project — verification is `npm run lint`, `npm run build`, and manual browser check via `npm run dev`.

---

## Reference: spec

Full design detail lives in `docs/superpowers/specs/2026-07-29-ai-ontwikkeling-projecten-hoofdstukken-design.md`. Read it before starting if anything below is ambiguous.

## File Structure

- **Modify:** `app/components/editorial/tokens.ts` — add `--accent-tint` token (light + dark)
- **Modify:** `app/components/editorial/Sections.tsx` — add `Projecten` nav link, relabel `EdNumbers`/`EdContact` headers, add `EdAiDev` and `EdProjects` components
- **Modify:** `app/components/editorial/Editorial.module.css` — add `.projectsSection`, `.projectsGrid`, `.projectCard`, `.projectTag`, `.projectTagWebsite`, `.projectTagMcp`, `.projectTitle`, `.projectDescription`, `.projectStatus`, plus responsive overrides
- **Modify:** `app/components/editorial/Editorial.tsx` — import and render `EdAiDev`, `EdProjects` between `EdAbout` and `EdNumbers`

---

### Task 1: Add `--accent-tint` design token

**Files:**
- Modify: `app/components/editorial/tokens.ts:14-21` (lightTokens) and `tokens.ts:34-39` (darkTokens)

The "MCP" tag chip in the new Projecten grid needs a tinted-orange background to match the existing `--accent` color, the same way `--mint-tint` backs the "Website" tag. Add one token per theme.

- [ ] **Step 1: Add the light theme token**

In `app/components/editorial/tokens.ts`, find this block (end of `lightTokens`):

```ts
  "--bridge-stroke-top": "rgba(47,107,90,0.55)",
  "--bridge-stroke-bot": "rgba(47,107,90,0.05)",
};
```

Replace with:

```ts
  "--bridge-stroke-top": "rgba(47,107,90,0.55)",
  "--bridge-stroke-bot": "rgba(47,107,90,0.05)",
  "--accent-tint": "#ffe3d6",
};
```

- [ ] **Step 2: Add the dark theme token**

Find this block (end of `darkTokens`):

```ts
  "--bridge-stroke-top": "rgba(168,216,200,0.65)",
  "--bridge-stroke-bot": "rgba(168,216,200,0.05)",
};
```

Replace with:

```ts
  "--bridge-stroke-top": "rgba(168,216,200,0.65)",
  "--bridge-stroke-bot": "rgba(168,216,200,0.05)",
  "--accent-tint": "#3a2620",
};
```

- [ ] **Step 3: Verify**

Run: `npm run lint`
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add app/components/editorial/tokens.ts
git commit -m "Add --accent-tint design token for MCP tag chips"
```

---

### Task 2: Add "Projecten" link to the navigation

**Files:**
- Modify: `app/components/editorial/Sections.tsx:17-21` (`EdNav`)

- [ ] **Step 1: Add the nav link**

Find:

```tsx
      <nav className={styles.navLinks}>
        <a style={navLink} href="#about">Over</a>
        <a style={navLink} href="#work">Werk</a>
        <a style={navLink} href="#contact">Contact</a>
      </nav>
```

Replace with:

```tsx
      <nav className={styles.navLinks}>
        <a style={navLink} href="#about">Over</a>
        <a style={navLink} href="#work">Werk</a>
        <a style={navLink} href="#projects">Projecten</a>
        <a style={navLink} href="#contact">Contact</a>
      </nav>
```

- [ ] **Step 2: Verify**

Run: `npm run lint`
Expected: no errors. (The `#projects` anchor doesn't exist yet — that lands in Task 5. This is just the nav link.)

- [ ] **Step 3: Commit**

```bash
git add app/components/editorial/Sections.tsx
git commit -m "Add Projecten link to site navigation"
```

---

### Task 3: Renumber the "De cijfers" and "Contact" chapter headers

**Files:**
- Modify: `app/components/editorial/Sections.tsx:243-255` (`EdNumbers`)
- Modify: `app/components/editorial/Sections.tsx:275-287` (`EdContact`)

Inserting two new chapters (Hoofdstuk Twee, Drie) after "Het Vak" (Hoofdstuk Een) means "De cijfers" becomes Hoofdstuk Vier at page 06, and "Contact" (already Hoofdstuk Vijf) moves to page 07.

- [ ] **Step 1: Relabel and renumber `EdNumbers`' header**

Find:

```tsx
        >
          De cijfers - kort
        </span>
        <span style={{ ...editorialStyles.mono, fontSize: 11, color: "rgba(244,241,234,0.4)" }}>04</span>
      </div>
```

Replace with:

```tsx
        >
          Hoofdstuk Vier - De cijfers
        </span>
        <span style={{ ...editorialStyles.mono, fontSize: 11, color: "rgba(244,241,234,0.4)" }}>06</span>
      </div>
```

- [ ] **Step 2: Renumber `EdContact`'s page number**

Find:

```tsx
          Hoofdstuk Vijf - Contact
        </span>
        <span style={{ ...editorialStyles.mono, fontSize: 11, color: "var(--ink-3)" }}>05</span>
      </div>
```

Replace with:

```tsx
          Hoofdstuk Vijf - Contact
        </span>
        <span style={{ ...editorialStyles.mono, fontSize: 11, color: "var(--ink-3)" }}>07</span>
      </div>
```

- [ ] **Step 3: Verify**

Run: `npm run lint`
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add app/components/editorial/Sections.tsx
git commit -m "Renumber De cijfers and Contact chapter headers"
```

---

### Task 4: Build the "AI & Ontwikkeling" chapter (`EdAiDev`)

**Files:**
- Modify: `app/components/editorial/Sections.tsx` — add new export after `EdAbout` (which currently ends at line 231) and before `EdNumbers` (line 233)

This chapter reuses the existing `.aboutSection` / `.aboutGrid` / `.aboutTitle` / `.aboutBody` / `.dropcap` CSS classes from "Het Vak" — no new CSS needed, since the layout is intentionally identical (confirmed during design: Option A, "zelfde ritme als Het Vak").

- [ ] **Step 1: Add the `EdAiDev` component**

In `app/components/editorial/Sections.tsx`, find the closing brace of `EdAbout` followed by the start of `EdNumbers`:

```tsx
export function EdNumbers() {
```

Insert this new function immediately **before** that line (i.e. right after `EdAbout`'s closing `}`):

```tsx
export function EdAiDev() {
  return (
    <section className={styles.aboutSection}>
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
          Hoofdstuk Twee - AI & Ontwikkeling
        </span>
        <span style={{ ...editorialStyles.mono, fontSize: 11, color: "var(--ink-3)" }}>04</span>
      </div>

      <div className={styles.aboutGrid}>
        <div>
          <h2 className={styles.aboutTitle} style={editorialStyles.serif}>
            Leren door
            <br />
            <em style={{ fontStyle: "italic", color: "var(--mint-deep)" }}>te bouwen.</em>
          </h2>
        </div>

        <div className={styles.aboutBody}>
          <p style={{ margin: "0 0 22px" }}>
            <span className={styles.dropcap} style={editorialStyles.serif}>I</span>
            k verdiep me steeds meer in wat AI kan betekenen voor mijn werk en mijn eigen
            ontwikkeling. Niet alleen lezen erover, maar het zelf uitproberen en bouwen &mdash;
            stap voor stap, project voor project.
          </p>
          <p style={{ margin: 0 }}>
            Deze website is daar zelf een voorbeeld van: ontworpen en gebouwd samen met AI. Het is
            een doorlopend proces van proberen, vastlopen en weer verder &mdash; en precies dat
            proces deel ik hierna, in het volgende hoofdstuk.
          </p>
        </div>
      </div>
    </section>
  );
}

export function EdNumbers() {
```

- [ ] **Step 2: Verify**

Run: `npm run lint`
Expected: no errors. `EdAiDev` is not yet imported/rendered anywhere — that's expected until Task 6, and lint doesn't flag unused exports.

- [ ] **Step 3: Commit**

```bash
git add app/components/editorial/Sections.tsx
git commit -m "Add EdAiDev chapter component"
```

---

### Task 5: Build the "Projecten" chapter (`EdProjects`) with CSS

**Files:**
- Modify: `app/components/editorial/Sections.tsx` — add `EdProjects` (and its placeholder data) after `EdAiDev`, before `EdNumbers`
- Modify: `app/components/editorial/Editorial.module.css` — add project grid/card classes and responsive overrides

- [ ] **Step 1: Add the CSS classes**

In `app/components/editorial/Editorial.module.css`, find:

```css
.numbersSection {
```

Insert this block immediately **before** it:

```css
.projectsSection {
  padding: clamp(64px, 8vw, 96px) clamp(20px, 4vw, 56px);
  position: relative;
  z-index: 2;
}

.projectsGrid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 20px;
}

.projectCard {
  border: 1px solid var(--line);
  border-radius: 6px;
  padding: 22px;
  background: var(--bg-sand-2);
}

.projectTag {
  display: inline-block;
  font-size: 10px;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  padding: 4px 10px;
  border-radius: 999px;
  margin-bottom: 14px;
}

.projectTagWebsite {
  background: var(--mint-tint);
  color: var(--mint-deep);
}

.projectTagMcp {
  background: var(--accent-tint);
  color: var(--accent);
}

.projectTitle {
  font-size: 1.25rem;
  line-height: 1.15;
  margin: 0 0 8px;
}

.projectDescription {
  font-size: 0.9375rem;
  line-height: 1.5;
  color: var(--ink-2);
  margin: 0 0 16px;
}

.projectStatus {
  font-size: 11px;
  color: var(--ink-3);
  letter-spacing: 0.3px;
}

.numbersSection {
```

- [ ] **Step 2: Add responsive overrides for the projects grid**

Find (inside the `@media (max-width: 1024px)` block):

```css
  .numbersGrid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 24px;
  }
```

Replace with:

```css
  .numbersGrid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 24px;
  }

  .projectsGrid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 16px;
  }
```

- [ ] **Step 3: Add mobile override**

Find (inside the `@media (max-width: 640px)` block):

```css
  .numbersGrid {
    grid-template-columns: 1fr;
    gap: 20px;
  }
```

Replace with:

```css
  .numbersGrid {
    grid-template-columns: 1fr;
    gap: 20px;
  }

  .projectsGrid {
    grid-template-columns: 1fr;
    gap: 14px;
  }
```

- [ ] **Step 4: Add the `EdProjects` component and placeholder data**

In `app/components/editorial/Sections.tsx`, find the line added in Task 4:

```tsx
export function EdNumbers() {
```

Insert this new code immediately **before** it (i.e. right after `EdAiDev`'s closing `}`):

```tsx
type ProjectPreview = {
  type: "website" | "mcp";
  title: string;
  description: string;
  status: string;
};

const projectPreviews: ProjectPreview[] = [
  {
    type: "website",
    title: "Project Alpha",
    description: "Sneak preview van een nieuwe website — meer details volgen binnenkort.",
    status: "In ontwikkeling",
  },
  {
    type: "website",
    title: "Project Beta",
    description: "Een tweede website-project, nog in de steigers.",
    status: "Sneak preview",
  },
  {
    type: "mcp",
    title: "tool-runner-mcp",
    description: "MCP server voor het uitvoeren van taken vanuit een AI-assistent.",
    status: "In ontwikkeling",
  },
  {
    type: "mcp",
    title: "notion-sync-mcp",
    description: "MCP server die notities synchroniseert met een AI-workflow.",
    status: "Beschikbaar",
  },
];

export function EdProjects() {
  return (
    <section id="projects" className={styles.projectsSection}>
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
          Hoofdstuk Drie - Projecten
        </span>
        <span style={{ ...editorialStyles.mono, fontSize: 11, color: "var(--ink-3)" }}>05</span>
      </div>

      <h2 className={styles.aboutTitle} style={{ ...editorialStyles.serif, marginBottom: 40 }}>
        Sneak previews
        <br />
        <em style={{ fontStyle: "italic", color: "var(--mint-deep)" }}>uit de werkplaats.</em>
      </h2>

      <div className={styles.projectsGrid}>
        {projectPreviews.map((project) => (
          <div key={project.title} className={styles.projectCard}>
            <span
              className={`${styles.projectTag} ${
                project.type === "website" ? styles.projectTagWebsite : styles.projectTagMcp
              }`}
              style={editorialStyles.mono}
            >
              {project.type === "website" ? "Website" : "MCP"}
            </span>
            <h3 className={styles.projectTitle} style={editorialStyles.serif}>
              {project.title}
            </h3>
            <p className={styles.projectDescription}>{project.description}</p>
            <span className={styles.projectStatus} style={editorialStyles.mono}>
              {project.status}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}

export function EdNumbers() {
```

- [ ] **Step 5: Verify**

Run: `npm run lint`
Expected: no errors.

- [ ] **Step 6: Commit**

```bash
git add app/components/editorial/Sections.tsx app/components/editorial/Editorial.module.css
git commit -m "Add EdProjects chapter with sneak-preview card grid"
```

---

### Task 6: Render the new chapters and verify the full page

**Files:**
- Modify: `app/components/editorial/Editorial.tsx`

- [ ] **Step 1: Import the new components**

Find:

```tsx
import {
  EdNav, EdHero, EdStrip, EdAbout, EdNumbers, EdContact, DarkToggle,
} from "./Sections";
```

Replace with:

```tsx
import {
  EdNav, EdHero, EdStrip, EdAbout, EdAiDev, EdProjects, EdNumbers, EdContact, DarkToggle,
} from "./Sections";
```

- [ ] **Step 2: Render them between `EdAbout` and `EdNumbers`**

Find:

```tsx
      <EdNav />
      <EdHero />
      <EdStrip />
      <EdAbout />
      <EdNumbers />
      <EdContact />
```

Replace with:

```tsx
      <EdNav />
      <EdHero />
      <EdStrip />
      <EdAbout />
      <EdAiDev />
      <EdProjects />
      <EdNumbers />
      <EdContact />
```

- [ ] **Step 3: Verify the build**

Run: `npm run lint`
Expected: no errors.

Run: `npm run build`
Expected: build succeeds with no TypeScript errors.

- [ ] **Step 4: Manual QA in the browser**

Run: `npm run dev`, open `http://localhost:3000`, and check:

- Scroll order: Nav → Hero → Strip → Het Vak (Hoofdstuk Een, 03) → AI & Ontwikkeling (Hoofdstuk Twee, 04) → Projecten (Hoofdstuk Drie, 05) → De cijfers (Hoofdstuk Vier, 06) → Contact (Hoofdstuk Vijf, 07)
- Clicking "Projecten" in the nav scrolls to the new card grid
- Toggle dark mode (top-left switch) — both new sections should flip colors correctly along with the rest of the page
- The skyline/Erasmusbrug background animation still crossfades smoothly behind every section while scrolling
- Resize to tablet (~900px) and mobile (~400px) widths — the projects grid should drop to 2 then 1 columns, and text should remain readable (no overflow)

- [ ] **Step 5: Commit**

```bash
git add app/components/editorial/Editorial.tsx
git commit -m "Render AI & Ontwikkeling and Projecten chapters on the page"
```

---

## Self-Review Notes

- **Spec coverage:** Task 2 covers nav; Tasks 4-5 cover both new chapters' content/layout/card grid; Task 3 covers renumbering; Task 6 covers wiring + the manual QA the spec calls for. Real install links/screenshots are explicitly out of scope per the spec and not included here.
- **Type consistency:** `ProjectPreview.type` is `"website" | "mcp"`, matched exactly in the `project.type === "website"` checks and the `styles.projectTagWebsite` / `styles.projectTagMcp` branches — no drift between the type definition and its usage.
- **Placeholder scan:** All copy, card data, and CSS values are concrete — nothing marked TBD.
