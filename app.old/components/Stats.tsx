"use client";

import { motion } from "framer-motion";

const stats = [
  { value: "12+", label: "Jaar in IT" },
  { value: "€2,3M", label: "Jaarlijks IT-budget" },
  { value: "8", label: "Teamleden" },
  { value: "3", label: "Grote migraties geleid" },
];

export default function Stats() {
  return (
    <section className="border-y border-zinc-800/60 py-12">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-0 md:divide-x md:divide-zinc-800/60">
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{
                type: "spring",
                stiffness: 100,
                damping: 20,
                delay: i * 0.08,
              }}
              className="flex flex-col gap-1 md:px-10 first:md:pl-0 last:md:pr-0"
            >
              <span className="text-3xl md:text-4xl font-semibold text-zinc-50 tracking-tight font-mono">
                {stat.value}
              </span>
              <span className="text-sm text-zinc-500">{stat.label}</span>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
