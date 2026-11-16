// Run: node ep5/selftest.mjs
import assert from 'node:assert/strict';
import * as S from './sim.js';
import { validate } from '../challenge.js';
import { TOOL, CALLS } from './scenarios.js';

// HyperLogLog: 12 KB like Redis, and within ~3 standard errors (3 × 0.81%) of the exact count
assert.equal(S.HLL_BYTES, 12288);
for (const [total, unique] of [[10, 3], [1000, 1000], [50000, 20000], [300000, 100000], [1000000, 805100]]) {
  const r = S.views({ total, unique });
  assert.equal(r.exact, unique, `${unique}: exact set`);
  assert.ok(Math.abs(r.err) < 0.025, `${unique}: HLL error ${(r.err * 100).toFixed(2)}%`);
}
const again = S.views({ total: 5, unique: 1 });
assert.equal(again.total, 5); assert.equal(Math.round(again.est), 1, 'reopening the same post: unique stays 1');

// Batching: his demo (1M likes, 50K per batch)
assert.deepEqual(S.batching({ events: 1e6, batch: 50000 }), { batches: 20, lua: 200, cuckoo: 500 });
assert.deepEqual(S.batching({ events: 7, batch: 1 }), { batches: 7, lua: 7, cuckoo: 7 }, 'no queue: one of each per like');
assert.deepEqual(S.batching({ events: 12000, batch: 5000 }), { batches: 3, lua: 3, cuckoo: 7 }, 'remainder batch');

// Like / unlike: the diagram's sequence
const st = S.freshLikes();
[['like', 'U1'], ['like', 'U1'], ['unlike', 'U1'], ['unlike', 'U1'], ['unlike', 'U1']].forEach(([type, user]) => S.apply(st, { type, user }));
assert.equal(st.rows.size, 0); assert.equal(st.guarded, 0); assert.equal(st.naive, -1, 'naive counter goes negative');
assert.deepEqual(st.log.map(l => l.changed), [1, 0, -1, 0, 0]);
const two = S.freshLikes(); S.apply(two, { type: 'like', user: 'U1' }); S.apply(two, { type: 'like', user: 'U2' });
assert.equal(two.guarded, 2, 'different users both count');

// Challenges
assert.deepEqual(validate(TOOL), []);
assert.deepEqual(validate(CALLS), []);
console.log(`ep5 selftest: all assertions passed (HLL ±2.5%, batching, guard, ${TOOL.length + CALLS.length} challenges)`);
