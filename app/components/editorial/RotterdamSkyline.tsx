// app/components/editorial/RotterdamSkyline.tsx
// Hairline silhouettes of recognizable Rotterdam buildings.
// Drawn faint and small as background texture, fades out as bridge fades in.

import styles from "./Editorial.module.css";

type WindowGroup = { x: number; width: number; floorYs: readonly number[] };

const WINDOW_GROUPS: readonly WindowGroup[] = [
  { x: 515, width: 40, floorYs: [105, 135, 165, 195] },
  { x: 565, width: 40, floorYs: [80, 110, 140, 170, 200] },
  { x: 715, width: 55, floorYs: [85, 105, 125, 145, 165, 185, 205] },
  { x: 775, width: 55, floorYs: [65, 85, 105, 145, 165, 185, 205] },
  { x: 840, width: 50, floorYs: [110, 130, 150, 170, 190, 210] },
  { x: 960, width: 40, floorYs: Array.from({ length: 18 }, (_, i) => 45 + i * 10) },
  { x: 1020, width: 45, floorYs: [95, 115, 135, 155, 175, 195, 215] },
];

const WINDOWS_PER_GAP = 2;
const WINDOW_WIDTH = 5;
const WINDOW_HEIGHT = 6;

type SkyWindow = { x: number; y: number; index: number };

const SKY_WINDOWS: readonly SkyWindow[] = WINDOW_GROUPS.flatMap(({ x, width, floorYs }) =>
  Array.from({ length: floorYs.length - 1 }, (_, gap) => {
    const top = floorYs[gap];
    const bottom = floorYs[gap + 1];
    const y = top + (bottom - top) / 2 - WINDOW_HEIGHT / 2;
    const slot = (width - WINDOW_WIDTH) / (WINDOWS_PER_GAP + 1);
    return Array.from({ length: WINDOWS_PER_GAP }, (_, w) => ({
      x: x + slot * (w + 1),
      y,
    }));
  }).flat()
).map((pos, index) => ({ ...pos, index }));

/** Exported so useSkyState.ts can hash exactly this many window indices — one source of truth. */
export const SKY_WINDOW_COUNT = SKY_WINDOWS.length;

const EMPTY_LIT_WINDOWS: ReadonlySet<number> = new Set();
const DEFAULT_CRANE_ANGLES: readonly [number, number, number] = [0, 0, 0];

type RotterdamSkylineProps = {
  progress: number;
  litWindows?: ReadonlySet<number>;
  craneAngles?: readonly [number, number, number];
  hazeFactor?: number;
};

export default function RotterdamSkyline({
  progress,
  litWindows = EMPTY_LIT_WINDOWS,
  craneAngles = DEFAULT_CRANE_ANGLES,
  hazeFactor = 1,
}: RotterdamSkylineProps) {
  const op = Math.max(0, 1 - progress * 1.6) * hazeFactor;
  return (
    <svg
      viewBox="0 0 1600 240"
      preserveAspectRatio="xMidYMax slice"
      style={{
        position: "absolute", left: 0, right: 0, top: 0,
        width: "100%", height: 240,
        opacity: op * 0.55,
        pointerEvents: "none",
      }}
      aria-hidden="true"
    >
      <g fill="none" stroke="var(--skyline-stroke)" strokeWidth="1" strokeLinejoin="miter">
        <line x1="0" y1="232" x2="1600" y2="232" stroke="var(--skyline-fill-light)" />

        {/* far left blocks */}
        <path d="M40 232 L40 200 L70 200 L70 188 L100 188 L100 210 L140 210 L140 232 Z" />
        <path d="M150 232 L150 178 L180 178 L180 232 Z" />
        <path d="M195 232 L195 195 L240 195 L240 232 Z" />

        {/* Markthal arch */}
        <path d="M270 232 L270 175 Q335 105 400 175 L400 232 Z" />
        <path d="M280 232 L280 195 L390 195 L390 232" stroke="var(--skyline-fill-light)" />

        <path d="M420 232 L420 200 L460 200 L460 232 Z" />
        <path d="M470 232 L470 175 L495 175 L495 232 Z" />

        {/* Delftse Poort — twin towers */}
        <path d="M515 232 L515 90 L555 90 L555 232 Z" />
        <path d="M565 232 L565 60 L605 60 L605 232 Z" />
        {[105,135,165,195].map((y) => (
          <line key={`dp-l-${y}`} x1="515" y1={y} x2="555" y2={y} stroke="var(--skyline-fill-light)" />
        ))}
        {[80,110,140,170,200].map((y) => (
          <line key={`dp-r-${y}`} x1="565" y1={y} x2="605" y2={y} stroke="var(--skyline-fill-light)" />
        ))}

        <path d="M620 232 L620 180 L660 180 L660 232 Z" />
        <path d="M670 232 L670 165 L695 165 L695 232 Z" />

        {/* De Rotterdam — three offset stacked towers */}
        <path d="M715 232 L715 70 L770 70 L770 232 Z" />
        <path d="M775 232 L775 50 L830 50 L830 130 L835 130 L835 232 Z" />
        <path d="M840 232 L840 95 L890 95 L890 232 Z" />
        {[85,105,125,145,165,185,205].map((y) => (
          <line key={`drA-${y}`} x1="715" y1={y} x2="770" y2={y} stroke="var(--skyline-fill-light)" />
        ))}
        {[65,85,105,145,165,185,205].map((y) => (
          <line key={`drB-${y}`} x1="775" y1={y} x2="830" y2={y} stroke="var(--skyline-fill-light)" />
        ))}
        {[110,130,150,170,190,210].map((y) => (
          <line key={`drC-${y}`} x1="840" y1={y} x2="890" y2={y} stroke="var(--skyline-fill-light)" />
        ))}

        <path d="M905 232 L905 195 L935 195 L935 232 Z" />

        {/* Maastoren */}
        <path d="M960 232 L960 30 L1000 30 L1000 232 Z" />
        <path d="M985 30 L985 10 L995 10 L995 30" />
        {Array.from({ length: 18 }).map((_, i) => (
          <line key={`m-${i}`} x1="960" y1={45 + i * 10} x2="1000" y2={45 + i * 10} stroke="var(--skyline-fill-light)" />
        ))}

        {/* Montevideo */}
        <path d="M1020 232 L1020 78 L1065 78 L1065 232 Z" />
        <path d="M1040 78 L1040 60 L1055 60 L1055 78" />
        {[95,115,135,155,175,195,215].map((y) => (
          <line key={`mv-${y}`} x1="1020" y1={y} x2="1065" y2={y} stroke="var(--skyline-fill-light)" />
        ))}

        <path d="M1080 232 L1080 180 L1120 180 L1120 232 Z" />
        <path d="M1130 232 L1130 195 L1160 195 L1160 232 Z" />
        <path d="M1170 232 L1170 165 L1200 165 L1200 232 Z" />

        {/* Cube houses cluster */}
        <g transform="translate(1220 200)">
          <rect x="-12" y="-12" width="24" height="24" transform="rotate(45)" />
          <rect x="18" y="-12" width="24" height="24" transform="rotate(45 30 0)" />
          <rect x="48" y="-12" width="24" height="24" transform="rotate(45 60 0)" />
        </g>

        {/* Harbor cranes — jib+stays isolated into their own group so they can
            rotate around the mast-top pivot; angle 0 is pixel-identical to a
            plain straight line. */}
        <g stroke="var(--skyline-stroke)">
          <line x1="1340" y1="232" x2="1340" y2="120" />
          <g
            className={styles.skyCraneJib}
            style={{ transformOrigin: "1340px 120px", transform: `rotate(${craneAngles[0]}deg)` }}
          >
            <line x1="1340" y1="120" x2="1395" y2="120" />
            <line x1="1340" y1="120" x2="1300" y2="135" />
            <line x1="1395" y1="120" x2="1390" y2="155" />
          </g>

          <line x1="1430" y1="232" x2="1430" y2="100" />
          <g
            className={styles.skyCraneJib}
            style={{ transformOrigin: "1430px 100px", transform: `rotate(${craneAngles[1]}deg)` }}
          >
            <line x1="1430" y1="100" x2="1495" y2="100" />
            <line x1="1430" y1="100" x2="1390" y2="115" />
            <line x1="1495" y1="100" x2="1490" y2="135" />
          </g>

          <line x1="1525" y1="232" x2="1525" y2="135" />
          <g
            className={styles.skyCraneJib}
            style={{ transformOrigin: "1525px 135px", transform: `rotate(${craneAngles[2]}deg)` }}
          >
            <line x1="1525" y1="135" x2="1580" y2="135" />
            <line x1="1525" y1="135" x2="1485" y2="150" />
            <line x1="1580" y1="135" x2="1575" y2="170" />
          </g>
        </g>

        <path d="M1280 232 L1280 200 L1310 200 L1310 232 Z" />

        {/* Lit windows — fill-opacity 0 and stroke:none by default, so they
            are completely invisible until litWindows marks them. */}
        <g>
          {SKY_WINDOWS.map((win) => (
            <rect
              key={`window-${win.index}`}
              x={win.x}
              y={win.y}
              width={WINDOW_WIDTH}
              height={WINDOW_HEIGHT}
              className={`${styles.skyWindow} ${litWindows.has(win.index) ? styles.skyWindowLit : ""}`}
            />
          ))}
        </g>
      </g>
    </svg>
  );
}
