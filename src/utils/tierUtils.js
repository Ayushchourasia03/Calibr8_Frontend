import { createElement } from "react";
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
    t.dv < 2 ? t.lo + Math.round((t.dv + 1) * sp) : t.i < 5 ? t.lo + 200 : null;
  const nextName =
    t.dv < 2
      ? `${t.name} ${ROMAN_NUMERALS[t.dv + 1]}`
      : t.i < 5
        ? `${TIERS[t.i + 1]} I`
        : null;
  const pr = nextAt
    ? Math.min(1, Math.max(0, (rating - (nextAt - sp)) / sp))
    : 1;

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

let SHN = 0;
export function renderShieldSvg(i = 0, dv = 0, sz = 76, cal = false) {
  i = Number.isInteger(i) ? Math.min(TIERS.length - 1, Math.max(0, i)) : 0;
  dv = Number.isInteger(dv) ? Math.min(2, Math.max(0, dv)) : 0;
  sz = Number.isFinite(sz) ? Math.min(256, Math.max(16, Math.floor(sz))) : 76;
  const id = `sg_${++SHN}`;
  const c = TIER_COLORS[i] || "#2F7BFF";
  const c2 =
    ["#9CC3FF", "#7AF0E4", "#D4B8FF", "#9BF5C0", "#FFC49A", "#FF9DB8"][i] ||
    "#7CC0FF";
  const oy = i >= 4 ? 14 : 4;
  const chev = Array.from(
    { length: Math.min(3, i + 1) },
    (_, k) =>
      `<path d='M30 ${60 + oy - k * 11} L50 ${48 + oy - k * 11} L70 ${
        60 + oy - k * 11
      }' fill='none' stroke='#fff' stroke-width='5' stroke-linecap='round' stroke-linejoin='round' opacity='${
        1 - k * 0.12
      }'/>`,
  ).join("");
  const wings =
    i >= 3
      ? `<path d='M12 36 C-8 30 -10 62 10 72 C4 60 6 50 14 46 Z' fill='${c2}' opacity='.9'/><path d='M88 36 C108 30 110 62 90 72 C96 60 94 50 86 46 Z' fill='${c2}' opacity='.9'/>`
      : "";
  const star =
    i >= 4
      ? `<path d='M50 24 l3.2 7 7.6 .9 -5.6 5.2 1.5 7.5 -6.7-3.8 -6.7 3.8 1.5-7.5 -5.6-5.2 7.6-.9z' fill='#fff'/>`
      : "";
  const crown =
    i === 5
      ? `<path d='M34 6 L38 -8 L46 0 L50 -12 L54 0 L62 -8 L66 6 Z' fill='#FFD76B' stroke='#fff' stroke-width='1.5'/>`
      : "";
  const pips = [0, 1, 2]
    .map(
      (k) =>
        `<circle cx='${38 + k * 12}' cy='96' r='3.6' fill='${
          k <= dv ? "#fff" : "rgba(255,255,255,.3)"
        }'/>`,
    )
    .join("");

  return `<svg viewBox='-14 -16 128 148' width='${sz}' height='${Math.round(
    sz * 1.16,
  )}' style='filter:drop-shadow(0 0 ${
    i >= 4 ? 14 : 6
  }px ${c});flex:none' class='${
    i === 5 ? "shpulse" : ""
  }' role='img' aria-label='${TIERS[i]} ${ROMAN_NUMERALS[dv]}'><defs><linearGradient id='${id}' x1='0' y1='0' x2='1' y2='1'><stop offset='0' stop-color='${c2}'/><stop offset='.55' stop-color='${c}'/><stop offset='1' stop-color='#1b1240'/></linearGradient></defs>${wings}<path d='M50 4 L92 20 V62 C92 90 70 108 50 116 C30 108 8 90 8 62 V20 Z' fill='url(#${id})' stroke='#fff' stroke-width='${
    2 + Math.min(i, 3)
  }' stroke-opacity='.9'/><path d='M50 13 L84 26 V62 C84 84 66 99 50 107 C34 99 16 84 16 62 V26 Z' fill='none' stroke='#fff' stroke-opacity='.4' stroke-width='1.5'/>${
    cal
      ? "<text x='50' y='70' text-anchor='middle' font-size='34' font-weight='700' fill='#fff'>?</text>"
      : chev + star + pips
  }${crown}</svg>`;
}

export function ShieldBadge({
  tierIndex = 0,
  divisionIndex = 0,
  size = 76,
  calibrating = false,
}) {
  const html = renderShieldSvg(tierIndex, divisionIndex, size, calibrating);
  return createElement("span", {
    style: { display: "inline-flex", verticalAlign: "middle" },
    dangerouslySetInnerHTML: { __html: html },
  });
}
