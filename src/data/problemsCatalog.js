import { TOPS } from "./constants";

const AD = [
  "Hidden",
  "Quiet",
  "Rapid",
  "Mirror",
  "Silent",
  "Twisted",
  "Golden",
  "Broken",
  "Lucky",
  "Frozen",
  "Wandering",
  "Crimson",
  "Nested",
  "Balanced",
  "Sparse",
  "Rotating",
  "Hollow",
  "Bright",
  "Cyclic",
  "Tangled",
  "Lazy",
  "Narrow",
  "Steady",
  "Brave",
  "Hungry",
  "Tiny",
  "Rival",
  "Gentle",
  "Swift",
  "Clever",
];

const NO = [
  "Pairs",
  "Window",
  "Ladder",
  "Islands",
  "Coins",
  "Towers",
  "Bridges",
  "Tickets",
  "Mirrors",
  "Garden",
  "Echoes",
  "Keys",
  "Rivers",
  "Stairs",
  "Beads",
  "Signals",
  "Lanterns",
  "Orchard",
  "Maze",
  "Ribbons",
  "Marbles",
  "Streets",
  "Clocks",
  "Planets",
  "Cards",
  "Roads",
  "Boxes",
  "Harbor",
  "Trains",
  "Letters",
];

const hs = (i) => {
  let x = Math.imul(i + 1, 0x9e3779b1) >>> 0;
  x ^= x >>> 16;
  x = Math.imul(x, 0x85ebca6b) >>> 0;
  x ^= x >>> 13;
  x = Math.imul(x, 0xc2b2ae35) >>> 0;
  x ^= x >>> 16;
  return (x >>> 0) / 4294967296;
};

// Generates 5,000 algorithmic questions with deterministic distribution
export const PROBLEMS_CATALOG = Array.from({ length: 5000 }, (_, i) => {
  const id = i + 1;
  const r = hs(id);
  const l = r < 0.35 ? 0 : r < 0.8 ? 1 : 2;
  const a = [
    [55, 85],
    [35, 60],
    [18, 42],
  ][l];
  return {
    id,
    l,
    t: TOPS[Math.floor(hs(id + 9e3) * TOPS.length)],
    ac: Math.round((a[0] + hs(id + 2e4) * (a[1] - a[0])) * 10) / 10,
    title: `${AD[id % 30]} ${NO[(id * 7 + Math.floor(id / 30)) % 30]}`,
    d: Math.round([600, 1000, 1500][l] + hs(id + 3e4) * [400, 500, 600][l]),
    pts: [10, 25, 50][l],
  };
});
