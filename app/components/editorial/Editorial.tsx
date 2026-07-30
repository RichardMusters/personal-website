// app/components/editorial/Editorial.tsx
"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import styles from "./Editorial.module.css";
import { lightTokens, darkTokens, editorialStyles } from "./tokens";
import RotterdamSkyline from "./RotterdamSkyline";
import Erasmusbrug from "./Erasmusbrug";
import { SkyCelestial, SkyPrecipitation } from "./sky/SkyOverlay";
import { useSkyState } from "./sky/useSkyState";
import type { HeaderData } from "./sky/types";
import {
  EdNav, EdHero, EdStrip, EdAbout, EdAiDev, EdProjects, EdNumbers, EdContact, DarkToggle,
} from "./Sections";

const WEATHER_REFRESH_MS = 15 * 60_000;
const CLOCK_TICK_MS = 60_000;

export default function Editorial() {
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const [progress, setProgress] = useState(0);
  const [dark, setDark] = useState(false);
  const [weather, setWeather] = useState<HeaderData | null>(null);
  const [now, setNow] = useState(() => new Date());

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

  // Fetch the weather/water colophon data once, then refresh every 15 minutes.
  // Fails silently — the header stays on its astronomical (sun/moon-only) state.
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const res = await fetch("/api/header-data", { headers: { accept: "application/json" } });
        if (!res.ok || cancelled) return;
        const json: HeaderData = await res.json();
        if (!cancelled) setWeather(json);
      } catch {
        // De header blijft staan op de astronomische stand.
      }
    };
    load();
    const reload = window.setInterval(load, WEATHER_REFRESH_MS);
    return () => {
      cancelled = true;
      window.clearInterval(reload);
    };
  }, []);

  // Re-paint the sun/moon/window state once a minute.
  useEffect(() => {
    const tick = window.setInterval(() => setNow(new Date()), CLOCK_TICK_MS);
    return () => window.clearInterval(tick);
  }, []);

  const sky = useSkyState(weather, now);
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

      {/* Skyline + bridge + sky overlay live in a fixed-viewport sticky
          overlay so they stay anchored as the user scrolls the page. */}
      <div style={{ position: "sticky", top: 0, height: 0, zIndex: 1, pointerEvents: "none" }}>
        <div
          className={styles.backgroundViewport}
          style={{
            position: "absolute", top: 0, left: 0, right: 0,
            pointerEvents: "none", overflow: "hidden",
          }}
        >
          <SkyCelestial body={sky.body} progress={progress} />
          <RotterdamSkyline
            progress={progress}
            litWindows={sky.litWindows}
            craneAngles={sky.craneAngles}
            hazeFactor={sky.hazeFactor}
          />
          <Erasmusbrug progress={progress} />
          <SkyPrecipitation mode={sky.precipMode} />
        </div>
      </div>

      <EdNav />
      <EdHero colophon={sky.colophon} />
      <EdStrip />
      <EdAbout />
      <EdAiDev />
      <EdProjects />
      <EdNumbers />
      <EdContact />
    </div>
  );
}
