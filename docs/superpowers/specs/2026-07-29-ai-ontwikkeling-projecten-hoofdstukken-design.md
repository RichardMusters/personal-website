# Design: Hoofdstukken "AI & Ontwikkeling" en "Projecten"

## Doel

Richard wil op zijn editorial-style persoonlijke site meer aandacht geven aan zijn AI-interesse en
persoonlijke ontwikkeling, en een plek creëren om sneak previews te tonen van websites die hij bouwt
en MCP's (Model Context Protocol servers) die hij ontwikkelt — zonder de bestaande grafische identiteit
(skyline/Erasmusbrug-animatie, mint/sand-palet, serif+mono editorial-stijl) te verliezen.

## Context — huidige structuur

De site (`app/components/editorial/`) is een doorlopende scroll-pagina opgebouwd uit genummerde
"hoofdstukken", gerenderd door `Editorial.tsx` in deze volgorde: `EdNav → EdHero → EdStrip → EdAbout →
EdNumbers → EdContact` (`Sections.tsx`). Een sticky achtergrond-overlay (`RotterdamSkyline` +
`Erasmusbrug`) crossfade op basis van scroll-progress en loopt door achter alle secties.

Bestaande hoofdstuk-nummering laat ruimte zien voor een 5-delige structuur die nog niet volledig is
ingevuld:

| Sectie | Hoofdstuk-label | Paginanummer |
|---|---|---|
| `EdAbout` | Hoofdstuk Een | 03 |
| `EdNumbers` | *(geen label)* | 04 |
| `EdContact` | Hoofdstuk Vijf | 05 |

Dit ontwerp vult Hoofdstuk Twee, Drie en (het ontbrekende label van) Vier in.

## Architectuur & bestanden

Geen nieuwe subsystemen — we volgen het bestaande patroon 1-op-1:

- **`Sections.tsx`**: twee nieuwe exported componenten, in dezelfde stijl als de bestaande secties:
  - `EdAiDev()` — Hoofdstuk Twee
  - `EdProjects()` — Hoofdstuk Drie
- **`Editorial.module.css`**: nieuwe classes voor deze twee secties (`.aiSection`, `.projectsGrid`,
  `.projectCard`, `.projectTag`, etc.), consistent met bestaande naamgeving en breakpoints
  (`aboutSection`, `numbersGrid`, `numberCard`).
- **`Editorial.tsx`**: `EdAiDev` en `EdProjects` worden ingevoegd tussen `EdAbout` en `EdNumbers`.
  Geen wijzigingen aan de scroll/skyline-logica — de achtergrond-overlay is sectie-onafhankelijk en
  werkt ongewijzigd door.
- Content (placeholder-teksten, project-array) leeft inline in `Sections.tsx`, naar het patroon van de
  `items`-array in `EdNumbers` — makkelijk voor Richard later te vervangen met echte content.
- Geen nieuwe dependencies, geen nieuwe routes.

## Hoofdstuk Twee — "AI & Ontwikkeling"

**Layout:** zelfde ritme als Hoofdstuk Een ("Het Vak") — `sectionHeader` boven, daaronder een
asymmetrische grid: titel links (smalle kolom), lopende tekst met dropcap rechts (brede kolom).
Herbruikt de `.aboutGrid`/`.aboutTitle`/`.aboutBody`/`.dropcap` CSS-patronen (evt. hergenoemd naar een
gedeelde/generieke class of gekopieerd naar een eigen `.aiGrid` als de opmaak licht afwijkt).

- **Header:** `Hoofdstuk Twee — AI & Ontwikkeling` · paginanummer `04`
- **Titel:** *"Leren door / te bouwen."* (serif, tweede regel in mint-italic, zelfde patroon als
  bestaande titels)
- **Body (placeholder tekst, 2 alinea's):**
  - Nadruk op de persoonlijke leer- en ontwikkelreis: van interesse naar zelf actief bouwen met AI.
  - Nadruk op "zelf bouwen" / vibecoding: dat hij actief dingen bouwt met AI — met een knipoog dat deze
    site zelf zo tot stand is gekomen — als opmaat naar de sneak previews in het volgende hoofdstuk.
- Geen kaarten of interactieve elementen in dit hoofdstuk — puur tekstueel, functioneert als
  overgang/inleiding naar "Projecten".

## Hoofdstuk Drie — "Projecten" (sneak previews)

**Layout:** één gemengd grid van kaarten, websites en MCP's samen, onderscheiden via een tag-chip.
Kaartstijl: witte/lichte kaart met dunne rand (zoals `numberCard`), responsive grid met dezelfde
breakpoint-aanpak als `numbersGrid` (4 → 2 → 1 kolommen).

- **Header:** `Hoofdstuk Drie — Projecten` · paginanummer `05`
- **Titel:** *"Sneak previews / uit de werkplaats."*
- **Kaarten (4–6 placeholders, mix van Website en MCP):** elke kaart toont:
  - Tag-chip: `Website` (mint-tint achtergrond) of `MCP` (accent/oranje-tint achtergrond) — enige twee
    kleuren, geen nieuwe kleuren toegevoegd aan het palet
  - Titel (serif, italic)
  - Korte omschrijving (1–2 zinnen, placeholder)
  - Statuslabel in mono, bv. *"In ontwikkeling"*, *"Beschikbaar"*, *"Sneak preview"*
- **Scope-keuze:** geen werkende install-instructies/links voor MCP's in deze iteratie — alleen een
  teaser met statuslabel. Echte install-commando's/downloadlinks worden later per MCP toegevoegd zodra
  die daadwerkelijk klaar is. Dit voorkomt een halfwerkende install-flow.

Placeholder-data leeft als een array van objecten (`{ type: "website" | "mcp", title, description,
status }`) in `Sections.tsx`, gemapt naar kaarten — zelfde patroon als de `items`-array in `EdNumbers`.

## Hernummering & navigatie

| Sectie | Hoofdstuk-label | Paginanummer (nieuw) |
|---|---|---|
| `EdAbout` | Hoofdstuk Een | 03 *(ongewijzigd)* |
| `EdAiDev` (nieuw) | Hoofdstuk Twee | 04 |
| `EdProjects` (nieuw) | Hoofdstuk Drie | 05 |
| `EdNumbers` | **Hoofdstuk Vier** *(label toegevoegd)* | 06 |
| `EdContact` | Hoofdstuk Vijf | 07 |

Wijzigingen aan bestaande componenten: `EdNumbers`-header krijgt het label `Hoofdstuk Vier — De
cijfers` erbij (was ongelabeld); paginanummers van `EdNumbers` (04→06) en `EdContact` (05→07) worden
bijgewerkt.

**Navigatie (`EdNav`):** wordt uitgebreid van `Over / Werk / Contact` naar `Over / Werk / Projecten /
Contact`. De nieuwe link (`#projects`) scrollt naar het Projecten-hoofdstuk. "AI & Ontwikkeling" krijgt
geen eigen navlink — het is de inleiding op "Projecten", niet een eigen bestemming.

## Stijlconsistentie

Alles hergebruikt bestaande tokens (`--mint-deep`, `--accent`, `--ink-3`, `editorialStyles.serif`,
`editorialStyles.mono`) en bestaande CSS-patronen (`sectionHeader`, dropcap-stijl, kaart-met-rand zoals
`numberCard`). Geen nieuwe kleuren, fonts of animatietechnieken. De skyline/Erasmusbrug-achtergrond
blijft ongewijzigd doorlopen achter deze twee nieuwe secties, exact zoals nu achter "Het Vak" en
"Contact" (secties met `position: relative; z-index: 2` en een niet-transparante achtergrond die de
sticky overlay op natuurlijke wijze aan het zicht onttrekt zodra ze in beeld scrollen).

## Testplan

Geen geautomatiseerde tests in dit project (geen testrunner geconfigureerd). Verificatie is handmatig via
`npm run dev`:

- Visuele controle in licht én donker thema (`DarkToggle`)
- Responsive check op desktop, tablet (≤1024px) en mobiel (≤640px) breakpoints
- Scroll-check: skyline/bridge-animatie loopt ongestoord door achter de nieuwe secties
- Nav-check: nieuwe "Projecten"-link scrollt correct naar `#projects`

## Buiten scope

- Werkende install-commando's/downloadlinks per MCP (later, per MCP zodra beschikbaar)
- Screenshots/afbeeldingen van echte websites (nu tekstuele placeholders)
- Een aparte /projecten-pagina of routing — blijft binnen de bestaande single-page scroll
