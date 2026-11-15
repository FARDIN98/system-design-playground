// Scenario challenge: read a situation, pick an answer, get ✅/❌ + why, keep a score.
// Same file in filter-playground/ and system-design-playground/ (two repos, no shared package).

export const grade = (s, choice) => ({ right: choice === s.answer, answer: s.answer });

// returns a list of problems; empty means the data is fine
export function validate(list) {
  const bad = [];
  list.forEach((s, i) => {
    if (!s.q || !s.why || !s.tag) bad.push(`#${i} needs q, why and tag`);
    if (!s.options?.includes(s.answer)) bad.push(`#${i} answer not in options`);
    if (new Set(s.options).size !== s.options?.length) bad.push(`#${i} duplicate options`);
  });
  return bad;
}

const esc = s => String(s).replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));

export function mount(el, list) {
  let i = 0, score = 0, done = 0, picked = null;
  function draw() {
    const s = list[i], r = picked === null ? null : grade(s, picked);
    el.innerHTML = `<div class="ch-top"><span class="ch-tag">${esc(s.tag)}</span><span class="ch-score">Score ${score}/${done} · ${i + 1} of ${list.length}</span></div>
      <p class="ch-q">${s.q}</p>
      <div class="ch-opts">${s.options.map((o, k) => `<button type="button" class="act ch-opt${r ? (o === s.answer ? ' right' : o === picked ? ' wrong' : '') : ''}" data-k="${k}"${r ? ' disabled' : ''}>${esc(o)}</button>`).join('')}</div>
      <div class="ch-res" role="status" aria-live="polite">${r ? `<div class="banner ${r.right ? 'good' : 'bad'}">${r.right ? '✅ <b>Right.</b>' : `❌ <b>Not quite.</b> Answer: <b>${esc(s.answer)}</b>.`} ${s.why}</div>
      <button type="button" class="act ch-next">${i + 1 < list.length ? 'Next →' : `Done: ${score}/${done}. Start again`}</button>` : ''}</div>`;
  }
  el.addEventListener('click', e => {
    const o = e.target.closest('.ch-opt');
    if (o && picked === null) {
      picked = list[i].options[+o.dataset.k];
      done++; if (grade(list[i], picked).right) score++;
      draw(); el.querySelector('.ch-next').focus();
    } else if (e.target.closest('.ch-next')) {
      picked = null;
      if (++i >= list.length) { i = 0; score = 0; done = 0; }
      draw(); el.querySelector('.ch-opt').focus();
    }
  });
  draw();
}

export const CSS = `
.ch-top { display: flex; justify-content: space-between; gap: 8px; flex-wrap: wrap; font-size: 13px; color: var(--muted); }
.ch-tag { font-weight: 600; }
.ch-q { font-size: 16px; margin: 8px 0 10px; }
.ch-opts { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 10px; }
.ch-opt.right { border-color: var(--good); background: var(--good-bg); font-weight: 600; }
.ch-opt.wrong { border-color: var(--bad); background: var(--bad-bg); }
button.act.ch-opt:disabled { cursor: default; opacity: 1; }
`;
