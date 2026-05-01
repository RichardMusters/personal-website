"use client";

import { motion } from "framer-motion";
import { ShieldCheck, CloudArrowUp, UsersThree, ChartBar } from "@phosphor-icons/react";

const values = [
  {
    Icon: ShieldCheck,
    title: "Beveiliging Voorop",
    description: "Compliance en risicobeheer verankerd op iedere laag",
  },
  {
    Icon: CloudArrowUp,
    title: "Cloudstrategie",
    description: "Organisaties begeleiden door pragmatische cloudmigraties",
  },
  {
    Icon: UsersThree,
    title: "Teamleiderschap",
    description: "Gemotiveerde, goed presterende IT-teams bouwen",
  },
  {
    Icon: ChartBar,
    title: "Operationele Excellentie",
    description: "Doorlopende verbetering van IT-dienstverlening en beschikbaarheid",
  },
];

export default function About() {
  return (
    <section id="about" className="py-24 md:py-32">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-12 md:gap-16 items-start">
          {/* Left — 3 cols */}
          <motion.div
            initial={{ opacity: 0, x: -24 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ type: "spring", stiffness: 100, damping: 20 }}
            className="md:col-span-3"
          >
            <span className="text-xs text-emerald-400 tracking-[0.18em] uppercase font-medium mb-5 block">
              Over mij
            </span>
            <h2 className="text-4xl md:text-5xl font-semibold tracking-tight text-zinc-50 leading-tight mb-6">
              Technologie bouwen waar
              <br />
              <span className="text-zinc-500">organisaties op vertrouwen</span>
            </h2>
            <p className="text-zinc-400 leading-relaxed max-w-[60ch] mb-5">
              Met meer dan 12 jaar ervaring in IT-management en infrastructuur,
              specialiseer ik me in het vertalen van complexe bedrijfsvereisten naar
              stabiele, schaalbare technologieoplossingen. Bij Harmony Verzekeringen leid
              ik de IT-afdeling door een periode van versnelde digitale groei — van
              cloudmigraties tot regelgevingsnaleving.
            </p>
            <p className="text-zinc-400 leading-relaxed max-w-[60ch]">
              Mijn aanpak combineert strategisch overzicht met praktische technische
              expertise. Ik geloof dat de beste IT-systemen onzichtbaar zijn voor
              eindgebruikers en onmisbaar voor het bedrijf. Betrouwbare infrastructuur
              is geen kostenpost — het is concurrentievoordeel.
            </p>
          </motion.div>

          {/* Right — 2 cols */}
          <div className="md:col-span-2 flex flex-col gap-3">
            {values.map(({ Icon, title, description }, i) => (
              <motion.div
                key={title}
                initial={{ opacity: 0, x: 24 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{
                  type: "spring",
                  stiffness: 100,
                  damping: 20,
                  delay: i * 0.08,
                }}
                className="flex items-start gap-4 p-4 rounded-2xl bg-zinc-900/40 border border-zinc-800/50 hover:border-zinc-700/60 transition-colors duration-200"
              >
                <div className="flex-shrink-0 w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mt-0.5">
                  <Icon size={17} className="text-emerald-400" />
                </div>
                <div>
                  <h3 className="text-sm font-medium text-zinc-100 mb-0.5">{title}</h3>
                  <p className="text-xs text-zinc-500 leading-relaxed">{description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
