// Shared logic for the revision and interview pages. Pure functions, no DOM; selftest.mjs checks them.

// ---------- storage (per device; never throws) ----------
export function load(key, fallback) {
  try { const v = JSON.parse(localStorage.getItem(key)); return v ?? fallback; } catch { return fallback; }
}
export function save(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); return true; } catch { return false; }
}

// ---------- flashcards (Leitner boxes 0..4) ----------
export const MAX_BOX = 4;
export function nextBox(box = 0, grade) {
  if (grade === 'again') return 0;
  return Math.min(MAX_BOX, box + (grade === 'easy' ? 2 : 1));
}
// stable id from the question text, so reordering cards keeps progress
export function cardId(deck, q) {
  let h = 0x811c9dc5;
  for (const ch of q) { h ^= ch.codePointAt(0); h = Math.imul(h, 0x01000193) >>> 0; }
  return `${deck}:${h.toString(36)}`;
}
// order: missed cards (box 0, seen before) → never-seen cards → box 1, 2, …; oldest first inside a group
export function buildQueue(cards, state = {}) {
  const st = c => state[c.id] || { box: 0, seen: 0 };
  const rank = c => (st(c).box === 0 && st(c).seen > 0 ? -1 : st(c).box);
  return [...cards].sort((a, b) => rank(a) - rank(b) || st(a).seen - st(b).seen);
}
export const known = (cards, state = {}) => cards.filter(c => (state[c.id]?.box || 0) > 0).length;

// ---------- puzzle ----------
export function wrongPositions(order, correct) {
  return order.map((s, i) => (s === correct[i] ? -1 : i)).filter(i => i >= 0);
}
export function shuffled(arr, rnd = Math.random) {
  if (arr.length < 2) return [...arr];
  let out;
  do {
    out = [...arr];
    for (let i = out.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [out[i], out[j]] = [out[j], out[i]]; }
  } while (out.every((s, i) => s === arr[i]));
  return out;
}

// ---------- reel ----------
export const MAX_REEL = 360; // seconds
export function reelLength(clips) { return clips.reduce((s, c) => s + (c.end - c.start), 0); }
export function clipsOk(clips) {
  return clips.every((c, i) => c.end > c.start && (i === 0 || c.start >= clips[i - 1].end)) && reelLength(clips) <= MAX_REEL;
}

// ---------- estimates ----------
// Back-of-envelope method (general): daily traffic → average RPS → peak RPS → servers.
export function estimate({ users, perUser, peak, perServer }) {
  const avg = (users * perUser) / 86400;
  const peakRps = avg * peak;
  const servers = Math.max(1, Math.ceil(peakRps / perServer));
  return { avg, peakRps, servers, withSpare: servers + 1 };
}
// Standard Bloom filter sizing: m = −n·ln p / (ln 2)², k = (m/n)·ln 2.
export function bloomSize(n, p) {
  const bits = Math.ceil((-n * Math.log(p)) / (Math.LN2 * Math.LN2));
  return { bits, bytes: bits / 8, k: Math.max(1, Math.round((bits / n) * Math.LN2)), bitsPerItem: bits / n };
}
// tiny slack so an answer exactly on the ±25% edge isn't rejected by float rounding (4 × 4.8 = 19.200000000000003)
export const within = (answer, guess, tol = 0.25) => Number.isFinite(guess) && Math.abs(guess - answer) <= Math.abs(answer) * tol + 1e-9;

export function fmtBytes(b) {
  if (b >= 1e9) return `${+(b / 1e9).toFixed(b >= 1e10 ? 0 : 1)} GB`;
  if (b >= 1e6) return `${+(b / 1e6).toFixed(b >= 1e7 ? 0 : 1)} MB`;
  return `${Math.round(b / 1e3)} KB`;
}
export const fmtNum = n => Math.round(n).toLocaleString('en-IN');

// Indian-style labels for the drills ("1 lakh", "300 crore").
const LAKH = 1e5, CRORE = 1e7;
export function indian(n) {
  if (n >= CRORE) return `${+(n / CRORE).toFixed(1)} crore`;
  if (n >= LAKH) return `${+(n / LAKH).toFixed(1)} lakh`;
  return n.toLocaleString('en-IN');
}

// ---------- estimation drills ----------
const pick = (arr, rnd) => arr[Math.floor(rnd() * arr.length)];
// Each kind returns { kind, q, unit, answer, working }. `answer` is in `unit`.
export const DRILLS = {
  rps(rnd) {
    const users = pick([1e5, 10e5, 1e7, 5e7], rnd), perUser = pick([5, 10, 20, 50], rnd), peak = 3;
    const r = estimate({ users, perUser, peak, perServer: 1 });
    return { kind: 'rps', q: `${indian(users)} daily users, ${perUser} requests each per day. Peak traffic is ${peak}× the average. What is the <b>peak requests per second</b>?`,
      unit: 'req/s', answer: r.peakRps,
      working: `${indian(users)} × ${perUser} = ${fmtNum(users * perUser)} requests/day ÷ 86,400 s ≈ ${fmtNum(r.avg)} req/s average × ${peak} ≈ <b>${fmtNum(r.peakRps)} req/s</b> at peak.` };
  },
  servers(rnd) {
    const peakRps = pick([3000, 10000, 27784, 68175], rnd), perServer = pick([500, 2000, 5000], rnd);
    const servers = Math.ceil(peakRps / perServer);
    return { kind: 'servers', q: `Peak is <b>${fmtNum(peakRps)} req/s</b>. A load test says one server handles ${fmtNum(perServer)} req/s. <b>How many servers</b> (before adding a spare)?`,
      unit: 'servers', answer: servers,
      working: `${fmtNum(peakRps)} ÷ ${fmtNum(perServer)} = ${(peakRps / perServer).toFixed(1)} → round up to <b>${servers}</b>. Add 1 spare so one crash doesn't hurt (general).` };
  },
  storage(rnd) {
    const records = pick([1e7, 1e8, 1e9, 3e9], rnd);
    const [what, per] = pick([['Mongo data', 47], ['Mongo username index', 30], ['Elasticsearch (1 copy)', 37]], rnd);
    const gb = (records * per) / 1e9;
    return { kind: 'storage', q: `${indian(records)} records. ${what} takes about <b>${per} bytes per record</b> (EP-4's table). How many <b>GB</b>?`,
      unit: 'GB', answer: gb,
      working: `${fmtNum(records)} × ${per} B = ${fmtNum(records * per)} B ≈ <b>${+gb.toFixed(1)} GB</b>.` };
  },
  bloom(rnd) {
    const n = pick([3023103, 1e7, 1e9, 3e9], rnd), p = pick([0.01, 0.001, 0.0001], rnd);
    const s = bloomSize(n, p), unit = s.bytes >= 1e9 ? 'GB' : 'MB';
    return { kind: 'bloom', q: `A Bloom filter for <b>${indian(n)}</b> items at a <b>${+(p * 100).toFixed(2)}%</b> false-positive rate. How many <b>${unit}</b> of RAM? (≈ 1.44 × log₂(1/p) bits per item)`,
      unit, answer: s.bytes / (unit === 'GB' ? 1e9 : 1e6),
      working: `bits per item = 1.44 × log₂(1/${p}) ≈ ${s.bitsPerItem.toFixed(1)}. × ${fmtNum(n)} = ${fmtNum(s.bits)} bits ÷ 8 ≈ <b>${fmtBytes(s.bytes)}</b>, with k ≈ ${s.k} hash functions.` };
  },
  copies(rnd) {
    const workers = pick([2, 4, 8], rnd), gb = pick([2.4, 4.8, 7.2], rnd);
    return { kind: 'copies', q: `Each worker keeps its own <b>${gb} GB</b> Bloom filter. The machine runs <b>${workers} workers</b>. Total filter RAM in <b>GB</b>?`,
      unit: 'GB', answer: workers * gb,
      working: `${workers} × ${gb} GB = <b>${+(workers * gb).toFixed(1)} GB</b>. That's why EP-4's Cuckoo used one shared mmap file instead of a copy per worker.` };
  },
};
export const DRILLS_BY_EP = { ep1: ['rps', 'servers'], ep4: ['storage', 'bloom', 'copies'] };

// ---------- follow-ups ----------
export const WEAK = 0.6;
// weak answers first, then never-tried, then the rest (oldest first)
export function followQueue(items, state = {}) {
  const rank = it => { const s = state[it.id]; return !s ? 1 : s.score < WEAK ? 0 : 2; };
  return [...items].sort((a, b) => rank(a) - rank(b) || (state[a.id]?.at || 0) - (state[b.id]?.at || 0));
}

// ---------- draw-then-compare ----------
// attempts: [{ticked:[ids]}]; returns checklist ids missed in at least half the attempts
export function oftenMissed(checklist, attempts) {
  if (!attempts.length) return [];
  return checklist.map(c => c.id).filter(id => attempts.filter(a => !a.ticked.includes(id)).length * 2 >= attempts.length);
}
