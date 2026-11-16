// Count lab: a real HyperLogLog, EP-5's batching numbers and the like/unlike deletedCount guard.

// ---------- HyperLogLog (p = 14: 16,384 six-bit registers = 12 KB, like Redis; standard error 1.04/√m ≈ 0.81%) ----------
export const P = 14, M = 1 << P;
export const HLL_BYTES = (M * 6) / 8; // 12,288
const fmix = h => { h ^= h >>> 16; h = Math.imul(h, 0x85ebca6b); h ^= h >>> 13; h = Math.imul(h, 0xc2b2ae35); return (h ^ (h >>> 16)) >>> 0; };
export const hash32 = id => fmix(Math.imul(id + 1, 0x9e3779b1) ^ 0x5bd1e995);

export function hll() {
  const reg = new Uint8Array(M);
  return {
    add(id) {
      const h = hash32(id), j = h >>> (32 - P), w = (h << P) >>> 0;
      const rank = w === 0 ? 32 - P + 1 : Math.clz32(w) + 1;
      if (rank > reg[j]) reg[j] = rank;
    },
    count() {
      let sum = 0, zeros = 0;
      for (let j = 0; j < M; j++) { sum += 2 ** -reg[j]; if (!reg[j]) zeros++; }
      const e = ((0.7213 / (1 + 1.079 / M)) * M * M) / sum;
      return e <= 2.5 * M && zeros ? M * Math.log(M / zeros) : e; // small-range correction
    },
  };
}

// views from `unique` different users, `total` views in all (every user at least once, the rest repeats)
export function views({ total, unique, seed = 7 }) {
  let s = seed; const rnd = () => ((s = (s * 16807) % 2147483647) / 2147483647);
  const h = hll(), seen = new Set();
  for (let i = 0; i < total; i++) { const u = i < unique ? i : Math.floor(rnd() * unique); h.add(u); seen.add(u); }
  const est = h.count();
  return { total, exact: seen.size, est, err: (est - seen.size) / seen.size, setBytes: seen.size * 8, hllBytes: HLL_BYTES };
}

// ---------- batching (EP-5's consumer: up to 50K events per batch, Redis counters in Lua calls of 5K, Cuckoo adds in 2K) ----------
export const LUA_CHUNK = 5000, CUCKOO_CHUNK = 2000;
export function batching({ events, batch }) {
  const full = Math.floor(events / batch), rest = events % batch;
  const calls = chunk => full * Math.ceil(batch / chunk) + (rest ? Math.ceil(rest / chunk) : 0);
  return { batches: full + (rest ? 1 : 0), lua: calls(LUA_CHUNK), cuckoo: calls(CUCKOO_CHUNK) };
}

// ---------- like / unlike with and without the deletedCount guard ----------
// rows = Mongo likes (unique postId + userId); guarded = Redis counter that moves only when Mongo changed; naive = +1/−1 per event
export const freshLikes = () => ({ rows: new Set(), guarded: 0, naive: 0, log: [] });
export function apply(st, { type, user }) {
  const has = st.rows.has(user);
  let changed = 0;
  if (type === 'like' && !has) { st.rows.add(user); changed = 1; }
  if (type === 'unlike' && has) { st.rows.delete(user); changed = -1; }
  st.guarded += changed;
  st.naive += type === 'like' ? 1 : -1;
  st.log.push({ type, user, changed, note: type === 'like' ? (changed ? 'inserted' : 'duplicate: unique index blocked it') : (changed ? 'deletedCount 1' : 'deletedCount 0: nothing to delete') });
  return st;
}
