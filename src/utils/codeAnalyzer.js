const PYL = ["Python", "Python3"];
const FNL = ["Ruby", "Elixir", "Erlang", "Racket"];

const mt = (c, i, o, x) => {
  let d = 0;
  for (let j = i; j < c.length; j++) {
    if (c[j] === o) d++;
    else if (c[j] === x && --d === 0) return j;
  }
  return c.length;
};

export const formatTimeComplexity = (a, b, exp) =>
  exp
    ? "O(2^n)"
    : a === 0
      ? b
        ? "O(log n)"
        : "O(1)"
      : `O(${a === 1 ? "n" : `n^${a}`}${b ? " log n" : ""})`;

export const formatSpaceComplexity = (s) =>
  s === 0 ? "O(1)" : s === 0.5 ? "O(log n)" : s === 1 ? "O(n)" : "O(n^2)";

export function analyzeCode(src, lang = "Python3") {
  const cm =
    PYL.includes(lang) || lang === "Ruby" || lang === "Elixir"
      ? /#.*/g
      : /\/\*[\s\S]*?\*\/|\/\/.*/g;
  const c = src
    .replace(/"(?:\\.|[^"\\\n])*"|'(?:\\.|[^'\\\n])*'|`(?:\\.|[^`\\])*`/g, " ")
    .replace(cm, " ");
  const CST =
    /\bin\s*[[()]|range\(\s*\d+\s*\)|\b(?:dirs?|directions|DIRS|moves)\b|<=?\s*\d+\s*;/;
  const py = PYL.includes(lang);
  const nodes = [];
  const notes = [];
  const add = (s, e, k, wh) => nodes.push({ s, e, k, wh });
  const HV = /\/\/\s*2|\/=\s*2|>>=?\s*1|\*=\s*2|<<=\s*1|\bmid\b|\/\s*2\b/;

  if (py) {
    const L = c.split("\n");
    const off = [];
    let o = 0;
    L.forEach((l) => {
      off.push(o);
      o += l.length + 1;
    });
    const ind = (l) => l.match(/^\s*/)[0].length;
    L.forEach((l, i) => {
      const m = l.match(/^\s*(for|while)\b/);
      if (m) {
        let j = i + 1;
        while (j < L.length && (!L[j].trim() || ind(L[j]) > ind(l))) j++;
        add(
          off[i],
          j < L.length ? off[j] : c.length,
          m[1] === "while" && HV.test(L.slice(i, j).join("\n")) ? "l" : "n",
          m[1] === "while",
        );
        if (m[1] === "for" && CST.test(l)) nodes[nodes.length - 1].am = true;
      } else {
        const r = /\sfor\s.+?\sin\s/g;
        let q;
        while ((q = r.exec(l))) add(off[i] + q.index, off[i] + l.length, "n");
      }
    });
  } else if (FNL.includes(lang)) {
    notes.push(`Low confidence for ${lang}`);
    const r =
      lang === "Ruby"
        ? /\.(each|map|times|select|reduce|each_with_index)\b|\b(while|until|for)\b/g
        : /Enum\.\w+|lists:\w+|List\.\w+|\(\s*(?:for\/?\w*|map|foldl|foldr|filter|for-each|build-list)\b|\bfor\s/g;
    let m;
    while ((m = r.exec(c))) {
      const i = c.indexOf("(", m.index);
      const nl = c.indexOf("\n", m.index);
      const e =
        i > -1 && (nl < 0 || i < nl)
          ? mt(c, i, "(", ")")
          : nl < 0
            ? c.length
            : nl;
      add(m.index, e, "n");
    }
  } else {
    const r =
      /\b(for|while|foreach)\b|\.(map|forEach|filter|reduce|flatMap|some|every|each|times)\s*\(/g;
    let m;
    while ((m = r.exec(c))) {
      if (m[2]) {
        const i = m.index + m[0].length - 1;
        add(i, mt(c, i, "(", ")"), "n");
        continue;
      }
      let i = m.index + m[1].length;
      while (/\s/.test(c[i] || "x")) i++;
      let hdr;
      let b;
      if (c[i] === "(") {
        const j = mt(c, i, "(", ")");
        hdr = c.slice(i, j + 1);
        b = j + 1;
      } else {
        b = c.indexOf("{", i);
        if (b < 0) continue;
        hdr = c.slice(i, b);
      }
      let k = b;
      while (/\s/.test(c[k] || "x")) k++;
      let e;
      if (c[k] === "{") e = mt(c, k, "{", "}");
      else {
        if (c[k] === ";" && m[1] === "while") continue;
        e = se(k);
      }
      const lg =
        m[1] === "while"
          ? HV.test(hdr + c.slice(b, e))
          : /[*/]=|<<=|>>=/.test(hdr);
      add(m.index, e, lg ? "l" : "n", m[1] === "while");
      if (m[1] !== "while" && CST.test(hdr)) nodes[nodes.length - 1].am = true;
    }
  }

  function se(k) {
    while (/\s/.test(c[k] || "x")) k++;
    const m = /^(for|while|foreach|if)\b/.exec(c.slice(k, k + 8));
    if (m) {
      let i = k + m[0].length;
      while (/\s/.test(c[i] || "x")) i++;
      if (c[i] === "(") i = mt(c, i, "(", ")") + 1;
      while (/\s/.test(c[i] || "x")) i++;
      return c[i] === "{" ? mt(c, i, "{", "}") : se(i);
    }
    if (c[k] === "{") return mt(c, k, "{", "}");
    const e = c.indexOf(";", k);
    return e < 0 ? c.length : e;
  }

  const px = (re, k) => {
    const r = new RegExp(re.source, "g");
    let m;
    while ((m = r.exec(c))) add(m.index, m.index, k);
  };

  px(
    /\.(?:indexOf|lastIndexOf|includes|IndexOf|index|count|substring|substr|slice)\s*\(|\bstd::find\s*\(|\bfind\s*\(\s*\w+(?:\.|->)begin/,
    "n",
  );

  let m2;
  const r2 = /(\w+)\.(?:contains|Contains)\s*\(/g;
  while ((m2 = r2.exec(c))) {
    if (
      new RegExp(
        `(List|ArrayList|LinkedList|Vector)[ ]*<[^>]*>[ ]+${m2[1]}([^A-Za-z0-9_]|$)|String[ ]+${m2[1]}([^A-Za-z0-9_]|$)`,
      ).test(c)
    ) {
      add(m2.index, m2.index, "n");
    }
  }

  px(
    /\bsort(?:ed)?\s*\(|\.sort\b|\bstd::sort|\.Sort\(|\bsortBy\b|\.sorted\b/,
    "nl",
  );
  px(
    /\bbisect\w*|\bbinary_search|\blower_bound|\bupper_bound|\.binarySearch|\bsort\.Search/,
    "l",
  );
  if (
    /\bheapq\b|\bPriorityQueue\b|\bpriority_queue\b|\bTreeMap\b|\bTreeSet\b|\bBTreeMap\b|\bBTreeSet\b|\b(?:set|map)\s*<|\bSortedList\b|\bSortedSet\b/.test(
      c,
    )
  ) {
    px(
      /\bheap(?:push|pop|pushpop)\b|\.(?:poll|offer|put|insert|erase|emplace|pollFirst|floorKey|ceilingKey)\s*\(|\.(?:push|pop|add)\s*\(/,
      "l",
    );
  }

  const cost = (x) =>
    x.am ? [0, 0] : x.k === "n" ? [1, 0] : x.k === "l" ? [0, 1] : [1, 1];

  nodes.forEach((w) => {
    if (!w.wh) return;
    const p = nodes.find(
      (x) =>
        x !== w &&
        x.s <= w.s &&
        x.e >= w.e &&
        x.e - x.s > w.e - w.s &&
        x.k !== "nl",
    );
    if (!p) return;
    const t = c.slice(w.s, w.e);
    const mv = t.match(
      /(\w+)\s*(?:\+=|-=)\s*1\b|(\w+)\+\+|\+\+(\w+)|(\w+)--|--(\w+)/,
    );
    const v = mv && (mv[1] || mv[2] || mv[3] || mv[4] || mv[5]);
    const reset =
      v &&
      new RegExp(`(^|[^A-Za-z0-9_])${v}[ ]*=[^=]`).test(c.slice(p.s, w.s));
    if (
      /\.pop\w*\(|\.shift\(|pop_back|pop_front|\.poll\(/.test(t) ||
      (v && !reset)
    ) {
      w.am = true;
    }
  });

  let best = [0, 0];
  nodes.forEach((n) => {
    const q0 = cost(n);
    let a = q0[0];
    let b = q0[1];
    nodes.forEach((x) => {
      if (x !== n && x.s <= n.s && x.e >= n.e && x.e - x.s > n.e - n.s) {
        const q = cost(x);
        a += q[0];
        b += q[1];
      }
    });
    if (a > best[0] || (a === best[0] && b > best[1])) best = [a, b];
  });

  let rt0 = null;
  let rs = 0;
  let exp = false;
  const defs = [];
  const kw = /^(if|for|while|switch|catch|return|else|sizeof|new|do|function)$/;
  [
    /\bdef\s+(\w+)/g,
    /\bfunction\s+(\w+)/g,
    /\b(?:fn|func|fun)\s+(\w+)/g,
    /\b(?:const|let|var|val)\s+(\w+)\s*[:=][^=;\n]*=>/g,
    /(\w+)\s*\([^()]*\)\s*(?:const\s*)?(?:->\s*\w+\s*)?\{/g,
  ].forEach((r) => {
    let m;
    while ((m = r.exec(c))) if (!kw.test(m[1])) defs.push([m[1], m.index]);
  });

  const Ls = c.split("\n");
  const indn = (l) => l.match(/^\s*/)[0].length;
  const bodyOf = (idx) => {
    if (py) {
      const L = c.slice(0, idx).split("\n").length - 1;
      let j = L + 1;
      while (j < Ls.length && (!Ls[j].trim() || indn(Ls[j]) > indn(Ls[L]))) j++;
      return Ls.slice(L + 1, j).join("\n");
    }
    if (FNL.includes(lang)) return c.slice(idx + 1);
    const ai = c.slice(idx, idx + 160).indexOf("=>");
    if (ai > -1 && /^\s*[^{\s]/.test(c.slice(idx + ai + 2, idx + ai + 10))) {
      const nl = c.indexOf("\n", idx);
      return c.slice(idx, nl < 0 ? c.length : nl);
    }
    const b = c.indexOf("{", idx);
    return b < 0 ? "" : c.slice(b, mt(c, b, "{", "}"));
  };

  const R = defs
    .map(([nm, ix]) => {
      const bd = bodyOf(ix);
      return {
        nm,
        bd,
        n: (
          bd.match(new RegExp(`(^|[^A-Za-z0-9_])${nm}[ ]*[(]`, "g")) || []
        ).length,
      };
    })
    .filter((x) => x.n > 0)
    .sort((p, q) => q.n - p.n)[0];

  if (R) {
    const rc = (
      R.bd.match(new RegExp(`return[ ]+${R.nm}[ ]*[(]`, "g")) || []
    ).length;
    const nc = rc >= R.n ? 1 : R.n;
    const bd = R.bd;
    const hv = HV.test(bd);
    const lp = /\b(for|while|foreach)\b|\.forEach\s*\(|\.map\s*\(/.test(bd);
    const cl = new RegExp(`(for|while|foreach)[^]*${R.nm}[ ]*[(]`).test(bd);
    const memo = /memo|cache|lru_cache|@cache|\bdp\b|visited|seen|\bvis\b/.test(
      c,
    );
    if (nc >= 2 && hv) {
      rt0 = [1, lp ? 1 : 0];
      rs = 1;
    } else if (nc === 1 && hv && !lp) {
      rt0 = [0, 1];
      rs = 0.5;
    } else if (memo) {
      rt0 = cl && !/visited|seen|\bvis\b/.test(c) ? [2, 0] : [1, 0];
      rs = 1;
    } else if (nc >= 2 || cl) {
      exp = true;
      rs = 1;
    } else {
      rt0 = [1, 0];
      rs = 1;
    }
    notes.push(
      `Recursion in ${R.nm}${exp ? " branches without memoization" : memo ? " with a memo/visited table" : ""}`,
    );
  }

  let sp = 0;
  const G =
    /\.(?:append|push|push_back|add|set|put|insert|extend|offer|emplace|emplace_back|enqueue|Add)\s*\(|\+=\s*\[|<<\s*\w/;
  if (
    /new\s+[\w<>, ]*\[\s*\w+|vector\s*<[^;]*?>\s*\w*\s*\(\s*\w+|\[\s*[\w.]+\s*\]\s*\*\s*[\w(]|\bArray\s*\(\s*\w+|\bmake\s*\(\s*\[\]|\.fill\(|bytearray\(|\[[^\n]*\bfor\b[^\n]*\bin\b[^\n]*\]|\bsorted\s*\(|\.slice\(|\.copy\(|\[\s*:\s*\]|\.\.\.\w+|\.map\s*\(|\.filter\s*\(|\.concat\(|\.stream\(\)/.test(
      c,
    )
  ) {
    sp = 1;
  }
  const dict =
    /\{\s*\}|dict\(\)|defaultdict|Counter\(|new\s+(?:Hash|Tree)?Map|unordered_map|\bmap\s*</.test(
      c,
    );
  if (
    nodes.some(
      (n) =>
        n.s < n.e &&
        (G.test(c.slice(n.s, n.e)) ||
          (dict && /\w+\[[^\]\n]+\]\s*[-+]?=(?!=)/.test(c.slice(n.s, n.e)))),
    )
  ) {
    sp = Math.max(sp, 1);
  }
  if (
    sp >= 1 &&
    /\[\[|\bvector\s*<\s*vector|new\s+[\w<>, ]*\[[^\]]+\]\s*\[[^\]]+\]|\[[^\]\n]*\bfor\b[^\]\n]*\bfor\b/.test(
      c,
    )
  ) {
    sp = 2;
  }
  sp = Math.max(sp, rs);
  const T = exp
    ? null
    : rt0 && (rt0[0] > best[0] || (rt0[0] === best[0] && rt0[1] > best[1]))
      ? rt0
      : best;
  let ld = 0;
  nodes.forEach((n) => {
    if (n.s >= n.e || n.am) return;
    let a = 1;
    nodes.forEach((x) => {
      if (
        x !== n &&
        x.s < n.e &&
        x.s <= n.s &&
        x.e >= n.e &&
        x.e - x.s > n.e - n.s &&
        x.s < x.e &&
        !x.am
      )
        a++;
    });
    ld = Math.max(ld, a);
  });
  notes.unshift(`Deepest loop nesting: ${ld}`);
  if (nodes.some((n) => n.k === "nl")) notes.push("Sorting detected");

  return {
    time: T || [0, 0],
    exp,
    space: sp,
    notes,
    ok:
      /\breturn\b|print|console\.log|cout|System\.out|puts|fmt\.Print|echo|yield|=>/.test(
        c,
      ) && src.trim().length >= 25,
  };
}
