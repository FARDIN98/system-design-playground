// Network lab: a rough model of EP-3's k6 runs (3000 VUs for 1m50s, Nginx round robin, Fastify on PM2).
// shortcut: calibrated to the three runs in the video, not a real network model; replace it if you need real capacity planning.
export const SECS = 110;

// Runs measured in the video (requests in 1m50s).
export const RUNS = [
  { id: 'one', label: '1 Mac alone', cfg: { servers: 1, link: 'wifi', split: false }, requests: 1244513 },
  { id: 'wifi', label: '2 Macs over 2.4 GHz Wi-Fi', cfg: { servers: 2, link: 'wifi', split: false }, requests: 62368 },
  { id: 'lan', label: '2 Macs over 1 Gbps LAN', cfg: { servers: 2, link: 'lan', split: false }, requests: 1016029 },
];

export const REPLY = 3.5e9 / 1016029; // ≈ 3.4 KB per reply (3.5 GB received on the LAN run; 214 MB / 62,368 on Wi-Fi agrees)
const CPU = 1244513 / SECS; // one Mac running k6 + Nginx + app + MongoDB: ≈ 11,314 req/s
const SHARED = 1016029 / SECS; // Server A also proxying to the others: its CPU passed 95% in the video
// Replies per second a link can carry to the remote servers. Wi-Fi is one shared channel (calibrated: round robin
// gave every server the same count, so 62,368 = 2 × the Wi-Fi path); cables give each server its own link.
export const LINKS = {
  wifi: { label: '2.4 GHz Wi-Fi', shared: true, perSec: 62368 / SECS / 2 },
  lan: { label: '1 Gbps LAN', shared: false, perSec: 125e6 / REPLY },
  fibre: { label: '10 Gbps fibre', shared: false, perSec: 1.25e9 / REPLY },
};

// cfg: { servers (1|2|4), link ('wifi'|'lan'|'fibre'), split (k6, Nginx and DB on their own machines) }
export function run({ servers, link, split }) {
  const remote = servers - 1, L = LINKS[link];
  const path = remote ? (L.shared ? L.perSec / remote : L.perSec) : Infinity;
  const rr = servers * Math.min(CPU, path); // round robin: every server gets the same share, so the slowest path sets the pace
  const ceiling = split ? Infinity : remote ? SHARED : CPU;
  const perSec = Math.min(rr, ceiling);
  const limit = !remote ? 'one' : path < CPU && rr <= ceiling ? 'link' : rr > ceiling ? 'shared' : 'cpu';
  const measured = RUNS.find(r => sameCfg(r.cfg, { servers, link, split }));
  return { perSec, requests: Math.round(perSec * SECS), bytes: perSec * SECS * REPLY, limit, path, measured: !!measured };
}

export const sameCfg = (a, b) => a.servers === b.servers && a.split === b.split && (a.servers === 1 || a.link === b.link);
