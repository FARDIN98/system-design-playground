# System design playground

Small interactive pages that go with Ankit Jain's System Design series (Hindi, YouTube).

| Page | What it does |
|---|---|
| [Revision hub](https://fardin98.github.io/system-design-playground/revise/?ep=1) | Graded flashcards, a 5-minute clip reel, an order-the-flow puzzle and a concept map across episodes |
| [Interview practice](https://fardin98.github.io/system-design-playground/interview/?ep=1) | Interviewer follow-up drills (90 s, tick what you said), back-of-envelope estimation drills, draw-then-compare |
| [EP-1 playground](https://fardin98.github.io/system-design-playground/ep1/) | Vertical vs horizontal scaling, CAP during a network split, challenges, users → servers estimate |
| [EP-4 filter playground](https://fardin98.github.io/filter-playground/) | Bloom and Cuckoo filters, pick-the-filter challenges, Bloom sizing |
| Last-hour cheat sheets: [EP-1](https://fardin98.github.io/system-design-playground/cheatsheets/ep1.pdf) · [EP-4](https://fardin98.github.io/system-design-playground/cheatsheets/ep4.pdf) · [both](https://fardin98.github.io/system-design-playground/cheatsheets/all.pdf) | One A4 page each: the 5 steps, key numbers, trade-off sentences, red flags, mini diagrams |

Use `?ep=1`, `?ep=4` or `?ep=all` on the hub pages. Progress is saved in the browser (per device).

Adding an episode: write `data/epN.js` (same shape as `data/ep1.js`), add its concepts to `data/concepts.js`, and register it in the two hub pages and `lib.js` `DRILLS_BY_EP`.

Plain HTML + small JS modules, no build step. Self-test: `node selftest.mjs && node ep1/selftest.mjs`.

Cheat sheets are HTML (`cheatsheets/*.html`); `cheatsheets/build.sh` prints them to PDF with Chrome and fails if a sheet overflows its single A4 page.
