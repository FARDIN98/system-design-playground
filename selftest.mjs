// Checks the shared logic and every episode's data. Run: node selftest.mjs
import assert from 'node:assert/strict';
import * as L from './lib.js';
import ep1 from './data/ep1.js';
import ep4 from './data/ep4.js';
import { CONCEPTS, LINKS } from './data/concepts.js';
import { existsSync } from 'node:fs';

// Leitner boxes
assert.equal(L.nextBox(3, 'again'), 0);
assert.equal(L.nextBox(0, 'good'), 1);
assert.equal(L.nextBox(1, 'easy'), 3);
assert.equal(L.nextBox(4, 'easy'), L.MAX_BOX);
const cards = ['a', 'b', 'c'].map(id => ({ id }));
const q = L.buildQueue([...cards, { id: 'd' }], { a: { box: 2, seen: 1 }, b: { box: 0, seen: 5 }, c: { box: 0, seen: 9 } });
assert.deepEqual(q.map(c => c.id), ['b', 'c', 'd', 'a'], 'missed first (oldest first), then never-seen, then known');
assert.equal(L.known(cards, { a: { box: 1 } }), 1);
assert.equal(L.cardId('ep1', 'Q?'), L.cardId('ep1', 'Q?'));
assert.notEqual(L.cardId('ep1', 'Q?'), L.cardId('ep4', 'Q?'));

// Puzzle
assert.deepEqual(L.wrongPositions(['a', 'c', 'b'], ['a', 'b', 'c']), [1, 2]);
assert.deepEqual(L.wrongPositions(['a', 'b'], ['a', 'b']), []);
let seed = 1; const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
for (let i = 0; i < 50; i++) {
  const s = L.shuffled(['a', 'b', 'c'], rnd);
  assert.notDeepEqual(s, ['a', 'b', 'c'], 'shuffle never returns the solved order');
  assert.deepEqual([...s].sort(), ['a', 'b', 'c']);
}

// Estimates
const e = L.estimate({ users: 1e6, perUser: 10, peak: 3, perServer: 100 });
assert.ok(Math.abs(e.peakRps - 347.2) < 0.1, '1M × 10 / 86,400 × 3 ≈ 347 req/s');
assert.equal(e.servers, 4, 'rounds up');
assert.equal(e.withSpare, 5);
const b = L.bloomSize(1e6, 0.01);
assert.ok(Math.abs(b.bits - 9.585e6) < 1e4 && b.k === 7, 'Bloom n=1e6 p=1% → ~9.59M bits, k=7');
assert.ok(Math.abs(L.bloomSize(3e9, 1e-4).bytes / 1e9 - 7.2) < 0.05, '300 crore at 0.01% ≈ 7.2 GB (matches EP-4)');
assert.ok(L.within(100, 125) && L.within(100, 75) && !L.within(100, 126) && !L.within(100, 74) && !L.within(100, NaN));
assert.ok(L.within(4 * 4.8, 24), 'edge survives float rounding');
assert.equal(L.fmtBytes(7.24e6), '7.2 MB');
assert.equal(L.indian(3e9), '300 crore');

// Drills: every kind produces a positive answer and explains the working
for (const kind of Object.keys(L.DRILLS)) for (let i = 0; i < 20; i++) {
  const d = L.DRILLS[kind](rnd);
  assert.ok(d.answer > 0 && d.unit && d.q && d.working, `drill ${kind}`);
}
for (const k of Object.values(L.DRILLS_BY_EP).flat()) assert.ok(L.DRILLS[k], `drill kind ${k} exists`);

// Follow-up queue: weak first, then untried, then strong
const fq = L.followQueue([{ id: 'x' }, { id: 'y' }, { id: 'z' }], { x: { score: 1, at: 1 }, z: { score: 0.2, at: 2 } });
assert.deepEqual(fq.map(f => f.id), ['z', 'y', 'x']);
assert.deepEqual(L.oftenMissed([{ id: 'p' }, { id: 'q' }], [{ ticked: ['p'] }, { ticked: ['p', 'q'] }]), ['q']);

// Episode data
for (const ep of [ep1, ep4]) {
  assert.ok(ep.video && ep.name && ep.cards.length >= 15, `${ep.id} basics`);
  assert.equal(new Set(ep.cards.map(c => L.cardId(ep.id, c.q))).size, ep.cards.length, `${ep.id} unique card ids`);
  assert.ok(ep.cards.every(c => c.q && c.a));
  assert.ok(L.clipsOk(ep.clips), `${ep.id} clips sorted, non-overlapping, ≤ 6 min`);
  assert.ok(ep.clips.every(c => c.title && c.why));
  assert.ok(ep.puzzle.steps.length >= 5 && ep.puzzle.missing.options.includes(ep.puzzle.missing.answer), `${ep.id} puzzle`);
  assert.equal(new Set(ep.followups.map(f => f.id)).size, ep.followups.length);
  assert.ok(ep.followups.every(f => f.q && f.points.length >= 3 && f.t >= 0), `${ep.id} follow-ups have points`);
  for (const p of ep.problems) {
    assert.ok(p.checklist.length >= 6 && existsSync(new URL(p.img.replace('../', './'), import.meta.url)), `${ep.id} problem ${p.id}`);
    assert.equal(new Set(p.checklist.map(c => c.id)).size, p.checklist.length);
  }
}

// Concept map
const ids = new Set(CONCEPTS.map(c => c.id));
assert.equal(ids.size, CONCEPTS.length, 'unique concept ids');
for (const [a, c] of LINKS) assert.ok(ids.has(a) && ids.has(c) && a !== c, `link ${a}–${c}`);
assert.ok(CONCEPTS.every(c => c.def && Object.keys(c.t).every(k => ['ep1', 'ep4'].includes(k))));
assert.ok(CONCEPTS.every(c => LINKS.some(l => l.includes(c.id))), 'every concept has at least one link');

console.log(`selftest: all assertions passed (${ep1.cards.length + ep4.cards.length} cards, ${CONCEPTS.length} concepts, ${LINKS.length} links)`);
