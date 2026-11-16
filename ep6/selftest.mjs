// Run: node ep6/selftest.mjs
import assert from 'node:assert/strict';
import * as S from './sim.js';
import { validate } from '../challenge.js';
import { TOOL, CALLS } from './scenarios.js';

const ids = (q, level, store = 'cp') => S.search(q, level, store).results.map(h => h.p.id);

// each layer finds what the one before it missed
assert.deepEqual(ids('aloo', 0), [], 'a plain DB never matches Hindi to English');
assert.deepEqual(ids('aloo', 2), ['aloo'], 'AI tags do');
assert.deepEqual(ids('tomatto', 0), []);
assert.deepEqual(ids('tomatto', 1), ['tomato'], 'typo tolerance');
assert.deepEqual(ids('mikl', 1), [], 'a transposition is 2 edits on a short word');
assert.deepEqual(ids('mikl', 2), ['milk1'], 'the AI wrote “mikl” as a typo tag');
assert.deepEqual(ids('मच्छर खा गए रे बाबा', 2), [], 'no shared word');
assert.deepEqual(ids('मच्छर खा गए रे बाबा', 3), ['allout', 'gknight'], 'meaning finds the refills');
assert.deepEqual(S.search('मच्छर खा गए रे बाबा', 3, 'cp').elsewhere.map(h => h.p.id), ['odomos'], 'other store’s stock is not shown');
assert.deepEqual(ids('पुलाव खाना है', 3), ['rice', 'oil']);
assert.deepEqual(ids('मट्ठा', 2), ['chaas']);
assert.equal(S.editDistance('milk', 'mikl'), 2);

// Redis cache: 60 s
const cache = new Map(); let calls = 0; const f = () => (calls++, { n: 1 });
assert.equal(S.cached(cache, 'cp|aloo', 0, f).hit, false);
assert.equal(S.cached(cache, 'cp|aloo', 59_000, f).hit, true);
assert.equal(S.cached(cache, 'cp|aloo', 60_000, f).hit, false);
assert.equal(calls, 2);

// guard + missed searches
assert.equal(S.guardTag('kanda').ok, true);
assert.equal(S.guardTag('BEEF curry').ok, false);
assert.equal(S.guardTag('kanda', { modelUp: false }).ok, false, 'fail closed');
const [kanda, bhindi, junk, beef] = S.MISSED;
assert.deepEqual(ids('kanda', 3), []);
assert.equal(S.approve(kanda, { modelUp: false }).ok, false);
assert.equal(S.approve(kanda).ok, true);
assert.deepEqual(ids('kanda', 2), ['onion'], 'approved tag is searchable');
assert.equal(S.approve(bhindi).ok, false); assert.equal(S.approve(junk).ok, false); assert.equal(S.approve(beef).ok, false);
assert.ok(!S.CATALOG.find(p => p.id === 'paneer').tags.includes('beef'));

// Challenges
assert.deepEqual(validate(TOOL), []);
assert.deepEqual(validate(CALLS), []);
console.log(`ep6 selftest: all assertions passed (4 layers, cache, guard, ${TOOL.length + CALLS.length} challenges)`);
