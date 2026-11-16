// Run: node ep3/selftest.mjs
import assert from 'node:assert/strict';
import * as S from './sim.js';
import { validate } from '../challenge.js';
import { ALGO, UPOUT } from './scenarios.js';

// The model reproduces every run from the video (within 1%).
for (const v of S.RUNS) {
  const r = S.run(v.cfg);
  assert.ok(Math.abs(r.requests - v.requests) <= v.requests * 0.01, `${v.id}: ${r.requests} vs ${v.requests}`);
  assert.ok(r.measured, `${v.id} is marked as measured`);
}
const [one, wifi, lan] = S.RUNS.map(v => v.cfg);
assert.equal(S.run(one).limit, 'one');
assert.equal(S.run({ ...one, link: 'wifi' }).requests, S.run(one).requests, 'the link does not matter with one server');
assert.equal(S.run(wifi).limit, 'link', 'Wi-Fi: the network is the bottleneck');
assert.ok(Math.abs(S.run(wifi).bytes / 1e6 - 214) < 3, '~214 MB received over Wi-Fi');
assert.equal(S.run(lan).limit, 'shared', 'LAN: Server A’s CPU is the ceiling');
assert.ok(Math.abs(S.run(lan).bytes / 1e9 - 3.5) < 0.01, '3.5 GB received over the LAN');
assert.equal(S.run({ ...lan, split: true }).limit, 'cpu');
assert.ok(S.run({ ...lan, split: true }).requests > S.run(one).requests, 'separate machines beat one Mac');
assert.ok(!S.run({ ...lan, split: true }).measured, 'not in the video, so an estimate');
assert.ok(S.run({ ...wifi, servers: 4 }).requests < S.run(wifi).requests, 'more servers on shared Wi-Fi get slower');
assert.ok(S.run({ ...lan, servers: 4, split: true }).requests > S.run({ ...lan, split: true }).requests, 'more servers on cables scale');
assert.ok(Math.abs(S.REPLY - 3445) < 10, '~3.4 KB per reply');

// Challenges
assert.deepEqual(validate(ALGO), []);
assert.deepEqual(validate(UPOUT), []);
console.log(`ep3 selftest: all assertions passed (${S.RUNS.length} video runs, ${ALGO.length + UPOUT.length} challenges)`);
