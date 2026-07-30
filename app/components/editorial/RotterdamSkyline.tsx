// app/components/editorial/RotterdamSkyline.tsx
// Hairline silhouettes of recognizable Rotterdam buildings.
// Drawn faint and small as background texture, fades out as bridge fades in.

import styles from "./Editorial.module.css";

type WindowGroup = { name: string; x: number; width: number; floorYs: readonly number[] };

/**
 * Single source of truth for both the visible floor-divider lines and the
 * invisible window rects layered on top of them — one array, not two, so
 * editing a building's floor spacing can't silently desync the windows from
 * what's actually drawn.
 */
const WINDOW_GROUPS: readonly WindowGroup[] = [
  { name: "delftse-poort-left", x: 515, width: 40, floorYs: [105, 135, 165, 195] },
  { name: "delftse-poort-right", x: 565, width: 40, floorYs: [80, 110, 140, 170, 200] },
  { name: "de-rotterdam-a", x: 715, width: 55, floorYs: [85, 105, 125, 145, 165, 185, 205] },
  { name: "de-rotterdam-b", x: 775, width: 55, floorYs: [65, 85, 105, 145, 165, 185, 205] },
  { name: "de-rotterdam-c", x: 840, width: 50, floorYs: [110, 130, 150, 170, 190, 210] },
  { name: "maastoren", x: 960, width: 40, floorYs: Array.from({ length: 18 }, (_, i) => 45 + i * 10) },
  { name: "montevideo", x: 1020, width: 45, floorYs: [95, 115, 135, 155, 175, 195, 215] },
];

const WINDOW_GROUP_BY_NAME = new Map(WINDOW_GROUPS.map((group) => [group.name, group]));

/** Renders a building's floor-divider lines from its WINDOW_GROUPS entry. */
function FloorDividerLines({ groupName }: { groupName: string }) {
  const group = WINDOW_GROUP_BY_NAME.get(groupName);
  if (!group) return null;
  return (
    <>
      {group.floorYs.map((y) => (
        <line
          key={`${group.name}-${y}`}
          x1={group.x}
          y1={y}
          x2={group.x + group.width}
          y2={y}
          stroke="var(--skyline-fill-light)"
        />
      ))}
    </>
  );
}

const WINDOWS_PER_GAP = 2;
const WINDOW_WIDTH = 5;
const WINDOW_HEIGHT = 6;

type SkyWindow = { x: number; y: number; index: number };

const SKY_WINDOWS: readonly SkyWindow[] = WINDOW_GROUPS.flatMap(({ x, width, floorYs }) =>
  floorYs.slice(0, -1).flatMap((top, gap) => {
    const bottom = floorYs[gap + 1];
    const y = top + (bottom - top) / 2 - WINDOW_HEIGHT / 2;
    const slot = (width - WINDOW_WIDTH) / (WINDOWS_PER_GAP + 1);
    return Array.from({ length: WINDOWS_PER_GAP }, (_, w) => ({
      x: x + slot * (w + 1),
      y,
    }));
  })
).map((pos, index) => ({ ...pos, index }));

/** Exported so useSkyState.ts can hash exactly this many window indices — one source of truth. */
export const SKY_WINDOW_COUNT = SKY_WINDOWS.length;

const EMPTY_LIT_WINDOWS: ReadonlySet<number> = new Set();
const DEFAULT_CRANE_ANGLES: readonly [number, number, number] = [0, 0, 0];

type RotterdamSkylineProps = {
  progress: number;
  litWindows?: ReadonlySet<number>;
  /** Rotation of each crane's jib, in degrees. */
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
        <FloorDividerLines groupName="delftse-poort-left" />
        <FloorDividerLines groupName="delftse-poort-right" />

        <path d="M620 232 L620 180 L660 180 L660 232 Z" />
        <path d="M670 232 L670 165 L695 165 L695 232 Z" />

        {/* De Rotterdam — three offset stacked towers */}
        <path d="M715 232 L715 70 L770 70 L770 232 Z" />
        <path d="M775 232 L775 50 L830 50 L830 130 L835 130 L835 232 Z" />
        <path d="M840 232 L840 95 L890 95 L890 232 Z" />
        <FloorDividerLines groupName="de-rotterdam-a" />
        <FloorDividerLines groupName="de-rotterdam-b" />
        <FloorDividerLines groupName="de-rotterdam-c" />

        <path d="M905 232 L905 195 L935 195 L935 232 Z" />

        {/* Maastoren */}
        <path d="M960 232 L960 30 L1000 30 L1000 232 Z" />
        <path d="M985 30 L985 10 L995 10 L995 30" />
        <FloorDividerLines groupName="maastoren" />

        {/* Montevideo */}
        <path d="M1020 232 L1020 78 L1065 78 L1065 232 Z" />
        <path d="M1040 78 L1040 60 L1055 60 L1055 78" />
        <FloorDividerLines groupName="montevideo" />

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
            style={{ transformBox: "view-box", transformOrigin: "1340px 120px", transform: `rotate(${craneAngles[0]}deg)` }}
          >
            <line x1="1340" y1="120" x2="1395" y2="120" />
            <line x1="1340" y1="120" x2="1300" y2="135" />
            <line x1="1395" y1="120" x2="1390" y2="155" />
          </g>

          <line x1="1430" y1="232" x2="1430" y2="100" />
          <g
            className={styles.skyCraneJib}
            style={{ transformBox: "view-box", transformOrigin: "1430px 100px", transform: `rotate(${craneAngles[1]}deg)` }}
          >
            <line x1="1430" y1="100" x2="1495" y2="100" />
            <line x1="1430" y1="100" x2="1390" y2="115" />
            <line x1="1495" y1="100" x2="1490" y2="135" />
          </g>

          <line x1="1525" y1="232" x2="1525" y2="135" />
          <g
            className={styles.skyCraneJib}
            style={{ transformBox: "view-box", transformOrigin: "1525px 135px", transform: `rotate(${craneAngles[2]}deg)` }}
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
              style={{ transitionDelay: `${win.index * 55}ms` }}
            />
          ))}
        </g>
      </g>
    </svg>
  );
}
