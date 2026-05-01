// app/components/editorial/Editorial.tsx
"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import styles from "./Editorial.module.css";
import { lightTokens, darkTokens, editorialStyles } from "./tokens";
import RotterdamSkyline from "./RotterdamSkyline";
import Erasmusbrug from "./Erasmusbrug";
import {
  EdNav, EdHero, EdStrip, EdAbout, EdNumbers, EdContact, DarkToggle,
} from "./Sections";

export default function Editorial() {
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const [progress, setProgress] = useState(0);
  const [dark, setDark] = useState(false);

  // Reflect dark mode on <html> so globals.css can flip body bg + selection
  useEffect(() => {
    document.documentElement.dataset.theme = dark ? "dark" : "light";
  }, [dark]);

  // Track page scroll progress to drive the skyline → bridge crossfade
  useEffect(() => {
    const onScroll = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const p = max > 0 ? window.scrollY / max : 0;
      setProgress(p);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const tokens = (dark ? darkTokens : lightTokens) as CSSProperties;

  return (
    <div
      ref={scrollRef}
      className={styles.root}
      style={{ ...tokens, ...editorialStyles.page } as CSSProperties}
    >
      {/* Sticky wrapper keeps the toggle pinned top-left of the viewport */}
      <div style={{ position: "sticky", top: 0, height: 0, zIndex: 50 }}>
        <DarkToggle dark={dark} onToggle={() => setDark(!dark)} />
      </div>

      {/* Skyline + bridge live in a fixed-viewport sticky overlay so they
          stay anchored as the user scrolls the page. */}
      <div style={{ position: "sticky", top: 0, height: 0, zIndex: 1, pointerEvents: "none" }}>
        <div
          className={styles.backgroundViewport}
          style={{
            position: "absolute", top: 0, left: 0, right: 0,
            pointerEvents: "none", overflow: "hidden",
          }}
        >
          <RotterdamSkyline progress={progress} />
          <Erasmusbrug progress={progress} />
        </div>
      </div>

      <EdNav />
      <EdHero />
      <EdStrip />
      <EdAbout />
      <EdNumbers />
      <EdContact />
    </div>
  );
}
