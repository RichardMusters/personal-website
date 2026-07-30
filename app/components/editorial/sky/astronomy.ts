// app/components/editorial/sky/astronomy.ts
// Sunrise/sunset (NOAA/SunCalc algorithm) and moon phase. Pure functions, no
// site-specific coordinates baked in — lat/lon are passed in by the caller.

const RAD = Math.PI / 180;
const J1970 = 2440588;
const J2000 = 2451545;

const toJulian = (date: Date) => date.valueOf() / 86400000 - 0.5 + J1970;
const fromJulian = (j: number) => new Date((j + 0.5 - J1970) * 86400000);

export type SolarTimes = {
  sunset: Date;
  sunrise: Date;
  polarDay: boolean;
  polarNight: boolean;
};

export function solarTimes(date: Date, lat: number, lon: number): SolarTimes {
  const days = toJulian(date) - J2000;
  const lw = -lon * RAD;
  const n = Math.round(days - 0.0009 - lw / (2 * Math.PI));
  const jStar = 0.0009 + lw / (2 * Math.PI) + n;
  const M = (357.5291 + 0.98560028 * jStar) * RAD;
  const C = (1.9148 * Math.sin(M) + 0.02 * Math.sin(2 * M) + 0.0003 * Math.sin(3 * M)) * RAD;
  const L = M + C + 102.9372 * RAD + Math.PI;
  const jTransit = J2000 + jStar + 0.0053 * Math.sin(M) - 0.0069 * Math.sin(2 * L);
  const dec = Math.asin(Math.sin(L) * Math.sin(23.4397 * RAD));
  const h = -0.833 * RAD;
  const cosW =
    (Math.sin(h) - Math.sin(lat * RAD) * Math.sin(dec)) / (Math.cos(lat * RAD) * Math.cos(dec));
  const w = Math.acos(Math.min(1, Math.max(-1, cosW)));
  const jSet =
    J2000 + 0.0009 + (w + lw) / (2 * Math.PI) + n + 0.0053 * Math.sin(M) - 0.0069 * Math.sin(2 * L);

  return {
    sunset: fromJulian(jSet),
    sunrise: fromJulian(jTransit - (jSet - jTransit)),
    polarDay: cosW < -1,
    polarNight: cosW > 1,
  };
}

export function moonPhase(date: Date): number {
  const reference = Date.UTC(2000, 0, 6, 18, 14);
  const synodic = 29.530588853;
  const elapsed = (date.valueOf() - reference) / 86400000;
  return (((elapsed % synodic) + synodic) % synodic) / synodic;
}
