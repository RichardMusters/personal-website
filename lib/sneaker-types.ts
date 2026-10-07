export type Voorkeuren = {
  bezorgland: string;
  maat: string;
  maatSysteem: "EU" | "US";
  merkFilter: string | null;
  maxPrijs: number | null;
  resaleToegestaan: boolean;
};

export type Aanbieding = {
  winkel: string;
  url: string;
  prijs: number | null;
  valuta: string;
  verzendkosten: number | "gratis" | null;
  totaalprijs: number | null;
  verzendingBuitenEU: boolean;
  type: "nieuw" | "resale";
  maatBeschikbaarheid: "beschikbaar" | "uitverkocht" | "onzeker";
  matchZekerheid: "exact" | "waarschijnlijk" | "andere_uitvoering";
  bevestigd: boolean;
  opmerking: string | null;
  // door de server toegevoegd:
  domein?: string;
  voorkeur?: boolean;
  bronGeverifieerd?: boolean;
  bevestigdWeergave?: boolean;
};

export type SneakerResultaat = {
  gevonden: boolean;
  zekerheid: "hoog" | "middel" | "laag";
  sneaker: {
    merk: string | null;
    model: string | null;
    colorway: string | null;
    sku: string | null;
    releasedatum: string | null;
    retailprijs: number | null;
    omschrijving: string | null;
  };
  besteMatchToelichting: string | null;
  alternatieven: { model: string; sku: string | null }[];
  aanbiedingen: Aanbieding[];
  tips: string[];
  // door de server toegevoegd:
  bronnen?: { titel: string; url: string }[];
  waarschuwingen?: string[];
  gecontroleerdOp?: string;
};
