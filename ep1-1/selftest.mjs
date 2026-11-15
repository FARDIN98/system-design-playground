// Run: node ep1-1/selftest.mjs
import assert from 'node:assert/strict';
import * as S from './sim.js';
import { validate } from '../challenge.js';
import { GUARD, PLACE } from './scenarios.js';

// The model reproduces every run from the video (within 1%).
for (const v of S.RUNS) {
  const r = S.run(v.cfg);
  assert.ok(Math.abs(r.requests - v.requests) <= v.requests * 0.01, `${v.id}: ${r.requests} vs ${v.requests}`);
}
const base = S.RUNS.find(r => r.id === 'v2000').cfg;
assert.equal(S.run(base).limit, 'test', 'sleep(1): the script is the bottleneck');
assert.equal(S.run({ ...base, workers: 1 }).requests, S.run(base).requests, 'more cores change nothing while the test sleeps');
assert.equal(S.run({ ...base, sleep: false, workers: 1 }).limit, 'core');
assert.equal(S.run({ ...base, sleep: false }).limit, 'cpu');
const ng = { ...base, sleep: false, nginx: true, conns: 512, gzip: true };
assert.equal(S.run(ng).limit, 'conns', '512 connections < 2000 VUs');
assert.ok(Math.abs(S.run(ng).blocked - 0.744) < 0.001);
assert.equal(S.run({ ...ng, vus: 500 }).blocked, 0, '500 VUs fit in 512');
assert.equal(S.run({ ...ng, conns: 8192 }).limit, 'gzip');
assert.ok(Math.abs(S.run({ ...ng, conns: 8192 }).bytes / 1e6 - 152) < 0.5, '152 MB through gzip');
assert.ok(S.run({ ...ng, conns: 8192, gzip: false }).bytes > S.run({ ...ng, conns: 8192 }).bytes * 2, 'gzip sends far fewer bytes');
assert.ok(S.sameCfg(base, { ...base, conns: 8192 }), 'Nginx settings ignored when Nginx is off');
assert.ok(!S.sameCfg(base, { ...base, vus: 500 }));

// Challenges
assert.deepEqual(validate(GUARD), []);
assert.deepEqual(validate(PLACE), []);
console.log(`ep1-1 selftest: all assertions passed (${S.RUNS.length} video runs, ${GUARD.length + PLACE.length} challenges)`);
