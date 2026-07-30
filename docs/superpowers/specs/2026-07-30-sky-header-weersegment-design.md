# Design: Levende skyline — zon/maan, ramen, weer- en waterstand-colofon

## Doel

De bestaande scroll-gestuurde skyline-achtergrond (`RotterdamSkyline` + `Erasmusbrug`) moet reageren op
de echte wereld: de zon of maan beweegt over de horizon, ramen gaan aan bij schemer, mist dempt de
skyline, kranen draaien mee met de wind, neerslag valt als hairlines, en de colofonregel in de hero
toont de actuele maand, het weer in Rotterdam, de waterstand van de Maas en de zonsop-/ondergangstijd.

Aangeleverd is een kant-en-klare vanilla-JS module (`sky-header.js` + `sky-header.css` +
`header-data.js` + een eenmalig discovery-script), oorspronkelijk geschreven voor een statische
Astro-header. Dit ontwerp beschrijft hoe die logica wordt overgenomen in de bestaande React/Next.js-
architectuur van deze site, zonder de huidige skyline-tekening visueel te veranderen.

**Harde eis (van de gebruiker):** het standaard uiterlijk van `RotterdamSkyline.tsx` en
`Erasmusbrug.tsx` (dag, geen wind, geen neerslag) moet pixel-identiek blijven aan de huidige staat.
Technische aanpassingen aan de SVG-markup zijn toegestaan zolang dat gegarandeerd is.

## Context — wat er al is

- `Editorial.tsx` (`"use client"`) rendert `RotterdamSkyline` en `Erasmusbrug` binnen een sticky,
  fixed-viewport overlay (`backgroundViewport`, `position: sticky; top:0; height:0`) die meescrollt.
  Een `progress`-waarde (0–1, afgeleid van `window.scrollY`) stuurt de crossfade: de skyline vervaagt
  (`op = max(0, 1 - progress*1.6)`), de brug vervaagt juist in (`op = clamp((progress-0.2)*1.4, 0, 1)`).
- `RotterdamSkyline.tsx`: één `<svg viewBox="0 0 1600 240">` met hairline-gebouwen. Vier gebouwen hebben
  verdiepingslijnen (volle-breedte `<line>`s, geen losse ramen): Delftse Poort (twee torens, x515–555 en
  x565–605), De Rotterdam (drie torens, x715–770 / 775–830 / 840–890), Maastoren (x960–1000, 18 lijnen),
  Montevideo (x1020–1065). Drie havenkranen zijn elk vier `<line>`s (mast, giek, twee schoren) in één
  gezamenlijke `<g stroke="var(--skyline-stroke)">`, zonder scheiding tussen giek en mast.
- `Erasmusbrug.tsx`: los `<svg viewBox="0 0 1600 600">`, geen ramen of kranen — blijft in dit ontwerp
  volledig ongewijzigd.
- `EdHero` (`Sections.tsx`) rendert de colofonregel (`heroMeta`, twee `<span>`s): links
  `"No. 01 · Rotterdam · 51.92N 4.48E"`, rechts hardcoded `"Editie / Mei 2026"`.
- Kleurtokens: `--skyline-stroke`, `--skyline-fill-light`, `--mint-deep`, `--ink-3` (licht/donker-thema
  via `tokens.ts`, zie eerdere feature).
- Geen bestaande API-routes (`app/api/` bestaat nog niet). Site is Next.js 16 App Router, build output
  toont statische prerendering; hosting is Vercel (`@vercel/analytics` als dependency).

## Vooronderzoek — twee correcties op de aangeleverde bijlage

Tijdens het brainstormen zijn beide externe API's live getest (met `curl`/`node --experimental-fetch`
vanaf deze machine):

1. **Het waterstand-station uit de bijlage bestaat niet zoals verwacht.** `rotterdam.nieuwemaas.boompjes`
   (dichtst bij de site-coördinaten 51.92/4.48) geeft alléén `"verwachting"` (modelvoorspelling), geen
   echte meting — een `OphalenWaarnemingen`-verzoek met `ProcesType: "meting"` retourneert `204 No
   Content`. **`hoekvanholland`** (het hoofdmeetpunt bij de Nieuwe Waterweg, dat Rijkswaterstaat zelf
   ook als referentie voor de Rotterdamse vaarweg gebruikt) geeft wél live metingen
   (geverifieerd: `+110 cm NAP` op 2026-07-30 15:10 lokale tijd). Dit station wordt gebruikt.
2. **Het requestschema in `header-data.js` is verouderd.** De live `OphalenWaarnemingen`-endpoint
   verwacht:
   ```json
   {
     "Locatie": { "Code": "hoekvanholland" },
     "AquoPlusWaarnemingMetadata": {
       "AquoMetadata": { "Compartiment": { "Code": "OW" }, "Grootheid": { "Code": "WATHTE" } },
       "AquoPlusObservationMetadata": { "ProcesType": "meting" }
     },
     "Periode": { "Begindatumtijd": "...", "Einddatumtijd": "..." }
   }
   ```
   (enkelvoud `Locatie`, niet `LocatieLijst`; en een verplicht `AquoPlusObservationMetadata`-veld dat in
   de bijlage ontbrak). De catalogus-endpoint (`OphalenCatalogus`, gebruikt om het station te vinden)
   werkte wel exact zoals in de bijlage beschreven — dat deel is correct en hoeft niet aangepast.

Er wordt geen los discovery-script (`scripts/find-maas-station.mjs`) meegenomen in de repository: dat
was een eenmalig hulpmiddel en het antwoord (`hoekvanholland`) ligt al vast in de implementatie.

## Architectuur

De vanilla-JS module wordt **niet** 1-op-1 ingehangen (die doet directe DOM-manipulatie op één
statische SVG en kent geen scroll-crossfade). In plaats daarvan:

- De **pure, framework-onafhankelijke functies** (zonsopkomst/-ondergang, maanfase, deterministische
  hash, windrichting-kompas, Beaufort, WMO-weercode → conditie) worden vrijwel ongewijzigd overgenomen
  als TypeScript-functies.
- De **DOM-manipulatie** (`initSkyHeader`) wordt herschreven als een React hook die dezelfde berekening
  doet maar een state-object teruggeeft in plaats van de DOM direct te wijzigen.
- Die state wordt als **props** doorgegeven aan de bestaande skyline-component (ramen aan/uit,
  kraanhoeken, mist-factor) en aan een **nieuwe overlay-component** (zon/maan, neerslag).

### Nieuwe bestanden

- `app/components/editorial/sky/astronomy.ts` — `solarTimes(date, lat, lon)`, `moonPhase(date)`. Pure
  functies, direct overgenomen uit de bijlage (identieke NOAA/SunCalc-berekening), met TypeScript-types.
- `app/components/editorial/sky/weather.ts` — `hash(seed)`, `compass(degrees)`, `beaufort(kmh)`,
  `condition(code)`. Pure functies, direct overgenomen uit de bijlage.
- `app/components/editorial/sky/useSkyState.ts` — React hook. Input: `weather: HeaderData | null`,
  `now: Date`, `progress: number` (scroll-progress, voor de opacity-koppeling). Output (zie "Hook-
  contract" hieronder).
- `app/components/editorial/sky/SkyOverlay.tsx` — twee named exports:
  - `SkyCelestial({ now, progress })`: tekent de zon (cirkel + stralen bij helder weer) of maan
    (verlichte maansikkel naar maanfase) op een boog over de horizonlijn, zelfde `viewBox="0 0 1600
    240"` en positionering (`position:absolute;top:0;width:100%;height:240`) als `RotterdamSkyline`, zodat
    beide exact op elkaar uitgelijnd liggen. Vervaagt met dezelfde `progress`-formule als de skyline.
  - `SkyPrecipitation({ conditionMode, reduceMotion })`: tekent regen/sneeuw-hairlines (hash-gepositioneerd,
    identiek aan de bijlage) wanneer `conditionMode` `rain`, `storm` of `snow` is. Rendert `null` bij
    andere condities. Geen scroll-fade (neerslag hoort bij het hele scherm, niet gekoppeld aan de
    skyline-laag).
  - Beide componenten: `aria-hidden="true"`, `pointer-events: none`.
- `app/api/header-data/route.ts` — Next.js Route Handler:
  - `fetchWeather()`: Open-Meteo, ongewijzigd t.o.v. bijlage.
  - `fetchWaterLevel()`: Rijkswaterstaat, met het gecorrigeerde schema en `MAAS_STATION = "hoekvanholland"`.
  - `getHeaderData()`: `Promise.allSettled` van beide, merged in één object; faalt een bron, dan
    ontbreekt alleen dat veld in de response (geen error voor de hele request).
  - `export async function GET()`: retourneert JSON met
    `Cache-Control: public, max-age=0, s-maxage=900, stale-while-revalidate=3600`.
  - `export const revalidate = 900;`

### Aangepaste bestanden

- **`RotterdamSkyline.tsx`**:
  - Props uitgebreid: `progress: number` (al aanwezig), `litWindows?: ReadonlySet<number>` (default
    leeg), `craneAngles?: readonly [number, number, number]` (default `[0,0,0]`), `hazeFactor?: number`
    (default `1`).
  - **Ramen (puur additief):** voor elke bestaande verdiepingslijn worden 2–4 nieuwe `<rect>`-elementen
    toegevoegd in de ruimte tussen die lijn en de volgende (of de top van de toren voor de bovenste
    verdieping). Elk raam krijgt een oplopende index `i` en een class die standaard `fill-opacity: 0`
    en géén stroke heeft (dus 100% onzichtbaar in rust) — de bestaande verdiepingslijnen zelf worden
    niet aangeraakt. `litWindows.has(i)` bepaalt of een raam de "aan"-class krijgt.
  - **Kranen (structureel, visueel neutraal):** de horizontale gieklijn (en de bijbehorende schoorlijn)
    van elke kraan verhuist naar een eigen `<g style={{ transform: `rotate(${angle}deg)`, transformOrigin: ... }}>`,
    met de rotatie-oorsprong op de top van de mast. Bij `angle = 0` (default, of wanneer er nog geen
    winddata is) is dit pixel-identiek aan de huidige rechte kranen.
  - **Mist:** de bestaande `op`-berekening (`Math.max(0, 1 - progress*1.6)`) wordt vermenigvuldigd met
    `hazeFactor` (default `1`, `~0.4` bij weercode `fog`) — geen aparte "verre gebouwen"-groep nodig.
- **`Editorial.tsx`**:
  - Nieuwe state: `weather` (via `fetch('/api/header-data')`, één keer bij mount + elke 15 minuten,
    faal-stil net als de bijlage), `now` (via `setInterval` elke 60s, zelfde ritme als de bijlage's
    `paint`-interval).
  - `useSkyState(weather, now, progress)` levert de props voor `RotterdamSkyline` (`litWindows`,
    `craneAngles`, `hazeFactor`) en voor `SkyCelestial`/`SkyPrecipitation`.
  - `<SkyCelestial>` wordt vóór `<RotterdamSkyline>` gerenderd (zon/maan achter de gebouwen), en
    `<SkyPrecipitation>` na `<Erasmusbrug>` (neerslag over de hele scène).
- **`Sections.tsx`** (`EdHero`'s `heroMeta`):
  - Linker `<span>`: bestaande tekst blijft, met een vierde, optioneel segment
    `· Maas {teken}{waarde} m NAP` dat alleen gerenderd wordt als de waterstand beschikbaar is (geen
    placeholder-spatie in de tussentijd).
  - Rechter `<span>`: `"Editie / Mei 2026"` wordt vervangen door drie segmenten, gescheiden door `·`:
    **maand** (client-berekend via `Intl.DateTimeFormat('nl-NL', { month: 'long', year: 'numeric' })`,
    direct beschikbaar na mount, geen fetch nodig), **weer** (`18° onbewolkt · wind ZW 3`, verborgen tot
    de fetch klaar is), **zon op/onder** (client-berekend via `astronomy.ts`, direct beschikbaar).
  - Deze twee spans krijgen hun content van `Editorial.tsx` doorgegeven via props (`EdHero` wordt van
    een parameterloze naar een props-ontvangende component; de huidige harde-coded meta-strings
    verdwijnen).
- **`Editorial.module.css`**: nieuwe classes `.skyWindow` / `.skyWindowLit` (fill-opacity transitie,
  `transition-delay` per raam-index — zelfde 55ms-cascade als de bijlage), `.skyCraneJib` (transitie op
  `transform`), `.skyDrop` / `.skyFlake` (neerslag-animaties + `@keyframes`), en een
  `@media (prefers-reduced-motion: reduce)` blok dat al deze transities/animaties uitschakelt — vrijwel
  1-op-1 overgenomen uit `sky-header.css`, met `var(--sky-ink)` vervangen door de bestaande
  `var(--skyline-stroke)` / `var(--mint-deep)` tokens (geen nieuwe kleuren nodig).

## Hook-contract: `useSkyState(weather, now, progress)`

```ts
type SkyState = {
  isDay: boolean;
  conditionMode: "clear" | "cloud" | "fog" | "rain" | "snow" | "storm";
  litWindows: ReadonlySet<number>;
  craneAngles: readonly [number, number, number];
  hazeFactor: number;
  colophon: {
    month: string;              // altijd beschikbaar
    weather: string | null;     // null tot fetch klaar is
    water: string | null;       // null tot fetch klaar is (of bij fetch-fout)
    sun: string;                 // altijd beschikbaar
  };
};
```

`litWindows` wordt per raam-index bepaald met dezelfde deterministische hash + `daySeed` als de
bijlage (zelfde dag = zelfde ramen, andere dag = ander patroon, cascade van links naar rechts via
CSS `transition-delay`, niet via JS-timing).

## Scope binnen deze feature

- Zon/maan-boog over de horizon (dag/nacht, maanfase).
- Ramen die aangaan bij schemer (deterministisch, cascaderend).
- Kranen die meedraaien met de windrichting.
- Mist-demping van de hele skyline bij weercode "mist".
- Neerslag-hairlines bij regen/sneeuw/onweer.
- Colofonregel: maand, weer, waterstand, zonsop-/ondergang — met graceful degradation per bron.
- `prefers-reduced-motion`: neerslag animeert niet, ramen/kranen springen zonder transitie.
- Toegankelijkheid: alle nieuwe SVG-lagen `aria-hidden`; colofontekst is echte DOM-tekst.
- Mobiel (≤640px): waterstand-segment mag als eerste wegvallen bij ruimtenood (zelfde volgorde als de
  bijlage aanraadt); geen aparte layout-herbouw nodig, de bestaande `heroMeta`-wrap-styling volstaat.

## Buiten scope

- Het discovery-script (`find-maas-station.mjs`) — eenmalig, antwoord al gevonden en verwerkt.
- Wijzigingen aan `Erasmusbrug.tsx` — geen ramen/kranen aanwezig, blijft ongewijzigd.
- Herontwerp van de skyline-tekening zelf (nieuwe gebouwen, andere silhouetten) — expliciet uitgesloten
  door de gebruiker.
- Server-side caching op een andere laag dan Next.js' eigen `revalidate` / `Cache-Control` (geen Redis
  o.i.d. — 900s edge-cache via Vercel is voldoende voor dit verkeer).

## Testplan

Geen geautomatiseerde testsuite in dit project. Verificatie:
- `npm run lint` + `npm run build` na elke stap.
- Server-rendered HTML-check (curl) voor de colofonsegmenten en de `/api/header-data`-response.
- Handmatige browser-QA door de gebruiker na de belangrijkste stappen (SVG-annotatie, API-route, module
  inhangen) via een lokale dev-URL — dezelfde beperking als bij de vorige feature: geen headless
  browser beschikbaar in deze omgeving voor screenshots.
- Visuele nulmeting: vóór en na de SVG-wijzigingen moet de skyline er (bij `litWindows` leeg,
  `craneAngles=[0,0,0]`, `hazeFactor=1`) identiek uitzien — te controleren door de gerenderde SVG-markup
  te vergelijken op alle bestaande `<path>`/`<line>`-elementen (die mogen niet wijzigen), plus een
  visuele check door de gebruiker.
