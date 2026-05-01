"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { List, X } from "@phosphor-icons/react";

const links = [
  { label: "Over mij", href: "#about" },
  { label: "Ervaring", href: "#experience" },
  { label: "Vaardigheden", href: "#skills" },
  { label: "Contact", href: "#contact" },
];

export default function Nav() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header className="fixed top-0 left-0 right-0 z-50">
      <div className={`transition-all duration-500 ${scrolled ? "py-4" : "py-6"}`}>
        <motion.nav
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 100, damping: 20, delay: 0.2 }}
          className={`max-w-5xl mx-auto flex items-center justify-between px-6 transition-all duration-500 ${
            scrolled
              ? "bg-zinc-900/80 backdrop-blur-xl border border-zinc-800/60 rounded-2xl py-3 mx-4 shadow-lg shadow-black/40"
              : ""
          }`}
        >
          <span className="font-semibold text-zinc-50 text-sm tracking-tight">
            Richard Musters
          </span>

          <div className="hidden md:flex items-center gap-8">
            {links.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="text-sm text-zinc-400 hover:text-zinc-50 transition-colors duration-200"
              >
                {link.label}
              </a>
            ))}
          </div>

          <a
            href="#contact"
            className="hidden md:inline-flex items-center gap-2 text-sm bg-zinc-50 text-zinc-950 px-4 py-2 rounded-full font-medium hover:bg-emerald-400 transition-colors duration-200 active:scale-[0.98]"
          >
            Neem contact op
          </a>

          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden text-zinc-400 hover:text-zinc-50 transition-colors p-1"
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X size={20} weight="bold" /> : <List size={20} weight="bold" />}
          </button>
        </motion.nav>
      </div>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="md:hidden mx-4 mt-1 bg-zinc-900/95 backdrop-blur-xl border border-zinc-800 rounded-2xl p-4"
          >
            {links.map((link) => (
              <a
                key={link.label}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className="block py-3 text-sm text-zinc-400 hover:text-zinc-50 transition-colors border-b border-zinc-800/60 last:border-0"
              >
                {link.label}
              </a>
            ))}
            <a
              href="#contact"
              onClick={() => setMobileOpen(false)}
              className="block mt-4 text-center text-sm bg-zinc-50 text-zinc-950 px-4 py-2.5 rounded-full font-medium hover:bg-emerald-400 transition-colors"
            >
              Neem contact op
            </a>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
