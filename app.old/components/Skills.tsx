"use client";

import { motion } from "framer-motion";
import { TreeStructure, ShieldCheck, CloudArrowUp, Gear, UsersThree, Handshake } from "@phosphor-icons/react";

const skills = [
  {
    Icon: TreeStructure,
    title: "IT-strategie & Architectuur",
    description:
      "Langetermijn-technologieroadmaps ontwerpen die aansluiten op bedrijfsdoelstellingen. IT-investeringen beheren om ROI te maximaliseren, technische schuld te verminderen en operationele veerkracht te behouden.",
    size: "large",
  },
  {
    Icon: ShieldCheck,
    title: "Cyberbeveiliging & Compliance",
    description:
      "ISO 27001-compliance, dreigingsbeheer en beveiligingsbeleidsontwikkeling over alle infrastructuurlagen.",
    size: "small",
  },
  {
    Icon: CloudArrowUp,
    title: "Cloud & Infrastructuur",
    description:
      "Azure-migraties, hybride cloudarchitectuur, serverbeheer en netwerkgovernance.",
    size: "small",
  },
  {
    Icon: Gear,
    title: "ITSM & ITIL v4",
    description:
      "Servicemanagementframeworks, incident- en probleembeheer, SLA-governance en continue verbeteringscycli. Meetbare servicekwaliteit realiseren via gestructureerde processen.",
    size: "large",
  },
  {
    Icon: UsersThree,
    title: "Teamleiderschap",
    description:
      "IT-talent werven en behouden via duidelijke loopbaanpaden, coaching en een resultaatgerichte teamcultuur.",
    size: "medium",
  },
  {
    Icon: Handshake,
    title: "Leveranciers- & Budgetbeheer",
    description:
      "Strategische leverancierspartnerschappen, contractonderhandelingen en gedisciplineerd IT-budgetbeheer.",
    size: "medium",
  },
];

export default function Skills() {
  return (
    <section id="skills" className="py-24 md:py-32 border-t border-zinc-800/60">
      <div className="max-w-7xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ type: "spring", stiffness: 100, damping: 20 }}
          className="mb-16"
        >
          <span className="text-xs text-emerald-400 tracking-[0.18em] uppercase font-medium mb-5 block">
            Vaardigheden
          </span>
          <h2 className="text-4xl md:text-5xl font-semibold tracking-tight text-zinc-50">
            Expertisegebieden
          </h2>
        </motion.div>

        {/* Asymmetric bento grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Row 1: large (2/3) + small (1/3) */}
          <SkillCard skill={skills[0]} index={0} className="md:col-span-2" />
          <SkillCard skill={skills[1]} index={1} className="md:col-span-1" />

          {/* Row 2: small (1/3) + large (2/3) */}
          <SkillCard skill={skills[2]} index={2} className="md:col-span-1" />
          <SkillCard skill={skills[3]} index={3} className="md:col-span-2" />

          {/* Row 3: medium (1/2) + medium (1/2) — only 2 items, avoids 3-col equal pattern */}
          <div className="md:col-span-3 grid grid-cols-1 md:grid-cols-2 gap-4">
            <SkillCard skill={skills[4]} index={4} />
            <SkillCard skill={skills[5]} index={5} />
          </div>
        </div>
      </div>
    </section>
  );
}

type SkillItem = (typeof skills)[0];

function SkillCard({
  skill,
  index,
  className = "",
}: {
  skill: SkillItem;
  index: number;
  className?: string;
}) {
  const { Icon, title, description } = skill;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{
        type: "spring",
        stiffness: 100,
        damping: 20,
        delay: index * 0.06,
      }}
      whileHover={{ y: -3 }}
      className={`group relative p-6 rounded-3xl bg-zinc-900/50 border border-zinc-800/60 hover:border-zinc-700/80 transition-colors duration-300 cursor-default ${className}`}
    >
      {/* Icon */}
      <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-5 group-hover:bg-emerald-500/15 transition-colors duration-300">
        <Icon size={19} className="text-emerald-400" />
      </div>

      <h3 className="text-base font-semibold text-zinc-100 tracking-tight mb-2.5">
        {title}
      </h3>
      <p className="text-sm text-zinc-500 leading-relaxed">{description}</p>

      {/* Subtle corner accent */}
      <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-emerald-500/[0.03] to-transparent rounded-3xl pointer-events-none" />
    </motion.div>
  );
}
