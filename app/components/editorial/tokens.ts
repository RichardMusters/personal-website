// app/components/editorial/tokens.ts
// Light + dark palette tokens — applied as CSS custom properties on the
// page wrapper so every var(--bg-sand) etc. flips automatically.

export const lightTokens: Record<string, string> = {
  "--bg-sand": "#f4f1ea",
  "--bg-sand-2": "#ebe6db",
  "--ink": "#1a2426",
  "--ink-2": "#3b4a4d",
  "--ink-3": "#6b7a7d",
  "--mint": "#a8d8c8",
  "--mint-2": "#7cc4af",
  "--mint-deep": "#2f6b5a",
  "--mint-tint": "#d8ede5",
  "--accent": "#ff6f3c",
  "--line": "rgba(26,36,38,0.10)",
  "--skyline-stroke": "rgba(47,107,90,0.45)",
  "--skyline-fill-light": "rgba(47,107,90,0.22)",
  "--bridge-stroke-top": "rgba(47,107,90,0.55)",
  "--bridge-stroke-bot": "rgba(47,107,90,0.05)",
};

export const darkTokens: Record<string, string> = {
  "--bg-sand": "#16191b",
  "--bg-sand-2": "#1d2123",
  "--ink": "#fbf6e9",
  "--ink-2": "#dad3c1",
  "--ink-3": "#9aa39f",
  "--mint": "#7cc4af",
  "--mint-2": "#a8d8c8",
  "--mint-deep": "#a8d8c8",
  "--mint-tint": "#1f2d2a",
  "--accent": "#ff8a5b",
  "--line": "rgba(240,236,226,0.10)",
  "--skyline-stroke": "rgba(168,216,200,0.55)",
  "--skyline-fill-light": "rgba(168,216,200,0.28)",
  "--bridge-stroke-top": "rgba(168,216,200,0.65)",
  "--bridge-stroke-bot": "rgba(168,216,200,0.05)",
};

export const editorialStyles = {
  page: {
    width: "100%",
    minHeight: "100%",
    background: "var(--bg-sand)",
    color: "var(--ink)",
    fontSize: 16,
    lineHeight: 1.55,
    position: "relative" as const,
    transition: "background-color .35s ease, color .35s ease",
  },
  serif: {
    fontFamily: 'var(--font-fraunces), "Times New Roman", serif',
    fontVariationSettings: '"opsz" 144, "SOFT" 50',
    fontWeight: 380,
  },
  mono: { fontFamily: "var(--font-mono), ui-monospace, monospace" },
};

export const navLink = { color: "inherit" as const, textDecoration: "none" };
