export const HIRING_TRACKS = [
  {
    id: "capgemini",
    name: "Capgemini style",
    subtitle: "Entry-level service-company drive",
    readiness: 0.82,
    description:
      "This track mirrors the common pattern of entry-level drives at IT services companies: a timed aptitude and reasoning test, an English section and a short coding or pseudo-code round. Use it to build speed and accuracy on the fundamentals before you move up the ladder.",
    rounds: [
      ["Aptitude and reasoning", "about 45 min"],
      ["English and verbal", "about 20 min"],
      ["Pseudo-code and basic coding", "about 40 min"],
    ],
    topics:
      "Quantitative aptitude, logical reasoning, grammar and reading, arrays and strings, basic SQL, OOPs basics",
    prerequisites: "Basic programming in one language",
    difficulty: "Easy to medium",
    outcome: "Speed and accuracy on the first-round pattern",
  },
  {
    id: "tcs",
    name: "TCS style",
    subtitle: "High-volume national test",
    readiness: 0.66,
    description:
      "Modelled on large national-scale tests with numerical, verbal and reasoning sections followed by programming questions. It rewards consistency and good time management across many short questions.",
    rounds: [
      ["Numerical and reasoning", "about 40 min"],
      ["Verbal ability", "about 25 min"],
      ["Programming (2 problems)", "about 60 min"],
    ],
    topics:
      "Aptitude, verbal, arrays, strings, sorting, number theory basics, simple recursion",
    prerequisites: "Capgemini style track at 70%",
    difficulty: "Easy to medium",
    outcome: "Comfort with timed multi-section tests",
  },
  {
    id: "infosys",
    name: "Infosys style",
    subtitle: "Logic and problem-solving test",
    readiness: 0.52,
    description:
      "Based on the common pattern of logical reasoning, pseudo-code and coding questions, with some puzzle-style thinking. The coding problems lean on clear logic and clean implementation more than on advanced algorithms.",
    rounds: [
      ["Reasoning and puzzles", "about 35 min"],
      ["Pseudo-code and output prediction", "about 25 min"],
      ["Coding (2 to 3 problems)", "about 70 min"],
    ],
    topics:
      "Logical reasoning, puzzles, strings, hashing, recursion, DBMS and SQL basics",
    prerequisites: "TCS style track at 70%",
    difficulty: "Medium",
    outcome: "Clean logic under time pressure",
  },
  {
    id: "product",
    name: "Product company",
    subtitle: "Coding plus CS fundamentals",
    readiness: 0.38,
    description:
      "For product-based companies that combine an online assessment with fundamentals interviews. Expect medium problems with constraints that force you to optimise, plus questions on databases, operating systems and object-oriented design.",
    rounds: [
      ["Online assessment (3 problems)", "about 90 min"],
      ["CS fundamentals interview", "about 45 min"],
      ["Coding interview", "about 60 min"],
    ],
    topics:
      "Trees, graphs, dynamic programming basics, binary search, heaps, DBMS, OS, OOPs, SQL",
    prerequisites: "Infosys style track at 70%",
    difficulty: "Medium to hard",
    outcome: "Optimal solutions and clear explanations",
  },
  {
    id: "bigtech",
    name: "Big tech style",
    subtitle: "Hard problems with follow-ups",
    readiness: 0.2,
    description:
      "Practice for interviews known for hard problems and sharp follow-ups. Each question has a brute force, a better and an optimal approach, and you improve your solution step by step, explain the trade-offs and handle edge cases.",
    rounds: [
      ["Coding round 1 (hard)", "about 45 min"],
      ["Coding round 2 with follow-ups", "about 45 min"],
      ["Optimisation and complexity discussion", "about 30 min"],
      ["System design basics", "about 45 min"],
    ],
    topics:
      "Advanced DP, graphs, segment trees, greedy proofs, bit manipulation, system design basics",
    prerequisites: "Product company track at 70%",
    difficulty: "Hard",
    outcome: "Optimal solutions and strong communication",
  },
  {
    id: "toptier",
    name: "Top tier",
    subtitle: "Netflix, Uber and Google style",
    readiness: 0.08,
    description:
      "The most demanding track: open-ended problems, deep follow-ups, design thinking and real-world trade-offs. Meant for learners who can already solve hard problems and want to practise at interview pace.",
    rounds: [
      ["Hard coding (2 problems)", "about 90 min"],
      ["Deep follow-ups", "about 45 min"],
      ["System design", "about 60 min"],
      ["Behavioural and projects", "about 45 min"],
    ],
    topics:
      "All coding topics, system design, data modelling, AI in practice, communication",
    prerequisites: "Big tech style track at 70%",
    difficulty: "Hard",
    outcome: "Interview-ready at the top end",
  },
];
