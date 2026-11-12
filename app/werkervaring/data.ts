// app/werkervaring/data.ts
// Alle inhoud van /werkervaring staat hier. Pas alleen dit bestand aan om
// rollen, projecten of skills bij te werken — de layout volgt vanzelf.

export type Role = {
  company: string;
  role: string;
  period: string;
  /** Eén of twee zinnen: wat deze rol in de kern was. */
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

export const intro = {
  eyebrow: "- Werkervaring · 2002 – heden -",
  lead:
    "Begonnen als monteur wit- en bruingoed, nu IT-manager. Daartussen: een eigen " +
    "computerzaak, de klantenservice en de teamleiding. Ik weet dus hoe het is om " +
    "aan de andere kant van de helpdesk te zitten, en dat merk je aan de systemen die ik neerzet.",
};

export const facts = [
  { label: "Nu", value: "IT-Manager · Harmony Service Center" },
  { label: "Bij Harmony sinds", value: "2012" },
  { label: "Standplaats", value: "Rotterdam" },
];

export const roles: Role[] = [
  {
    company: "Harmony Service Center",
    role: "IT-Manager",
    period: "2022 – heden",
    summary:
      "Eindverantwoordelijk voor IT-strategie, applicatieontwikkeling en digitale transformatie. " +
      "Ik vertaal wat de business nodig heeft naar oplossingen die veilig, snel en betaalbaar blijven.",
    highlights: [
      "AI-tooling en workflow-automatisering geïntroduceerd met N8N, Claude en Copilot, van eerste experiment tot dagelijks gebruik.",
      "Het Azure-platform onder controle gebracht: monitoring, performance en kosten structureel in beeld.",
      "Externe ontwikkelpartijen aangestuurd op scope, kwaliteit en budget.",
      "Security en compliance als vast onderdeel van elke IT-beslissing ingericht.",
    ],
    tags: ["Azure", "Fabric", "Intune", "Entra", "N8N", "Claude", "Copilot"],
  },
  {
    company: "Harmony Service Center",
    role: "ICT-medewerker",
    period: "2020 – 2022",
    summary:
      "De overstap van de werkvloer naar IT: systeembeheer en applicatieontwikkeling in één rol.",
    highlights: [
      "Een klantenportal en een interne serviceportal gerealiseerd, van ontwerp en functionele test tot uitrol in productie.",
      "Ontwikkelingen in Microsoft Dynamics 365 Business Central en interne applicaties getest en gevalideerd vóór livegang.",
      "Servers, netwerken en werkplekken geïnstalleerd, beheerd en gemonitord.",
    ],
    tags: ["Business Central", "Windows Server", "Postman", "SoapUI"],
  },
  {
    company: "Harmony Service Center",
    role: "Teamleider klantenservice",
    period: "2016 – 2020",
    summary:
      "Team aangestuurd, roosters gemaakt en gerapporteerd aan de directie. Hier begon het " +
      "aandragen van IT-verbeteringen vanuit de praktijk van de klantenservice.",
    compact: true,
  },
  {
    company: "Harmony Service Center",
    role: "Klantenservicemedewerker",
    period: "2012 – 2016",
    summary: "In- en outbound klantcontact. De beste plek om te leren waar systemen mensen in de weg zitten.",
    compact: true,
  },
  {
    company: "Foto Klein",
    role: "Assistent filiaalhouder · Middelharnis",
    period: "2009 – 2012",
    summary: "Verkoop, roosterplanning en verantwoordelijk voor de winkelindeling.",
    compact: true,
  },
  {
    company: "LMComputers",
    role: "Mede-eigenaar",
    period: "2004 – 2009",
    summary:
      "Eigen computerzaak: in- en verkoop, administratie, reparaties en installaties, " +
      "automatisering voor de zakelijke markt en het begeleiden van personeel en stagiaires.",
    compact: true,
  },
  {
    company: "Electro World van Loon",
    role: "Monteur wit- en bruingoed (BBL)",
    period: "2002 – 2004",
    summary: "Verkoop en reparatie van wit- en bruingoed. Waar het allemaal begon: als het stuk is, maak je het.",
    compact: true,
  },
];

// Let op: benoem techniek en resultaat, geen gevoelige interne details.
export const featured: FeaturedProject[] = [
  {
    title: "Klantenportal & serviceportal",
    context: "Harmony · 2020 – 2022",
    problem: "Klanten en collega's waren voor informatie en verzoeken afhankelijk van mail en telefoon.",
    approach: "Van ontwerp en functionele test tot uitrol in productie begeleid, met Business Central als bron.",
    result: "Eén plek voor klanten en één voor collega's om zelf zaken te regelen.",
    tags: ["Business Central", "Portal", "Testen"],
  },
  {
    title: "AI & workflow-automatisering",
    context: "Harmony · 2022 – heden",
    problem: "Repeterend handwerk en losse tools die niet met elkaar praten.",
    approach: "Workflows gebouwd in N8N en AI-assistenten (Claude, Copilot) ingezet waar ze echt tijd schelen.",
    result: "AI van experiment naar dagelijks gereedschap, met oog voor security en kosten.",
    tags: ["N8N", "Claude", "Copilot"],
  },
  {
    title: "Data & cloudplatform",
    context: "Harmony · 2022 – heden",
    problem: "Data verspreid over systemen en een cloudomgeving die meegroeit in kosten.",
    approach: "Azure-platform gemonitord en geoptimaliseerd, data samengebracht in Microsoft Fabric en OneLake.",
    result: "Een fundament waarop rapportage en AI betrouwbaar kunnen draaien.",
    tags: ["Azure", "Fabric", "OneLake"],
  },
];

export const skills: SkillGroup[] = [
  { title: "Cloud & werkplek", items: ["Azure", "Intune", "Entra ID", "Microsoft 365 beheer", "Windows 11", "Windows Server 2019"] },
  { title: "Data", items: ["Microsoft Fabric", "OneLake", "Business Central"] },
  { title: "AI & automatisering", items: ["Claude (Cowork, Code, Chat)", "ChatGPT", "Copilot", "Codex", "N8N"] },
  { title: "Werkwijze & integratie", items: ["JIRA", "Confluence", "Postman", "SoapUI", "HTML / CSS"] },
];

export const coreSkills = [
  "IT-infrastructuur & cloudarchitectuur",
  "Cybersecurity & compliance",
  "Leveranciers- & budgetmanagement",
  "Procesoptimalisatie & digitale transformatie",
  "Stakeholdermanagement & projectaansturing",
  "AI-implementatie & automatisering",
];

export const education = [
  { title: "AI Champions Programme · Cohort 2", org: "WAIMAKERS" },
  { title: "WFT Basis + Schade Particulier", org: "" },
  { title: "1e monteur wit- en bruingoed", org: "" },
  { title: "VBO Elektrotechniek", org: "" },
  { title: "Diverse Microsoft Learn-trajecten", org: "Microsoft" },
];
