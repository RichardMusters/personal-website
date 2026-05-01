"use client";

import { motion } from "framer-motion";
import { EnvelopeSimple, LinkedinLogo, ArrowUpRight } from "@phosphor-icons/react";

const contacts = [
  {
    Icon: EnvelopeSimple,
    label: "E-mail",
    value: "rmusters@harmony.nl",
    href: "mailto:rmusters@harmony.nl",
    color: "emerald",
  },
  {
    Icon: LinkedinLogo,
    label: "LinkedIn",
    value: "linkedin.com/in/richard-musters",
    href: "https://www.linkedin.com/in/richard-musters/",
    color: "sky",
  },
];

export default function Contact() {
  return (
    <section id="contact" className="py-24 md:py-32 border-t border-zinc-800/60">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-12 md:gap-16 items-start">
          {/* Left — 3 cols */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ type: "spring", stiffness: 100, damping: 20 }}
            className="md:col-span-3"
          >
            <span className="text-xs text-emerald-400 tracking-[0.18em] uppercase font-medium mb-5 block">
              Contact
            </span>
            <h2 className="text-4xl md:text-5xl font-semibold tracking-tight text-zinc-50 leading-tight mb-6">
              Kom in contact
            </h2>
            <p className="text-zinc-400 leading-relaxed max-w-[50ch]">
              Open voor gesprekken over IT-strategie, digitale transformatie, leiderschap
              of mogelijke samenwerking binnen de Nederlandse verzekerings- en
              technologiesector.
            </p>
          </motion.div>

          {/* Right — 2 cols */}
          <div className="md:col-span-2 flex flex-col gap-3">
            {contacts.map(({ Icon, label, value, href, color }, i) => (
              <motion.a
                key={label}
                href={href}
                target={href.startsWith("http") ? "_blank" : undefined}
                rel={href.startsWith("http") ? "noopener noreferrer" : undefined}
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{
                  type: "spring",
                  stiffness: 100,
                  damping: 20,
                  delay: i * 0.1,
                }}
                whileHover={{ x: 4 }}
                className="group flex items-center gap-4 p-5 rounded-2xl border border-zinc-800/60 hover:border-zinc-700 bg-zinc-900/30 hover:bg-zinc-900/60 transition-all duration-200"
              >
                <div
                  className={`flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center ${
                    color === "emerald"
                      ? "bg-emerald-500/10 border border-emerald-500/20"
                      : "bg-sky-500/10 border border-sky-500/20"
                  }`}
                >
                  <Icon
                    size={18}
                    className={color === "emerald" ? "text-emerald-400" : "text-sky-400"}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-zinc-600 mb-0.5">{label}</p>
                  <p className="text-sm text-zinc-300 group-hover:text-zinc-50 transition-colors duration-200 truncate">
                    {value}
                  </p>
                </div>
                <ArrowUpRight
                  size={15}
                  className="text-zinc-700 group-hover:text-zinc-400 transition-colors duration-200 flex-shrink-0"
                />
              </motion.a>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
