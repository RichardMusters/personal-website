// app/components/editorial/Erasmusbrug.tsx
// The "Zwaan" — single asymmetric pylon with cable-stays. Hairlines, fades in mid-page.

export default function Erasmusbrug({ progress }: { progress: number }) {
  const op = Math.max(0, Math.min(1, (progress - 0.2) * 1.4));
  const dy = (1 - op) * 30;
  return (
    <svg
      viewBox="0 0 1600 600"
      preserveAspectRatio="xMidYMid slice"
      style={{
        position: "absolute", left: 0, right: 0, bottom: 0,
        width: "100%", height: "70%",
        opacity: op * 0.55,
        transform: `translateY(${dy}px)`,
        pointerEvents: "none",
      }}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="bridgeFade" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--bridge-stroke-top)" />
          <stop offset="100%" stopColor="var(--bridge-stroke-bot)" />
        </linearGradient>
      </defs>

      <line x1="0" y1="430" x2="1600" y2="430" stroke="var(--skyline-fill-light)" strokeWidth="1" />
      <g stroke="var(--bridge-stroke-bot)" strokeWidth="1">
        <line x1="100" y1="450" x2="280" y2="450" />
        <line x1="380" y1="465" x2="520" y2="465" />
        <line x1="640" y1="455" x2="780" y2="455" />
        <line x1="900" y1="470" x2="1040" y2="470" />
        <line x1="1180" y1="450" x2="1320" y2="450" />
        <line x1="1400" y1="465" x2="1520" y2="465" />
      </g>

      <g fill="none" stroke="url(#bridgeFade)" strokeWidth="1.25" strokeLinecap="round">
        <line x1="120" y1="430" x2="1480" y2="430" strokeWidth="2" />
        <line x1="120" y1="425" x2="1480" y2="425" strokeWidth="1" />

        <line x1="1080" y1="430" x2="1080" y2="510" />
        <line x1="1240" y1="430" x2="1240" y2="495" />
        <line x1="1400" y1="430" x2="1400" y2="485" />

        <path d="M 720 430 L 700 80" strokeWidth="2.5" />
        <path d="M 720 430 L 728 510" strokeWidth="2" />
        <path d="M 700 80 L 720 100 L 720 240" strokeWidth="2" />

        {Array.from({ length: 14 }).map((_, i) => {
          const t = i / 13;
          const x = 740 + t * 720;
          const anchorY = 90 + t * 130;
          return <line key={`r-${i}`} x1="710" y1={anchorY} x2={x} y2="430" strokeWidth="0.8" />;
        })}

        {Array.from({ length: 6 }).map((_, i) => {
          const t = i / 5;
          const x = 680 - t * 200;
          return <line key={`l-${i}`} x1="705" y1={120 + t * 70} x2={x} y2="430" strokeWidth="0.8" />;
        })}

        <g strokeWidth="0.7" stroke="var(--skyline-stroke)">
          {Array.from({ length: 8 }).map((_, i) => {
            const x0 = 120 + i * 60;
            return (
              <g key={`x-${i}`}>
                <line x1={x0} y1="430" x2={x0 + 60} y2="455" />
                <line x1={x0 + 60} y1="430" x2={x0} y2="455" />
                <line x1={x0} y1="455" x2={x0 + 60} y2="455" />
              </g>
            );
          })}
        </g>
      </g>

      <circle cx="700" cy="78" r="2.5" fill="var(--skyline-stroke)" />
    </svg>
  );
}
