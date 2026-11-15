import assert from 'node:assert/strict';
import * as S from './sim.js';
import { validate } from '../challenge.js';
import { SCENARIOS } from './scenarios.js';

const L = 100000; // 1 lakh users
const [v4, , , v32] = S.VERTICAL_SIZES;

// Vertical: small box overloads, big box copes, a crash stops everything.
assert.equal(S.vertical(L, v4, false).state, 'overloaded');
assert.ok(S.vertical(L, v4, false).failed > 0);
assert.equal(S.vertical(L, v32, false).failed, 0);
assert.equal(S.vertical(L, v32, true).served, 0, 'single point of failure');

// Horizontal: 4 × 8-core servers serve 1 lakh; losing one still serves everyone; losing all serves no one.
const four = [false, false, false, false];
assert.equal(S.horizontal(L, four).failed, 0);
const oneDown = S.horizontal(L, [false, true, false, false]);
assert.equal(oneDown.alive, 3);
assert.equal(oneDown.failed, 0, 'no single point of failure');
assert.equal(S.horizontal(L, [true, true, true, true]).served, 0);
assert.equal(S.horizontal(L, four).served + S.horizontal(L, four).failed, L);

// CAP, connected: both nodes agree.
let c = S.createCap(500, 'CP');
assert.ok(S.pay(c, 'delhi', 100).ok);
assert.equal(S.read(c, 'mumbai').balance, 400);
assert.equal(S.read(c, 'delhi').balance, 400);
assert.equal(S.pay(c, 'mumbai', 1000).reason, 'insufficient');

// CP during a split: Delhi refuses, Mumbai (primary) works, heal syncs.
S.cut(c);
assert.equal(S.setMode(c, 'AP'), false, 'no mode switch during a split');
assert.equal(S.pay(c, 'delhi', 100).reason, 'refused');
assert.equal(S.read(c, 'delhi').reason, 'refused');
assert.ok(S.pay(c, 'mumbai', 100).ok);
assert.equal(S.read(c, 'mumbai').stale, false);
assert.deepEqual(S.heal(c), { balance: 300, overspent: false });
assert.equal(S.read(c, 'delhi').balance, 300);

// AP during a split: both answer, Delhi is stale, and both sides can spend the same money.
c = S.createCap(100, 'AP');
S.cut(c);
assert.ok(S.pay(c, 'mumbai', 100).ok);
assert.deepEqual(S.read(c, 'delhi'), { ok: true, balance: 100, stale: true });
assert.ok(S.pay(c, 'delhi', 100).ok);
assert.deepEqual(S.heal(c), { balance: -100, overspent: true });
assert.equal(S.read(c, 'mumbai').balance, S.read(c, 'delhi').balance);


// Challenges: every answer is one of its options, every item explains why.
assert.deepEqual(validate(SCENARIOS), []);
assert.ok(SCENARIOS.length >= 10);

console.log('selftest: all assertions passed');
