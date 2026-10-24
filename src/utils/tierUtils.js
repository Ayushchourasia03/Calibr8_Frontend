import { TIERS, TIER_COLORS, ROMAN_NUMERALS } from "../data/constants";

export function getTierForRating(rating = 1000) {
  const i = Math.min(5, Math.max(0, Math.floor((rating - 700) / 200)));
  const lo = 700 + 200 * i;
  const dv = Math.min(2, Math.floor((rating - lo) / (200 / 3)));
  return {
    i,
    dv,
    name: TIERS[i],
    full: `${TIERS[i]} ${ROMAN_NUMERALS[dv]}`,
    color: TIER_COLORS[i],
    lo,
  };
}

export function getTierInfo(rating = 1000) {
  const t = getTierForRating(rating);
  const sp = 200 / 3;
  const nextAt =
    t.dv < 2
      ? t.lo + Math.round((t.dv + 1) * sp)
      : t.i < 5
        ? t.lo + 200
        : null;
  const nextName =
    t.dv < 2
      ? `${t.name} ${ROMAN_NUMERALS[t.dv + 1]}`
      : t.i < 5
        ? `${TIERS[t.i + 1]} I`
        : null;
  const pr = nextAt ? Math.min(1, Math.max(0, (rating - (nextAt - sp)) / sp)) : 1;

  return {
    ...t,
    rating,
    nextAt,
    nextName,
    pr,
  };
}

export const ymd = (y, m, d) =>
  `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;

export const todayKey = () => {
  const n = new Date();
  return ymd(n.getFullYear(), n.getMonth(), n.getDate());
};
