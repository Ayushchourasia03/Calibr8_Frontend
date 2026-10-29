export const LANGS = [
  "C++",
  "Java",
  "Python3",
  "Python",
  "JavaScript",
  "TypeScript",
  "C#",
  "C",
  "Go",
  "Kotlin",
  "Swift",
  "Rust",
  "Ruby",
  "PHP",
  "Dart",
  "Scala",
  "Elixir",
  "Erlang",
  "Racket",
];

export const TIERS = ["Pulse", "Flux", "Prism", "Aurora", "Eclipse", "Zenith"];

export const TIER_COLORS = [
  "#5EA0FF",
  "#36D1C4",
  "#A678FF",
  "#3DDC84",
  "#FF8A3D",
  "#FF4F7A",
];

export const ROMAN_NUMERALS = ["I", "II", "III"];

export const TOPS = [
  "Arrays",
  "Strings",
  "Recursion",
  "Graphs",
  "Sliding Window",
  "DP",
  "SQL",
  "Aptitude",
  "Trees",
  "Binary Search",
  "Bit Manipulation",
  "Heaps",
  "Greedy",
  "OOPs",
  "Networks",
  "Verbal",
  "Beginner",
  "Patterns",
  "Basic Math",
  "Hashing",
  "Two Pointers",
  "Linked List",
  "Stack and Queue",
];

export const DIFFICULTY_LABELS = ["Easy", "Medium", "Hard"];

export const DEFAULT_QUESTION = {
  title: "Longest Calm Window",
  topic: "Sliding Window",
  l: 1,
  d: 1103,
  pts: 25,
  text: "Given readings and a limit k, find the longest stretch where largest minus smallest is at most k.",
  ex: "readings = [4, 8, 5, 1, 7], k = 4  ->  3",
  hints: [
    "What two facts about the window do you need at every step?",
    "You need the largest and smallest value in a moving window, fast.",
    "Keep two lists of candidate positions, one decreasing and one increasing.",
  ],
  trace: [
    ["add 4", "[4]", "4", "4", "1"],
    ["add 8", "[4,8]", "8", "4", "2"],
    ["add 5", "[4,8,5]", "8", "4", "3"],
    ["add 1, shrink", "[5,1]", "5", "1", "3"],
    ["add 7, shrink", "[7]", "7", "7", "3"],
  ],
  key: "Sliding Window1d_default",
  stretch: false,
};

export const BANK = {
  Arrays: ["Pair Finder", "Find two readings that add up to a target."],
  Strings: [
    "Mirror Words",
    "Check whether a phrase reads the same both ways, ignoring spaces.",
  ],
  Recursion: [
    "Staircase Paths",
    "Count the ways to climb n steps, taking 1 or 2 at a time.",
  ],
  Graphs: [
    "Island Count",
    "Count the separate islands in a grid of land and water.",
  ],
  "Sliding Window": [
    "Longest Calm Window",
    "Given readings and a limit k, find the longest stretch where largest minus smallest is at most k.",
  ],
  DP: ["Coin Ladder", "Find the fewest coins that make a given amount."],
  SQL: [
    "Top Earners",
    "Write a query that lists the highest paid employee in each department.",
  ],
  Aptitude: [
    "Train Meeting",
    "Two trains start toward each other. After how long do they meet?",
  ],
  Trees: [
    "Maximum Depth",
    "Find the maximum depth of a binary tree from root to leaf.",
  ],
  "Binary Search": [
    "Search Rotated Array",
    "Search for a target value in a rotated sorted array in logarithmic time.",
  ],
  "Bit Manipulation": [
    "Single Number",
    "Find the single element in an array where every other element appears twice.",
  ],
  Heaps: [
    "Kth Largest Element",
    "Find the kth largest element in an unsorted stream using an optimal min-heap.",
  ],
  Greedy: [
    "Jump Game",
    "Determine if you are able to reach the last index given max jump lengths.",
  ],
};
