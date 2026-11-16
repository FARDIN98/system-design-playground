// Run: node ep2/selftest.mjs
import assert from 'node:assert/strict';
import * as S from './sim.js';
import { validate } from '../challenge.js';
import { SCALE, CACHE } from './scenarios.js';

// The model reproduces every run from the video (within 1%), and total requests match k6 (rps × 110 s).
for (const v of S.RUNS) {
  const r = S.run(v.cfg);
  assert.ok(Math.abs(r.rps - v.rps) <= v.rps * 0.01, `${v.id}: ${r.rps} vs ${v.rps}`);
  assert.equal(r.measured, v, `${v.id} is recognised as a video run`);
}
const near = (a, b, tol) => Math.abs(a - b) <= b * tol;
assert.ok(near(S.run(S.RUNS.find(r => r.id === 'fas4').cfg).requests, 1651200, 0.01), 'Fastify × 4: 1,651,200 requests');
assert.ok(near(S.run(S.RUNS.find(r => r.id === 'go').cfg).requests, 1947579, 0.01), 'Go: 1,947,579 requests');
const cache = S.run(S.RUNS.find(r => r.id === 'cache').cfg);
assert.ok(near(cache.bytes / 1e9, 20, 0.15), `cache run ≈ 20 GB (${(cache.bytes / 1e9).toFixed(1)})`);
assert.ok(near(S.run(S.RUNS.find(r => r.id === 'fas1').cfg).avgMs, 214.71, 0.02), 'avg latency ≈ 1405 / rps');

const fas = { fw: 'fastify', cores: 1, cache: false, zip: false };
assert.equal(S.run(fas).limit, 'core');
assert.equal(S.run({ ...fas, cores: 4 }).limit, 'pm2');
assert.equal(S.run({ ...fas, cores: 10 }).limit, 'over');
assert.ok(S.run({ ...fas, cores: 10 }).rps < S.run({ ...fas, cores: 4 }).rps, '10 workers slower than 4');
assert.equal(S.run({ ...fas, fw: 'go', cores: 10 }).rps, 17704, 'Go ignores the PM2 setting');
assert.equal(S.run({ ...fas, zip: true }).limit, 'core', 'compression needs Nginx');
const z = S.run({ ...fas, cores: 4, cache: true, zip: true });
assert.equal(z.limit, 'zip');
assert.ok(z.rps > 50000 && z.rps < 53000, 'his 50–53k prediction');
assert.ok(z.bytes < cache.bytes / 5, 'compression cuts the bytes');
assert.equal(z.measured, undefined, 'compression was not run in the video');
assert.ok(S.sameCfg({ fw: 'go', cores: 1, cache: false, zip: false }, { fw: 'go', cores: 4, cache: false, zip: true }));

// Challenges
assert.deepEqual(validate(SCALE), []);
assert.deepEqual(validate(CACHE), []);
console.log(`ep2 selftest: all assertions passed (${S.RUNS.length} video runs, ${SCALE.length + CACHE.length} challenges)`);
