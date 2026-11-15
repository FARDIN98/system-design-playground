// Load lab: a rough model of EP-1.1's k6 runs (15 s each, on his laptop).
// shortcut: calibrated to the six runs in the video, not a real queueing model; replace it if you need real capacity planning.
export const SECS = 15;

// Runs measured in the video (requests in 15 s).
export const RUNS = [
  { id: 'v50', label: '50 VUs + sleep(1)', cfg: { vus: 50, sleep: true, workers: 1, nginx: false, conns: 512, gzip: false }, requests: 750 },
  { id: 'v500', label: '500 VUs + sleep(1)', cfg: { vus: 500, sleep: true, workers: 1, nginx: false, conns: 512, gzip: false }, requests: 7500 },
  { id: 'v2000', label: '2000 VUs + sleep(1)', cfg: { vus: 2000, sleep: true, workers: 4, nginx: false, conns: 512, gzip: false }, requests: 29959 },
  { id: 'one', label: '1 core, no sleep', cfg: { vus: 2000, sleep: false, workers: 1, nginx: false, conns: 512, gzip: false }, requests: 126270 },
  { id: 'pm2', label: 'PM2 × 4, no sleep', cfg: { vus: 2000, sleep: false, workers: 4, nginx: false, conns: 512, gzip: false }, requests: 157000 },
  { id: 'nginx', label: 'Nginx (8192) + gzip', cfg: { vus: 2000, sleep: false, workers: 4, nginx: true, conns: 8192, gzip: true }, requests: 133702 },
];

const CPU = { 1: 126270, 4: 157000 }; // not 4× more: k6 and the app shared one laptop
const GZIP_COST = 133702 / 157000; // gzip's CPU cost, from the Nginx run
export const B_GZIP = 152e6 / 133702; // ≈ 1.1 KB received per gzipped reply (152 MB in the video)
export const B_RAW = B_GZIP / 0.3; // shortcut: assumes gzip's "up to ~70%" cut; the raw size wasn't shown

// cfg: { vus, sleep, workers (1|4), nginx, conns (512|8192), gzip }
export function run(cfg) {
  const { vus, sleep, workers, nginx, conns, gzip } = cfg;
  const testCap = sleep ? vus * SECS : Infinity; // sleep(1) ⇒ about 1 request per VU per second
  const zip = nginx && gzip;
  const serverCap = Math.round(CPU[workers] * (zip ? GZIP_COST : 1));
  const blocked = nginx && vus > conns ? (vus - conns) / vus : 0; // VUs beyond the limit get "connection reset by peer"
  const requests = Math.round(Math.min(testCap, serverCap) * (1 - blocked));
  const limit = blocked ? 'conns' : testCap <= serverCap ? 'test' : zip ? 'gzip' : workers === 1 ? 'core' : 'cpu';
  return { requests, perSec: requests / SECS, blocked, bytes: requests * (zip ? B_GZIP : B_RAW), limit, testCap, serverCap };
}

export const sameCfg = (a, b) => Object.keys(a).every(k => a[k] === b[k] || (k === 'conns' && !a.nginx && !b.nginx) || (k === 'gzip' && !a.nginx && !b.nginx));
