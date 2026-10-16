This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

### Sneakerszoeker (`/sneakers`)

De server gebruikt de OpenAI Responses API met `gpt-6-luna`, `reasoning.effort: low`,
foto-invoer, webzoeken en een vast JSON-schema. Stel lokaal in `.env.local` in:

```dotenv
OPENAI_API_KEY=je_openai_api_sleutel
OPENAI_MODEL=gpt-6-luna
RATE_LIMIT_PER_DAY=10
```

Zet `OPENAI_API_KEY` ook in de environment variables van je hostingomgeving en
deploy opnieuw. Gebruik nooit een `NEXT_PUBLIC_`-prefix voor de sleutel. `.env.local`
wordt niet gecommit. De oude Gemini-variabelen zijn niet meer nodig.

Elke zoekactie doet één modelaanroep, met maximaal drie webtoolaanroepen en een
timeout van 50 seconden. Er is geen automatische herhaling bij lege resultaten.
Positieve tekstresultaten worden vijf minuten per serverinstance gecachet; foto's
niet. Cache en daglimiet zijn in-memory en gelden niet over meerdere instances.

Er zijn nog geen productfeeds of voorraad-API's van winkels aangesloten. De
zoeker gebruikt webbronnen en toont maximaal vijf aanbiedingen. Een aanbieding
moet een URL hebben die terugkomt in de zoekbronnen; voor bevestigde voorraad
moet bovendien een productpagina geopend zijn en het model prijs en maat daarop
bevestigen. Dit blijft een AI-beoordeling, geen onafhankelijke winkelvoorraadcheck.
Oncontroleerbare voorraad wordt als onzeker getoond. Een vaste reactietijd is
niet gegarandeerd.

De vaste winkellijsten staan in `config/shops.json` onder `zoeklijsten`:
`nikeSB` bevat kolom A uit de aangeleverde winkellijst (voorrang bij Nike SB en
SB Dunks); `alleSchoenen` bevat kolom B en wordt bij elke zoekopdracht meegenomen.
Bij een foto of SKU bepaalt het model na herkenning of de SB-lijst relevant is.
Daarnaast blijft een brede zoekactie naar Europese webshops met levering naar
Nederland (of het gekozen bezorgland) verplicht in de prompt. De namen zijn geen
geverifieerde domeinen of bewijs van levering. Binnen het maximum van drie
webtoolaanroepen wordt niet iedere winkel afzonderlijk gecontroleerd.

Controleer de koppeling met `node scripts/test-sneaker-search.cjs` (zonder API-kosten).
Met `node scripts/test-sneaker-search.cjs --live` wordt één echte zoekactie gedaan
met de lokale sleutel; hiervoor gelden OpenAI API- en webzoekkosten.

De resultaatkaart kan apart een productfoto laden via `/api/sneaker-photo`.
Dit gebruikt geen extra OpenAI-aanroep: maximaal twee exacte aanbiedingen worden
op productmetadata gecontroleerd, met een limiet van vijf seconden voor netwerkverzoeken.
JSON-LD moet dezelfde SKU bevatten; de fallback naar `og:image` vereist die SKU
in de pagina-URL of eigen metadata. Zonder passende of laadbare afbeelding blijft
de foto verborgen. Winkels die automatische toegang blokkeren leveren mogelijk
geen foto. De foto wordt direct van de winkel geladen en linkt naar de bron.
De endpoint accepteert alleen tijdelijk ondertekende zoekresultaten, controleert
publieke DNS-adressen en valideert redirects. Test met `node scripts/test-sneaker-photo.cjs`.

Documentatie: [GPT-6 Luna](https://developers.openai.com/api/docs/models/gpt-6-luna)
en [webzoeken](https://developers.openai.com/api/docs/guides/tools-web-search).

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
