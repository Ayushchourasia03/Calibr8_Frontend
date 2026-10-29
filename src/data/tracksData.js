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

export const BANDS = [
  [
    "Service companies",
    "Entry-level drives. Mostly aptitude, English and basic coding.",
  ],
  ["Product, mid-size", "Coding rounds plus CS fundamentals."],
  ["Big tech", "Hard problems, follow-ups and strong communication."],
  ["Top tier", "The highest bar: deep follow-ups, design and culture."],
];

export const COMPANIES = [
  [
    "Capgemini",
    0,
    0.82,
    "Entry-level IT services drive.",
    [
      [
        "Application and resume screening",
        "Register through the campus portal or careers page. Your resume is checked for eligibility such as CGPA, backlogs and branch.",
        "resume",
      ],
      [
        "Online assessment",
        "A timed test with aptitude, reasoning, English and pseudo-code, often with a coding section.",
        "aptitude",
      ],
      [
        "Technical interview",
        "Programming basics, DBMS, OOPs, a walk through your project, sometimes a simple coding question.",
        "tech",
      ],
      [
        "HR interview",
        "Communication, strengths and weaknesses, relocation and why this company.",
        "hr",
      ],
      [
        "Offer and onboarding",
        "Offer letter, document verification and joining date.",
        "offer",
      ],
    ],
  ],
  [
    "TCS",
    0,
    0.74,
    "Large national hiring test with several categories of roles.",
    [
      [
        "Registration and resume",
        "Register on the official portal and keep your resume and academic details ready.",
        "resume",
      ],
      [
        "National qualifier test",
        "Sections on numerical, verbal and reasoning ability plus programming. Check the official site for the current format.",
        "aptitude",
      ],
      [
        "Technical interview",
        "Programming, DBMS, OOPs, projects and basic problem solving.",
        "tech",
      ],
      [
        "Managerial round",
        "Situation questions, teamwork and learning ability.",
        "hr",
      ],
      [
        "HR interview",
        "Documents, relocation, expectations and communication.",
        "hr",
      ],
      ["Offer", "Offer letter and onboarding steps.", "offer"],
    ],
  ],
  [
    "Infosys",
    0,
    0.66,
    "Logic and problem-solving test followed by interviews.",
    [
      [
        "Registration",
        "Apply through the campus or the official portal.",
        "resume",
      ],
      [
        "Online test",
        "Reasoning, mathematical ability, verbal ability and pseudo-code. Specialist roles add harder coding.",
        "aptitude",
      ],
      [
        "Technical interview",
        "Programming, DBMS, OOPs and your projects.",
        "tech",
      ],
      [
        "HR interview",
        "Communication, flexibility and expectations.",
        "hr",
      ],
      ["Offer", "Offer letter and onboarding steps.", "offer"],
    ],
  ],
  [
    "Wipro",
    0,
    0.6,
    "Talent-hunt style online assessment.",
    [
      [
        "Registration and resume",
        "Register and submit your resume and academic details.",
        "resume",
      ],
      [
        "Online assessment",
        "Aptitude, verbal and a coding section.",
        "aptitude",
      ],
      [
        "Technical interview",
        "Core CS, projects and coding basics.",
        "tech",
      ],
      [
        "HR interview",
        "Communication and expectations.",
        "hr",
      ],
      ["Offer", "Offer letter and onboarding.", "offer"],
    ],
  ],
  [
    "Accenture",
    0,
    0.55,
    "Cognitive and technical assessment with a communication check.",
    [
      [
        "Application and resume",
        "Apply with an up-to-date resume.",
        "resume",
      ],
      [
        "Cognitive and technical assessment",
        "Logic and English questions, technical MCQs on networks, DBMS and OS, and possibly coding.",
        "aptitude",
      ],
      [
        "Communication assessment",
        "A written or spoken English check.",
        "hr",
      ],
      ["Interview", "Technical and HR discussion.", "tech"],
      ["Offer", "Offer letter and onboarding.", "offer"],
    ],
  ],
  [
    "Adobe",
    1,
    0.38,
    "Product company with coding-heavy interviews.",
    [
      [
        "Resume screening",
        "Projects with clear impact matter. Keep it to one page.",
        "resume",
      ],
      [
        "Online assessment",
        "Coding problems and sometimes MCQs.",
        "oa",
      ],
      [
        "Technical interviews",
        "Two or three rounds on data structures, problem solving and project discussion. Sometimes low-level design.",
        "tech",
      ],
      [
        "Managerial and HR",
        "Team fit, motivation and expectations.",
        "hr",
      ],
      ["Offer", "Offer discussion and joining.", "offer"],
    ],
  ],
  [
    "Uber",
    1,
    0.3,
    "Fast-paced product company.",
    [
      [
        "Resume screening",
        "Highlight projects, internships and measurable results.",
        "resume",
      ],
      [
        "Online coding assessment",
        "Timed algorithm problems.",
        "oa",
      ],
      [
        "Technical interviews",
        "Coding rounds and design basics.",
        "tech",
      ],
      [
        "Hiring manager and behavioural",
        "Past work, ownership and team fit.",
        "hr",
      ],
      ["Offer", "Offer discussion.", "offer"],
    ],
  ],
  [
    "Amazon",
    2,
    0.22,
    "Algorithms plus behavioural interviews based on leadership principles.",
    [
      [
        "Application and resume",
        "Tailor your resume. Use short bullets with numbers.",
        "resume",
      ],
      [
        "Online assessment",
        "Coding problems, and for many roles a debugging or work-style section. Check the current format.",
        "oa",
      ],
      [
        "Interview loop (virtual)",
        "Several back-to-back interviews: coding and data structures, plus behavioural questions on leadership principles. One interviewer acts as a bar raiser.",
        "tech",
      ],
      [
        "System design (for some roles)",
        "Design a simple service and discuss trade-offs.",
        "design",
      ],
      [
        "Debrief and decision",
        "The interviewers meet and decide together.",
        "offer",
      ],
      ["Offer", "Offer discussion.", "offer"],
    ],
  ],
  [
    "Microsoft",
    2,
    0.18,
    "Coding, problem solving and design conversations.",
    [
      [
        "Resume screening",
        "Projects and internships are weighed heavily.",
        "resume",
      ],
      [
        "Online coding assessment",
        "Timed coding problems, format varies by year.",
        "oa",
      ],
      [
        "Interview loop",
        "Three or four rounds: coding, problem solving, sometimes design, and behavioural questions.",
        "tech",
      ],
      [
        "Hiring manager conversation",
        "Team fit and motivation.",
        "hr",
      ],
      ["Offer", "Offer discussion.", "offer"],
    ],
  ],
  [
    "Google",
    3,
    0.08,
    "Algorithm-heavy interviews with committee review.",
    [
      [
        "Resume and application",
        "Strong projects, clear impact and a concise resume.",
        "resume",
      ],
      [
        "Recruiter call",
        "A short call about your background and interest.",
        "hr",
      ],
      [
        "Technical screen",
        "One or two coding interviews on algorithms, by phone or video.",
        "oa",
      ],
      [
        "Virtual onsite loop",
        "Four or five rounds: coding and algorithms, plus a behavioural round. System design is added for experienced roles.",
        "tech",
      ],
      [
        "Hiring committee review",
        "A committee reviews the feedback.",
        "offer",
      ],
      [
        "Team matching and offer",
        "You talk to teams, then receive an offer.",
        "offer",
      ],
    ],
  ],
  [
    "Netflix",
    3,
    0.05,
    "Mostly hires experienced engineers. Entry-level hiring is limited, so verify current openings.",
    [
      [
        "Recruiter conversation",
        "Discuss the role, level and your experience.",
        "hr",
      ],
      [
        "Technical screen",
        "Coding or problem-solving conversation.",
        "oa",
      ],
      [
        "Team interviews",
        "Several interviews with the team: coding, system design and a deep discussion of your past work.",
        "design",
      ],
      [
        "Culture conversations",
        "Discussion based on the company's published culture values.",
        "hr",
      ],
      ["Offer", "Offer discussion.", "offer"],
    ],
  ],
];

