// app/werkervaring/data.ts
// Alle inhoud van /werkervaring staat hier. Pas alleen dit bestand aan om
// teksten, rollen, projecten of skills bij te werken — de layout volgt vanzelf.

export type Role = {
  company: string;
  role: string;
  period: string;
  /** Korte omschrijving van de rol. */
  summary: string;
  /** Concrete wapenfeiten, geen takenlijst. */
  highlights?: string[];
  tags?: string[];
  /** Oudere rollen tonen we compacter. */
  compact?: boolean;
};

export type FeaturedProject = {
  title: string;
  context: string;
  problem: string;
  approach: string;
  result: string;
  tags: string[];
  href?: string;
};

export type SkillGroup = { title: string; items: string[] };

/** Koppen per sectie: `title` is de eerste regel, `accent` de cursieve groene regel. */
export const headings = {
  hero: { title: "Van monteur", accent: "tot IT-manager." },
  loopbaan: { label: "Loopbaan", title: "Wat ik doe.", accent: "En hoe ik hier kwam." },
  featured: { label: "Uitgelichte projecten", title: "Werk waar ik", accent: "trots op ben." },
  skills: { label: "Kennis & gereedschap", title: "Waar ik", accent: "mee werk." },
  education: { label: "Opleidingen & ontwikkeling", title: "Blijven leren", accent: "hoort erbij." },
};

export const intro = {
  eyebrow: "- Werkervaring · 2002 – heden -",
  paragraphs: [
    "Mijn loopbaan begon met het repareren van wit- en bruingoed. Daarna volgden een eigen " +
      "computerzaak, de klantenservice en het aansturen van een team. Inmiddels ben ik IT-manager.",
    "Die praktijkervaring neem ik iedere dag mee. Ik weet hoe prettig het werkt als systemen je " +
      "helpen, en hoe frustrerend het is als ze in de weg zitten. Daarom zoek ik naar oplossingen " +
      "die technisch goed in elkaar zitten én het dagelijkse werk makkelijker maken.",
  ],
};

export const facts = [
  { label: "Nu", value: "IT-manager bij Harmony Service Center" },
  { label: "Bij Harmony sinds", value: "2012" },
  { label: "Standplaats", value: "Rotterdam" },
];

export const roles: Role[] = [
  {
    company: "Harmony Service Center",
    role: "IT-manager",
    period: "2022 – heden",
    summary:
      "Ik ben verantwoordelijk voor de IT-strategie, applicatieontwikkeling en het verbeteren van " +
      "onze digitale omgeving. Ik vertaal vragen uit de organisatie naar praktische oplossingen en " +
      "houd daarbij grip op beveiliging, prestaties en kosten.",
    highlights: [
      "AI en automatisering ingevoerd met n8n, Claude en Copilot: van de eerste experimenten naar toepassingen in het dagelijkse werk.",
      "Monitoring van Azure ingericht en verbeterd, zodat prestaties en kosten structureel inzichtelijk zijn.",
      "Externe ontwikkelpartners aangestuurd en afspraken bewaakt over wat we bouwen, de kwaliteit en het budget.",
      "Beveiliging en compliance een vaste plek gegeven in IT-keuzes en de uitvoering daarvan.",
    ],
    tags: ["Azure", "Fabric", "Intune", "Entra", "n8n", "Claude", "Copilot"],
  },
  {
    company: "Harmony Service Center",
    role: "ICT-medewerker",
    period: "2020 – 2022",
    summary:
      "Na jaren in de klantenservice maakte ik de overstap naar IT. In deze rol combineerde ik " +
      "systeembeheer met het ontwikkelen, testen en invoeren van applicaties. Mijn ervaring met " +
      "klantvragen en interne processen kwam daarbij goed van pas.",
    highlights: [
      "Meegewerkt aan de realisatie van een klantenportal en een interne serviceportal, van ontwerp en functionele tests tot ingebruikname.",
      "Nieuwe functionaliteit in Microsoft Dynamics 365 Business Central en interne applicaties getest voordat deze in gebruik werd genomen.",
      "Servers, netwerken en werkplekken ingericht, beheerd en gemonitord.",
    ],
    tags: ["Business Central", "Windows Server", "Postman", "SoapUI"],
  },
  {
    company: "Harmony Service Center",
    role: "Teamleider klantenservice",
    period: "2016 – 2020",
    summary:
      "Ik stuurde het klantenserviceteam aan, maakte de roosters en rapporteerde aan de directie. " +
      "Vanuit de dagelijkse praktijk zag ik waar processen en systemen beter konden. Hier begon " +
      "mijn rol in het aandragen van IT-verbeteringen.",
    compact: true,
  },
  {
    company: "Harmony Service Center",
    role: "Klantenservicemedewerker",
    period: "2012 – 2016",
    summary:
      "Ik hielp klanten via inkomende en uitgaande gesprekken. Daar leerde ik hoe belangrijk " +
      "duidelijke informatie en goed werkende systemen zijn. Die ervaring gebruik ik nog steeds " +
      "bij het maken van IT-keuzes.",
    compact: true,
  },
  {
    company: "Foto Klein · Middelharnis",
    role: "Assistent-filiaalhouder",
    period: "2009 – 2012",
    summary:
      "Ik adviseerde klanten, verkocht producten en hielp de winkel draaiende te houden. Daarnaast " +
      "maakte ik roosters en was ik verantwoordelijk voor de winkelindeling.",
    compact: true,
  },
  {
    company: "LMComputers",
    role: "Mede-eigenaar",
    period: "2004 – 2009",
    summary:
      "Samen een eigen computerzaak runnen betekende van alle markten thuis zijn: klanten adviseren, " +
      "inkopen, verkopen, repareren en de administratie bijhouden. Ook verzorgde ik installaties en " +
      "automatisering voor zakelijke klanten en begeleidde ik medewerkers en stagiairs.",
    compact: true,
  },
  {
    company: "Electro World van Loon",
    role: "Monteur wit- en bruingoed · BBL",
    period: "2002 – 2004",
    summary:
      "Hier begon het: met de verkoop en reparatie van wit- en bruingoed. Problemen onderzoeken, " +
      "de oorzaak vinden en zorgen dat het weer werkt. Een manier van denken die nog steeds goed " +
      "van pas komt.",
    compact: true,
  },
];

/** Labels boven de drie blokken in elke projectkaart. */
export const featuredLabels = {
  problem: "De uitdaging",
  approach: "Mijn bijdrage",
  result: "Het resultaat",
};

// Let op: benoem techniek en resultaat, geen gevoelige interne details.
export const featured: FeaturedProject[] = [
  {
    title: "Klantenportal & serviceportal",
    context: "Harmony · 2020 – 2022",
    problem: "Klanten en collega’s waren voor informatie en verzoeken afhankelijk van e-mail en telefoon.",
    approach:
      "Ik begeleidde de realisatie van een klantenportal en een interne serviceportal: van ontwerp " +
      "en functionele tests tot ingebruikname, met Business Central als achterliggend systeem.",
    result: "Een eigen plek voor klanten en collega’s om informatie te vinden en zelf zaken te regelen.",
    tags: ["Business Central", "Portals", "Functioneel testen"],
  },
  {
    title: "AI & automatisering",
    context: "Harmony · 2022 – heden",
    problem: "Terugkerende handmatige taken en losse systemen zorgden voor onnodig werk.",
    approach:
      "Ik bouwde workflows in n8n en zette AI-assistenten zoals Claude en Copilot in voor taken " +
      "waarbij ze praktisch voordeel opleveren. Daarbij keek ik steeds naar bruikbaarheid, " +
      "beveiliging en kosten.",
    result:
      "AI en automatisering zijn onderdeel geworden van het dagelijkse werk. De toepassingen helpen " +
      "bij terugkerende taken en het verbinden van systemen.",
    tags: ["n8n", "Claude", "Copilot"],
  },
  {
    title: "Data & cloudplatform",
    context: "Harmony · 2022 – heden",
    problem:
      "Data stond verspreid over verschillende systemen. Tegelijk vroeg de groeiende cloudomgeving " +
      "om meer inzicht in prestaties en kosten.",
    approach: "Ik verbeterde de monitoring en inrichting van Azure en bracht data samen in Microsoft Fabric en OneLake.",
    result: "Meer overzicht in de cloudomgeving en een centrale basis voor rapportages en verdere AI-toepassingen.",
    tags: ["Azure", "Microsoft Fabric", "OneLake"],
  },
];

export const skillsIntro =
  "Mijn werk draait om techniek én om de mensen die ermee werken. Ik breng vragen uit de " +
  "organisatie, technische mogelijkheden en de uitvoering bij elkaar.";

export const coreSkillsTitle = "Waar ik me mee bezighoud";

export const coreSkills = [
  "IT-infrastructuur en cloudarchitectuur",
  "Beveiliging en compliance",
  "Aansturing van leveranciers en bewaking van budgetten",
  "Verbeteren van processen en digitale dienstverlening",
  "Afstemming met collega’s en begeleiding van projecten",
  "Praktisch toepassen van AI en automatisering",
];

export const skills: SkillGroup[] = [
  { title: "Cloud & werkplek", items: ["Azure", "Intune", "Entra ID", "Microsoft 365-beheer", "Windows 11", "Windows Server 2019"] },
  { title: "Data & bedrijfsapplicaties", items: ["Microsoft Fabric", "OneLake", "Microsoft Dynamics 365 Business Central"] },
  { title: "AI & automatisering", items: ["Claude", "ChatGPT", "Copilot", "Codex", "n8n"] },
  { title: "Samenwerking, testen & integratie", items: ["Jira", "Confluence", "Postman", "SoapUI", "HTML / CSS"] },
];

export const educationIntro =
  "Van elektrotechniek tot AI: ik blijf graag bijleren. Nieuwe kennis krijgt voor mij vooral " +
  "waarde als ik die in de praktijk kan gebruiken.";

export const education = [
  { title: "AI Champions Programme · Cohort 2", org: "WAIMAKERS" },
  { title: "Wft Basis en Wft Schadeverzekeringen particulier", org: "" },
  { title: "Eerste monteur wit- en bruingoed", org: "" },
  { title: "VBO Elektrotechniek", org: "" },
  { title: "Diverse leertrajecten via Microsoft Learn", org: "" },
];

/** Contactblok onderaan deze pagina (de homepage houdt haar eigen tekst). */
export const contactIntro = [
  "Ik praat graag over IT, AI, Microsoft Fabric en de Nederlandse verzekeringssector. Over Alfa " +
    "Romeo, een goed BBQ-recept of een glas whisky trouwens ook.",
  "Lijkt het je leuk om kennis te maken of ervaringen uit te wisselen? Stuur gerust een mailtje " +
    "of zoek me op via LinkedIn of Instagram.",
];
