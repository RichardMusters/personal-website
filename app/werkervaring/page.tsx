import type { Metadata } from "next";
import Werkervaring from "./Werkervaring";
import { roles } from "./data";

export const metadata: Metadata = {
  title: "Werkervaring · Richard Musters",
  description:
    "Van monteur tot IT-manager: de loopbaan van Richard Musters, IT-Manager bij Harmony Service Center in Rotterdam.",
};

const current = roles[0];

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "Person",
  name: "Richard Musters",
  url: "https://www.richardmusters.nl",
  jobTitle: current.role,
  worksFor: { "@type": "Organization", name: current.company },
  address: { "@type": "PostalAddress", addressLocality: "Rotterdam", addressCountry: "NL" },
  knowsAbout: ["Microsoft Azure", "Microsoft Fabric", "Intune", "Entra ID", "Business Central", "AI-automatisering"],
  sameAs: [
    "https://www.linkedin.com/in/richard-musters/",
    "https://www.instagram.com/richardmusters/",
  ],
};

export default function WerkervaringPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
      />
      <Werkervaring />
    </>
  );
}
