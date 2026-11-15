// Toy models for EP-1: vertical vs horizontal scaling, and CAP during a network split.
// Pure logic, no DOM: index.html draws it, selftest.mjs checks it.

// ---------- scaling ----------
// shortcut: a made-up capacity so the numbers are easy to follow; real capacity comes from load tests.
export const USERS_PER_CORE = 5000;
export const VERTICAL_SIZES = [
  { cores: 4, ram: 8 }, { cores: 8, ram: 16 }, { cores: 16, ram: 32 }, { cores: 32, ram: 128 },
];
export const H_SERVER = { cores: 8, ram: 32 };
export const MAX_SERVERS = 8;

export const capacity = cores => cores * USERS_PER_CORE;
const stateOf = load => (load > 1 ? 'overloaded' : load > 0.8 ? 'busy' : 'ok');

export function vertical(users, size, down) {
  if (down) return { served: 0, failed: users, load: 0, state: 'down' };
  const cap = capacity(size.cores);
  const served = Math.min(users, cap);
  return { served, failed: users - served, load: users / cap, state: stateOf(users / cap) };
}

// down: array of booleans, one per server
export function horizontal(users, down) {
  const alive = down.filter(d => !d).length;
  if (alive === 0) return { alive, served: 0, failed: users, load: 0, perServer: 0, state: 'down' };
  const cap = alive * capacity(H_SERVER.cores);
  const served = Math.min(users, cap);
  const load = users / cap;
  return { alive, served, failed: users - served, load, perServer: Math.round(users / alive), state: stateOf(load) };
}

// ---------- CAP ----------
// Two nodes hold a balance. Each keeps a log of payments; balance = start - payments it knows about.
// CP: Mumbai is the primary. During a split, Delhi refuses reads and payments (no stale answers).
// AP: both nodes keep answering during a split; on heal the logs merge (so both payments count).
export const NODES = ['mumbai', 'delhi'];

export function createCap(start = 500, mode = 'CP') {
  return { start, mode, linked: true, seq: 0, logs: { mumbai: [], delhi: [] } };
}

const sum = log => log.reduce((s, p) => s + p.amount, 0);
export const balance = (c, node) => c.start - sum(c.logs[node]);

export function trueBalance(c) {
  const all = new Map();
  NODES.forEach(n => c.logs[n].forEach(p => all.set(p.id, p)));
  return c.start - sum([...all.values()]);
}

const refusedInCP = (c, node) => !c.linked && c.mode === 'CP' && node !== 'mumbai';

export function pay(c, node, amount) {
  if (refusedInCP(c, node)) return { ok: false, reason: 'refused' };
  if (balance(c, node) < amount) return { ok: false, reason: 'insufficient', balance: balance(c, node) };
  const p = { id: ++c.seq, amount, at: node };
  if (c.linked) NODES.forEach(n => c.logs[n].push(p));
  else c.logs[node].push(p);
  return { ok: true, balance: balance(c, node) };
}

export function read(c, node) {
  if (refusedInCP(c, node)) return { ok: false, reason: 'refused' };
  const b = balance(c, node);
  return { ok: true, balance: b, stale: b !== trueBalance(c) };
}

export function cut(c) { c.linked = false; }

export function heal(c) {
  const all = new Map();
  NODES.forEach(n => c.logs[n].forEach(p => all.set(p.id, p)));
  const merged = [...all.values()].sort((a, b) => a.id - b.id);
  NODES.forEach(n => { c.logs[n] = [...merged]; });
  c.linked = true;
  const b = balance(c, 'mumbai');
  return { balance: b, overspent: b < 0 };
}

export function setMode(c, mode) {
  if (!c.linked) return false; // switch modes only while the nodes are connected
  c.mode = mode;
  return true;
}
