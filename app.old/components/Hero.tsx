"use client";

import { motion } from "framer-motion";
import { ArrowDown, MapPin, EnvelopeSimple } from "@phosphor-icons/react";

const containerVariants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.1, delayChildren: 0.4 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 28 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: "spring", stiffness: 100, damping: 20 },
  },
};

export default function Hero() {
  return (
    <section className="min-h-[100dvh] flex items-center relative overflow-hidden">
      {/* Background dot grid */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage:
            "radial-gradient(circle, rgba(255,255,255,0.025) 1px, transparent 1px)",
          backgroundSize: "28px 28px",
        }}
      />
      {/* Ambient glows */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/3 right-[20%] w-[500px] h-[500px] bg-emerald-500/[0.04] rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 left-[10%] w-80 h-80 bg-zinc-600/10 rounded-full blur-3xl" />
      </div>

      <div className="max-w-7xl mx-auto px-6 w-full py-32">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-16 md:gap-8 items-center">
          {/* Left — 3 columns */}
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="md:col-span-3"
          >
            <motion.div
              variants={itemVariants}
              className="inline-flex items-center gap-2.5 mb-10"
            >
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75 animate-ping" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
              </span>
              <span className="text-sm text-zinc-400 tracking-wide">
                IT Manager &middot; Harmony Verzekeringen
              </span>
            </motion.div>

            <motion.h1
              variants={itemVariants}
              className="text-6xl md:text-7xl lg:text-[88px] font-semibold tracking-tight leading-[0.92] text-zinc-50 mb-8"
            >
              Richard
              <br />
              <span className="text-zinc-500">Musters</span>
            </motion.h1>

            <motion.p
              variants={itemVariants}
              className="text-base text-zinc-400 leading-relaxed max-w-[52ch] mb-10"
            >
              Robuuste IT-infrastructuur bouwen en digitale transformatie aandrijven
              binnen de Nederlandse verzekeringsbranche. 12+ jaar complexe technologische
              uitdagingen omzetten in betrouwbare bedrijfsfundamenten.
            </motion.p>

            <motion.div
              variants={itemVariants}
              className="flex flex-wrap items-center gap-3 mb-10"
            >
              <a
                href="#experience"
                className="inline-flex items-center gap-2 bg-zinc-50 text-zinc-950 px-6 py-3 rounded-full text-sm font-medium hover:bg-emerald-400 transition-all duration-200 active:scale-[0.98]"
              >
                Bekijk ervaring
              </a>
              <a
                href="#contact"
                className="inline-flex items-center gap-2 border border-zinc-700/80 text-zinc-300 px-6 py-3 rounded-full text-sm font-medium hover:border-zinc-500 hover:text-zinc-50 transition-all duration-200 active:scale-[0.98]"
              >
                <EnvelopeSimple size={15} />
                Contact
              </a>
            </motion.div>

            <motion.div
              variants={itemVariants}
              className="flex items-center gap-2 text-zinc-600 text-sm"
            >
              <MapPin size={13} />
              <span>Rotterdam, Nederland</span>
            </motion.div>
          </motion.div>

          {/* Right — 2 columns */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 80, damping: 20, delay: 0.6 }}
            className="md:col-span-2 flex justify-center md:justify-end"
          >
            <ProfileCard />
          </motion.div>
        </div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.8, duration: 0.6 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-zinc-700"
      >
        <span className="text-[10px] tracking-[0.2em] uppercase">Scrollen</span>
        <motion.div
          animate={{ y: [0, 5, 0] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
        >
          <ArrowDown size={12} />
        </motion.div>
      </motion.div>
    </section>
  );
}

function ProfileCard() {
  const badges = [
    { label: "Azure", delay: 0 },
    { label: "ITIL v4", delay: 0.3 },
    { label: "ISO 27001", delay: 0.6 },
  ];

  return (
    <div className="relative w-72 h-80">
      {/* Main floating card */}
      <motion.div
        animate={{ y: [0, -10, 0] }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
        className="absolute inset-0 bg-zinc-900 border border-zinc-800 rounded-3xl flex flex-col items-center justify-center gap-7 shadow-2xl shadow-black/60"
      >
        {/* Avatar */}
        <div className="relative">
          <div className="w-[88px] h-[88px] rounded-full bg-gradient-to-br from-emerald-600/30 via-zinc-700/40 to-zinc-800/60 border border-zinc-700 flex items-center justify-center shadow-inner">
            <span className="text-2xl font-semibold text-zinc-100 tracking-tight">
              RM
            </span>
          </div>
          <span className="absolute bottom-1 right-1 h-[14px] w-[14px] rounded-full bg-emerald-500 border-[2.5px] border-zinc-900 shadow-sm" />
        </div>

        <div className="text-center">
          <p className="text-zinc-50 font-semibold text-sm tracking-tight">
            Richard Musters
          </p>
          <p className="text-zinc-500 text-xs mt-1">IT Manager</p>
        </div>

        {/* Badges row */}
        <div className="flex items-center gap-2">
          {badges.map(({ label }) => (
            <span
              key={label}
              className="text-[11px] px-2.5 py-1 rounded-full border border-zinc-700/80 text-zinc-500 bg-zinc-900/80"
            >
              {label}
            </span>
          ))}
        </div>
      </motion.div>

      {/* Floating badge: Experience */}
      <motion.div
        initial={{ opacity: 0, x: 16 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 1.0, type: "spring", stiffness: 100, damping: 20 }}
        className="absolute -right-10 top-6 bg-zinc-900 border border-zinc-800 rounded-2xl px-3.5 py-2.5 shadow-xl shadow-black/40"
      >
        <motion.div
          animate={{ y: [0, -5, 0] }}
          transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
        >
          <p className="text-[10px] text-zinc-500 mb-0.5">Ervaring</p>
          <p className="text-sm font-semibold text-zinc-50 font-mono">12+ jr</p>
        </motion.div>
      </motion.div>

      {/* Floating badge: Team */}
      <motion.div
        initial={{ opacity: 0, x: -16 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 1.2, type: "spring", stiffness: 100, damping: 20 }}
        className="absolute -left-10 bottom-10 bg-zinc-900 border border-zinc-800 rounded-2xl px-3.5 py-2.5 shadow-xl shadow-black/40"
      >
        <motion.div
          animate={{ y: [0, -5, 0] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 1 }}
        >
          <p className="text-[10px] text-zinc-500 mb-0.5">Teamgrootte</p>
          <p className="text-sm font-semibold text-zinc-50 font-mono">8 pers.</p>
        </motion.div>
      </motion.div>
    </div>
  );
}
