// EP-6 search lab: a toy model of the layers in the video (wildcard → typos → AI tags → meaning), filtered by dark store.
// shortcut: a small MEANING table stands in for BGE-M3 vectors; real vectors score similarity for any text.

export const STORES = [
  { id: 'cp', name: 'Connaught Place, Delhi' },
  { id: 'dg', name: 'Daryaganj, Delhi' },
];

// tags like the ones his Gemma 3 prompt produced (milk, water and potato examples are from the video)
export const CATALOG = [
  { id: 'milk1', name: 'Amul Taaza Toned Milk 500 ml', group: 'milk', stores: ['cp', 'dg'], tags: ['milk', 'doodh', 'dudh', 'दूध', 'paal', 'mik', 'mikl', 'mlik'] },
  { id: 'milk2', name: 'Mother Dairy Milk 1 L', group: 'milk', stores: ['cp'], tags: ['milk', 'doodh', 'दूध', 'paal'] },
  { id: 'chaas', name: 'Amul Buttermilk 300 ml', group: 'buttermilk', stores: ['cp', 'dg'], tags: ['buttermilk', 'chaas', 'छाछ', 'ताक', 'मट्ठा', 'mattha'] },
  { id: 'aloo', name: 'Fresh Potato 1 kg', group: 'veg', stores: ['cp', 'dg'], tags: ['potato', 'aloo', 'आलू', 'batata', 'बटाटा', 'alu'] },
  { id: 'onion', name: 'Fresh Onion 1 kg', group: 'veg', stores: ['cp', 'dg'], tags: ['onion', 'pyaz', 'प्याज'] },
  { id: 'tomato', name: 'Fresh Tomato 500 g', group: 'veg', stores: ['cp'], tags: ['tomato', 'tamatar', 'टमाटर'] },
  { id: 'allout', name: 'All Out Refill 45 ml', group: 'mosquito', stores: ['cp', 'dg'], tags: ['all out', 'mosquito repellent', 'machhar bhagane wala', 'मच्छर भगाने वाला'] },
  { id: 'gknight', name: 'Good Knight Refill', group: 'mosquito', stores: ['cp'], tags: ['good knight', 'mosquito repellent', 'machhar ki dawa', 'मच्छर की दवा'] },
  { id: 'odomos', name: 'Odomos Cream 50 g', group: 'mosquito', stores: ['dg'], tags: ['odomos', 'mosquito cream'] },
  { id: 'tea', name: 'Tata Tea Premium 250 g', group: 'tea', stores: ['cp', 'dg'], tags: ['tea', 'chai', 'चाय', 'chai patti'] },
  { id: 'rice', name: 'Basmati Rice 1 kg', group: 'rice', stores: ['cp', 'dg'], tags: ['basmati', 'rice', 'chawal', 'चावल'] },
  { id: 'oil', name: 'Sunflower Oil 1 L', group: 'oil', stores: ['cp'], tags: ['oil', 'tel', 'तेल'] },
  { id: 'water', name: 'Packaged Drinking Water 1 L', group: 'water', stores: ['cp', 'dg'], tags: ['water', 'paani', 'pani', 'पानी', 'mineral water'] },
  { id: 'paneer', name: 'Fresh Paneer 200 g', group: 'paneer', stores: ['dg'], tags: ['paneer', 'पनीर', 'cottage cheese'] },
];

// the vector stand-in: words whose meaning points at product groups
export const MEANING = [
  [['मच्छर', 'machhar', 'mosquito', 'mosquitoes'], ['mosquito']],
  [['सब्जी', 'sabzi', 'sabji', 'vegetable', 'vegetables'], ['veg']],
  [['पुलाव', 'pulav', 'pulao', 'biryani'], ['rice', 'oil']],
  [['चाय', 'chai'], ['tea']],
  [['दूध', 'doodh'], ['milk']],
  [['प्यास', 'pyaas', 'thirsty'], ['water']],
];

export const QUERIES = ['mikl', 'tomatto', 'aloo', 'दूध चाहिए', 'मच्छर खा गए रे बाबा', 'पुलाव खाना है', 'मट्ठा', 'सब्जी लेनी है', 'kanda'];

export const LAYERS = [
  ['wild', 'Wildcard on the name (a plain DB)'],
  ['typo', '+ typo tolerance'],
  ['tags', '+ AI tags in every language'],
  ['vec', '+ meaning (vectors)'],
];

const norm = s => s.toLowerCase().normalize('NFC').trim();
const words = s => norm(s).split(/[\s,.!?]+/).filter(Boolean);

export function editDistance(a, b) {
  const d = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)]);
  for (let j = 1; j <= b.length; j++) d[0][j] = j;
  for (let i = 1; i <= a.length; i++) for (let j = 1; j <= b.length; j++)
    d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
  return d[a.length][b.length];
}
// 1 typo for short words, 2 for long ones (Typesense allows up to 2 by default, general)
const typoOk = (w, t) => w.length >= 3 && t.length >= 3 && editDistance(w, t) <= (w.length >= 6 ? 2 : 1);

// level: 0 = wildcard only … 3 = everything. Returns [{ p, why }] for the chosen store, plus out-of-stock hits.
export function search(q, level, store) {
  const ws = words(q), hits = new Map();
  const add = (p, why) => { if (!hits.has(p.id)) hits.set(p.id, { p, why }); };
  for (const p of CATALOG) {
    const name = norm(p.name), nameWords = words(p.name);
    if (ws.some(w => w.length >= 2 && name.includes(w))) { add(p, 'name'); continue; }
    if (level >= 1 && ws.some(w => nameWords.some(n => typoOk(w, n)))) { add(p, 'typo'); continue; }
    if (level >= 2 && ws.some(w => p.tags.some(t => norm(t) === w || (t.includes(' ') && norm(q).includes(norm(t)))))) { add(p, 'tag'); continue; }
    if (level >= 2 && ws.some(w => p.tags.some(t => !t.includes(' ') && typoOk(w, norm(t))))) { add(p, 'tag+typo'); continue; }
    if (level >= 3 && MEANING.some(([ks, gs]) => gs.includes(p.group) && ws.some(w => ks.includes(w)))) add(p, 'meaning');
  }
  const all = [...hits.values()];
  return { results: all.filter(h => h.p.stores.includes(store)), elsewhere: all.filter(h => !h.p.stores.includes(store)) };
}

// Redis search:{q} cache, 60 s, keyed by store + query
export const TTL = 60_000;
export function cached(cache, key, now, compute) {
  const c = cache.get(key);
  if (c && now - c.at < TTL) return { ...c.value, hit: true };
  const value = compute(); cache.set(key, { at: now, value }); return { ...value, hit: false };
}

// guard for any new tag (from the video's BLOCKED list and veg rule); fail closed when the checker is down
export const BLOCKED = ['beef', 'beaf', 'pork', 'bacon', 'gomaans'];
export function guardTag(tag, { modelUp = true } = {}) {
  if (!modelUp) return { ok: false, why: 'The model is down: fail closed. The tag stays pending.' };
  const t = norm(tag);
  if (!t) return { ok: false, why: 'Empty tag.' };
  if (BLOCKED.some(b => t.includes(b))) return { ok: false, why: 'Blocked word: a veg product never gets a non-veg word.' };
  return { ok: true, why: 'Passed the guard.' };
}

// missed searches: the AI suggests a match, the admin approves with one click
export const MISSED = [
  { q: 'kanda', suggest: 'onion', note: 'Marathi for onion.' },
  { q: 'bhindi', suggest: null, note: 'Not in this catalog: nothing to map. Approving a random product would spoil the search.' },
  { q: 'asdfgh', suggest: null, note: 'Junk typing. Auto-adding it as a tag would pollute a product.' },
  { q: 'beef', suggest: 'paneer', note: 'The AI matched it to a protein. The guard must stop it.' },
];
export function approve(missed, { modelUp = true } = {}) {
  const p = CATALOG.find(x => x.id === missed.suggest);
  if (!p) return { ok: false, why: 'No suggested match: reject it (log it as demand if it is a real product).' };
  const g = guardTag(missed.q, { modelUp });
  if (!g.ok) return g;
  if (!p.tags.includes(missed.q)) p.tags.push(missed.q);
  return { ok: true, why: `“${missed.q}” added as a tag on ${p.name}.` };
}
