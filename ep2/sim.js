// Core lab: a rough model of EP-2's k6 runs (0 → 3000 users, 1 m 50 s each, on his 10-core MacBook).
// shortcut: calibrated to the eight runs in the video, not a real queueing model; replace it if you need real capacity planning.
export const SECS = 110;

// Runs measured in the video (requests per second).
export const RUNS = [
  { id: 'exp1', label: 'Express · 1 core', cfg: { fw: 'express', cores: 1, cache: false, zip: false }, rps: 5101, p95: 555 },
  { id: 'node1', label: 'Node (bare) · 1 core', cfg: { fw: 'node', cores: 1, cache: false, zip: false }, rps: 5225, p95: 511 },
  { id: 'fas1', label: 'Fastify · 1 core', cfg: { fw: 'fastify', cores: 1, cache: false, zip: false }, rps: 6545, p95: 433 },
  { id: 'fas10', label: 'Fastify · PM2 × 10', cfg: { fw: 'fastify', cores: 10, cache: false, zip: false }, rps: 9741, p95: 313 },
  { id: 'exp4', label: 'Express · PM2 × 4', cfg: { fw: 'express', cores: 4, cache: false, zip: false }, rps: 14401, p95: 201 },
  { id: 'fas4', label: 'Fastify · PM2 × 4', cfg: { fw: 'fastify', cores: 4, cache: false, zip: false }, rps: 15010, p95: 197 },
  { id: 'go', label: 'Go · 1 process', cfg: { fw: 'go', cores: 1, cache: false, zip: false }, rps: 17704, p95: 158 },
  { id: 'cache', label: 'Fastify × 4 + Nginx cache', cfg: { fw: 'fastify', cores: 4, cache: true, zip: false }, rps: 56631 },
];

const ONE = { node: 5225, express: 5101, fastify: 6545 }; // one Node process
const X4 = { express: 14401 / 5101, fastify: 15010 / 6545 }; // PM2 × 4, measured
X4.node = (X4.express + X4.fastify) / 2; // shortcut: Node × 4 wasn't run; average of the two
const X10 = 9741 / 6545; // PM2 × 10, measured on Fastify only; used for all three
export const CACHED = 56631; // Nginx answers from its cache, so the app behind it hardly matters
export const ZIP_COST = 51.5 / 56.631; // his prediction: 56k → ~50–53k req/s with compression
export const ZIP_RATIO = 2.5 / 20; // his prediction: 20 GB → 2–3 GB
// Bytes received per reply, from each run's k6 "data received" ÷ requests.
export const BYTES = { node: 2.0e9 / 574871, express: 2.2e9 / 561150, fastify: 2.3e9 / 719993, go: 6.3e9 / 1947579 };
const ACTIVE = 1405; // avg latency × req/s was ≈ 1405 in every run: the average number of users waiting (Little's law)

// cfg: { fw: 'node'|'express'|'fastify'|'go', cores: 1|4|10 (ignored for Go), cache, zip (only with cache) }
export function run(cfg) {
  const { fw, cores, cache } = cfg, zip = cache && cfg.zip;
  const app = fw === 'go' ? 17704 : ONE[fw] * (cores === 4 ? X4[fw] : cores === 10 ? X10 : 1);
  const rps = Math.round(cache ? CACHED * (zip ? ZIP_COST : 1) : app);
  const bytes = rps * SECS * BYTES[fw] * (zip ? ZIP_RATIO : 1);
  const limit = zip ? 'zip' : cache ? 'cache' : fw === 'go' ? 'go' : cores === 1 ? 'core' : cores === 4 ? 'pm2' : 'over';
  const measured = RUNS.find(r => sameCfg(r.cfg, cfg));
  return { rps, requests: rps * SECS, bytes, avgMs: (ACTIVE / rps) * 1000, limit, measured };
}

export const sameCfg = (a, b) => a.fw === b.fw && a.cache === b.cache && !!(a.cache && a.zip) === !!(b.cache && b.zip) && (a.fw === 'go' || a.cores === b.cores);
