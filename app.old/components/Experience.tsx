"use client";

import { motion } from "framer-motion";
import { Buildings } from "@phosphor-icons/react";

const experiences = [
  {
    role: "IT Manager",
    company: "Harmony Verzekeringen",
    period: "2021 — heden",
    location: "Rotterdam, NL",
    description:
      "Leidinggeven aan end-to-end IT-operaties voor een nationale verzekeringsmaatschappij. Verantwoordelijk voor infrastructuurstrategie, cloudmigratieroadmap, cyberbeveiligingspostuur en een cross-functioneel team van 8 IT-professionals. Beheer van een jaarlijks IT-budget van €2,3M en het nakomen van SLA-verplichtingen voor alle bedrijfsonderdelen.",
    tags: ["Azure", "ITIL v4", "ISO 27001", "IT-strategie", "Teamleiderschap", "Budgetbeheer"],
    current: true,
  },
  {
    role: "IT & Implementatiespecialist",
    company: "Harmony Verzekeringen",
    period: "2017 — 2021",
    location: "Rotterdam, NL",
    description:
      "Leidde implementatieprojecten voor verzekeringsbeheersystemen en procesdigitalisering. Primaire schakel tussen zakelijke stakeholders en technische teams tijdens systeemuitrollingen. Handmatige verwerkingstijd met 38% teruggebracht door gerichte workflowautomatisering en systeemintegratie.",
    tags: ["Verzekeringsystemen", "Procesautomatisering", "Projectmanagement", "Verandermanagement"],
    current: false,
  },
  {
    role: "IT Consultant",
    company: "LMAutomatisering",
    period: "2012 — 2017",
    location: "Nederland",
    description:
      "IT-consultancy en infrastructuurdiensten geleverd aan MKB-klanten in meerdere sectoren. Netwerkinstallaties, serveromgevingen en IT-ondersteuningscontracten beheerd. Duurzame klantrelaties opgebouwd door consistente, betrouwbare dienstverlening.",
    tags: ["Infrastructuur", "Netwerkbeheer", "Serverbeheer", "Klantbeheer"],
    current: false,
  },
  {
    role: "Technisch Medewerker",
    company: "Foto Klein",
    period: "2008 — 2012",
    location: "Nederland",
    description:
      "Vroege loopbaanfunctie met technische ondersteuning en IT-systeembeheer. Fundamentele expertise ontwikkeld in hardware, softwareondersteuning en eindgebruikershulp. Een klantgerichte aanpak voor technisch probleemoplossen opgebouwd die mijn leiderschapsstijl nog steeds vormt.",
    tags: ["Technische ondersteuning", "Hardware", "Software", "Klantenservice"],
    current: false,
  },
];

export default function Experience() {
  return (
    <section id="experience" className="py-24 md:py-32 border-t border-zinc-800/60">
      <div className="max-w-7xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ type: "spring", stiffness: 100, damping: 20 }}
          className="mb-16"
        >
          <span className="text-xs text-emerald-400 tracking-[0.18em] uppercase font-medium mb-5 block">
            Ervaring
          </span>
          <h2 className="text-4xl md:text-5xl font-semibold tracking-tight text-zinc-50">
            Loopbaangeschiedenis
          </h2>
        </motion.div>

        <div className="relative">
          {/* Timeline spine */}
          <div className="hidden md:block absolute left-[152px] top-2 bottom-2 w-px bg-zinc-800/60" />

          <div className="flex flex-col gap-14">
            {experiences.map((exp, i) => (
              <motion.div
                key={`${exp.company}-${exp.role}`}
                initial={{ opacity: 0, y: 28 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{
                  type: "spring",
                  stiffness: 100,
                  damping: 20,
                  delay: i * 0.05,
                }}
                className="grid grid-cols-1 md:grid-cols-[152px_1fr] gap-6 md:gap-14"
              >
                {/* Date column */}
                <div className="relative flex md:flex-col md:items-end gap-3 md:gap-1.5 pt-0.5">
                  <span className="text-sm text-zinc-500 font-mono whitespace-nowrap">
                    {exp.period}
                  </span>
                  {exp.current && (
                    <span className="inline-flex items-center gap-1.5 text-xs text-emerald-400">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      Huidig
                    </span>
                  )}
                  {/* Timeline node */}
                  <div className="hidden md:flex absolute -right-[calc(3.5rem+1px)] top-1.5 w-3 h-3 rounded-full border-2 border-zinc-700 bg-zinc-950 items-center justify-center">
                    {exp.current && (
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    )}
                  </div>
                </div>

                {/* Content column */}
                <div>
                  <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
                    <div>
                      <h3 className="text-lg font-semibold text-zinc-50 tracking-tight">
                        {exp.role}
                      </h3>
                      <div className="flex items-center gap-1.5 mt-1">
                        <Buildings size={13} className="text-zinc-600" />
                        <span className="text-sm text-zinc-400">{exp.company}</span>
                        <span className="text-zinc-700 mx-0.5">&middot;</span>
                        <span className="text-sm text-zinc-600">{exp.location}</span>
                      </div>
                    </div>
                  </div>

                  <p className="text-sm text-zinc-400 leading-relaxed mb-5 max-w-[68ch]">
                    {exp.description}
                  </p>

                  <div className="flex flex-wrap gap-2">
                    {exp.tags.map((tag) => (
                      <span
                        key={tag}
                        className="text-xs px-2.5 py-1 rounded-full border border-zinc-800/80 text-zinc-500 hover:border-zinc-700 hover:text-zinc-400 transition-colors duration-150"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
