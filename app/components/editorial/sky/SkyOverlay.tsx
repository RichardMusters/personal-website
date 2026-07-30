// app/components/editorial/sky/SkyOverlay.tsx
// Sun/moon over the horizon, and rain/snow hairlines — both purely decorative,
// layered inside the same sticky background viewport as the skyline and bridge.
// Same viewBox as RotterdamSkyline so the horizon lines up exactly.

import styles from "../Editorial.module.css";
import { hash } from "./weather";
import type { CelestialBody, PrecipMode } from "./types";

const VIEWBOX_WIDTH = 1600;
const VIEWBOX_HEIGHT = 240;
const HORIZON_Y = 232;

export function SkyCelestial({ body, progress }: { body: CelestialBody; progress: number }) {
  const op = Math.max(0, 1 - progress * 1.6);
  return (
    <svg
      viewBox={`0 0 ${VIEWBOX_WIDTH} ${VIEWBOX_HEIGHT}`}
      preserveAspectRatio="xMidYMax slice"
      style={{
        position: "absolute", left: 0, right: 0, top: 0,
        width: "100%", height: VIEWBOX_HEIGHT,
        opacity: op,
        pointerEvents: "none",
      }}
      aria-hidden="true"
    >
      {body.kind === "sun" ? (
        <g fill="none" stroke="var(--skyline-stroke)" strokeWidth="1">
          <circle cx={body.cx} cy={body.cy} r={body.r} />
          {body.rays &&
            Array.from({ length: 8 }, (_, i) => {
              const angle = i * (Math.PI / 4);
              return (
                <line
                  key={`sun-ray-${i}`}
                  x1={body.cx + Math.cos(angle) * (body.r * 1.4)}
                  y1={body.cy + Math.sin(angle) * (body.r * 1.4)}
                  x2={body.cx + Math.cos(angle) * (body.r * 1.9)}
                  y2={body.cy + Math.sin(angle) * (body.r * 1.9)}
                  strokeWidth="0.6"
                  strokeLinecap="round"
                />
              );
            })}
        </g>
      ) : (
        <g>
          <circle cx={body.cx} cy={body.cy} r={body.r} fill="none" stroke="var(--skyline-stroke)" strokeWidth="1" />
          <path d={body.path} fill="var(--skyline-stroke)" fillOpacity={0.82} />
        </g>
      )}
    </svg>
  );
}

export function SkyPrecipitation({ mode }: { mode: PrecipMode }) {
  if (!mode) return null;

  const count = mode === "snow" ? 44 : 80;
  const drops = Array.from({ length: count }, (_, i) => ({
    x: hash(i * 2654435761) * VIEWBOX_WIDTH,
    y: hash(i * 40503 + 11) * HORIZON_Y,
    delay: (hash(i * 7 + 3) * -1.6).toFixed(2),
  }));

  return (
    <svg
      viewBox={`0 0 ${VIEWBOX_WIDTH} ${VIEWBOX_HEIGHT}`}
      preserveAspectRatio="xMidYMax slice"
      style={{
        position: "absolute", left: 0, right: 0, top: 0,
        width: "100%", height: VIEWBOX_HEIGHT,
        pointerEvents: "none",
      }}
      aria-hidden="true"
    >
      <g className={mode === "storm" ? styles.skyPrecipStorm : undefined}>
        {drops.map((drop, i) =>
          mode === "snow" ? (
            <circle
              key={`flake-${i}`}
              cx={drop.x}
              cy={drop.y}
              r={1.1}
              className={styles.skyFlake}
              style={{ animationDelay: `${drop.delay}s` }}
            />
          ) : (
            <line
              key={`drop-${i}`}
              x1={drop.x}
              y1={drop.y}
              x2={drop.x - 2}
              y2={drop.y + HORIZON_Y * 0.075}
              className={styles.skyDrop}
              style={{ animationDelay: `${drop.delay}s` }}
            />
          )
        )}
      </g>
    </svg>
  );
}
