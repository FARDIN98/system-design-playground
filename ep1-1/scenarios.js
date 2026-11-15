// EP-1.1 challenges. From the video unless marked "(general example)".
const G = ['✅ Allowed', '🙋 Ask me first', '⛔ Blocked by a hook'];
const tag = 'Allowed, ask or blocked?';

export const GUARD = [
  { tag, q: 'The AI agent wants to run <code>git push</code> after finishing a feature.', options: G, answer: G[2],
    why: 'Guardrail: no git add, commit or push. You review and push yourself. In his test this probe was blocked.' },
  { tag, q: 'It wants to run <code>DELETE FROM users</code> to “clean up test data”.', options: G, answer: G[2],
    why: 'No DB deletes and no direct DB access. Blocked in his 49-probe test.' },
  { tag, q: 'It wants to delete a folder it thinks is unused.', options: G, answer: G[2],
    why: 'No file deletes. AI “will go to any length to finish a task”, so this needs a hook, not a polite rule.' },
  { tag, q: 'It wants to read the <code>.env</code> file to “check the config”.', options: G, answer: G[2],
    why: 'Claude’s own proposal: block reading .env, because it holds secrets.' },
  { tag, q: 'It wants to <code>touch</code> a file outside the project folder.', options: G, answer: G[2],
    why: 'Stay inside the project folder. touch was one of the blocked probes.' },
  { tag, q: 'It wants to edit its own hook scripts so a command can get through.', options: G, answer: G[2],
    why: 'Hook files are protected, so the AI can’t switch off its own guardrails.' },
  { tag, q: 'It wants to run <code>pnpm dev</code> to start the API and check a route.', options: G, answer: G[1],
    why: 'Guardrail 1: run nothing without your OK. Starting a server is fine once you agree.' },
  { tag, q: 'It wants to <code>npm install</code> a new package while the network is off.', options: G, answer: G[2],
    why: 'Network is off by default; npm install and curl were blocked. You can open it with allow-net for a 30-minute session.' },
  { tag, q: 'After you approved the plan, it writes <code>cities.service.ts</code> inside the project.', options: G, answer: G[0],
    why: 'Writing code in the folder after the plan is approved is the job. The guardrails stop the risky actions, not the work.' },
  { tag: 'Rule or hook?', q: 'Auto mode is on. Your rules say “ask before <code>docker exec</code>”, but there is no hook for it. What happens?', options: ['It asks you first', 'It runs without asking', 'It is blocked'], answer: 'It runs without asking',
    why: '“Ask” is skipped in auto mode. Only hooks run in every mode (exit code 2 blocks), so put the important ones in hooks.' },
  { tag: 'Rule or hook?', q: 'How do you check that the hooks really work?', options: ['Trust the AI’s summary', 'Run a test prompt in a second Claude session', 'Wait for something to go wrong'], answer: 'Run a test prompt in a second Claude session',
    why: 'He asked Claude for a test prompt and ran it in another session: all 49 probes behaved as expected.' },
];

const F = ['bootstrap/', 'integrations/', 'modules/', 'shared/', 'config/'];
const ftag = 'Where does it go?';
export const PLACE = [
  { tag: ftag, q: 'Connecting to MongoDB when the app starts.', options: F, answer: F[0], why: 'bootstrap/ = what starts at boot: MongoDB, Redis, logger, CORS, Helmet, Swagger, error handler.' },
  { tag: ftag, q: 'The logger setup.', options: F, answer: F[0], why: 'Starts at boot, one small file in bootstrap/.' },
  { tag: ftag, q: 'Sending a booking confirmation on WhatsApp or SMS.', options: F, answer: F[1], why: 'integrations/ = calls to outside services: email, SMS, WhatsApp, payment.' },
  { tag: ftag, q: 'Calling the payment gateway.', options: F, answer: F[1], why: 'An outside service, so integrations/.' },
  { tag: ftag, q: '<code>cities.routes</code>, <code>cities.schema</code>, <code>cities.service</code>, <code>cities.repository</code>.', options: F, answer: F[2], why: 'modules/cities/: one folder per feature (feature-based), not split by file type like MVC.' },
  { tag: ftag, q: 'The new “booking” feature.', options: F, answer: F[2], why: 'Features (cinema, movie, booking, payment, tickets) live in modules/.' },
  { tag: ftag, q: 'A small error helper that every module uses.', options: F, answer: F[3], why: 'shared/ = small helpers used everywhere.' },
  { tag: ftag, q: 'Reading environment variables, once.', options: F, answer: F[4], why: 'config/env.ts loads the env once, so there is no process.env all over the code.' },
  { tag: 'Which layer?', q: 'Which layer is allowed to talk to MongoDB?', options: ['route', 'service', 'repository'], answer: 'repository', why: 'route → schema → service → repository → DB. Only the repository touches the DB.' },
  { tag: 'Which layer?', q: 'A request has a bad <code>cityId</code>. Where is it stopped with a 400?', options: ['route lookup', 'schema validation', 'repository'], answer: 'schema validation', why: 'The schema checks input before any logic runs. Bad input → 400.' },
  { tag: 'Which layer?', q: 'Someone calls <code>GET /</code> and no route matches. What comes back?', options: ['200', '400', '404'], answer: '404', why: '“Route GET / not found”: the first check is whether a route exists.' },
  { tag: 'Engineering, not over-engineering', q: 'Day one, no search feature yet. The AI adds Redis and Elasticsearch to bootstrap/. Keep them?', options: ['Keep them, we may need them', 'Remove them until a feature needs them'], answer: 'Remove them until a feature needs them',
    why: 'He called this out: “engineering, not over-engineering”. Add parts when a feature needs them.' },
];
