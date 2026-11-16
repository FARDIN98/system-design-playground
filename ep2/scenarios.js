// EP-2 challenges. From the video unless marked "(general)".
const tagS = 'Scale it';
export const SCALE = [
  { tag: tagS, q: 'Your Node API runs on a 16-core server. Grafana shows one core at 100% and the rest nearly idle. Why?', options: ['The DB is slow', 'Node runs one process on one core by default', 'The network is full'], answer: 'Node runs one process on one core by default',
    why: 'Even on 32 cores, one Node process uses one. Run more workers with PM2 cluster mode.' },
  { tag: tagS, q: 'On one core, which was fastest: Node (bare), Express or Fastify?', options: ['Node (bare)', 'Express', 'Fastify'], answer: 'Fastify',
    why: 'Fastify 6,545 · Node 5,225 · Express 5,101 req/s, 3000 users for 2 minutes.' },
  { tag: tagS, q: 'Go did 17,704 req/s and Fastify 6,545 on the same API. The main reason?', options: ['Go is compiled, nothing else', 'Go’s runtime used every core; Fastify ran on one', 'Go skipped the database'], answer: 'Go’s runtime used every core; Fastify ran on one',
    why: 'Go spreads work over all cores in the background (parallel processing), and used less CPU.' },
  { tag: tagS, q: 'Fastify goes from 1 process to PM2 × 4. About how many req/s?', options: ['~6,500 (no change)', '~15,000 (2.3×)', '~26,000 (4×)'], answer: '~15,000 (2.3×)',
    why: '6,545 → 15,010 req/s. Not 4×: macOS, the browser, k6 and MongoDB shared the same cores.' },
  { tag: tagS, q: 'You restart Fastify with <code>pm2 start -i max</code> on the 10-core Mac. What happens?', options: ['~2.5× faster than 4 workers', 'Slower than 4 workers', 'Exactly the same'], answer: 'Slower than 4 workers',
    why: '9,741 vs 15,010 req/s. Ten workers fought the OS and the other apps for 10 cores; system load hit ~650%.' },
  { tag: tagS, q: 'You have a 16-core server. How many PM2 workers do you start with?', options: ['16 (-i max)', 'Try 5–8 and measure', 'Always 1'], answer: 'Try 5–8 and measure',
    why: 'His rule: 10 cores → try 3, 4, 5; 16 cores → try 5–8. Keep the count that measures best.' },
  { tag: tagS, q: 'Express and Fastify both on PM2 × 4. Who wins?', options: ['Express', 'Fastify', 'A tie'], answer: 'Fastify',
    why: 'Fastify 15,010 vs Express 14,401 req/s, and the gap grows with more users (10k, 20k, 25k).' },
  { tag: 'Read the dashboard', q: 'Grafana: CPU busy 47%, system load 123%. What does “system load” measure?', options: ['How hard the CPU works right now', 'How many tasks are waiting in the queue', 'RAM used'], answer: 'How many tasks are waiting in the queue',
    why: 'CPU busy = the bank cashier. System load = the line. Over 100% means work is waiting.' },
  { tag: 'Read the dashboard', q: 'When did p95 latency start climbing in his tests?', options: ['When CPU busy passed ~50%', 'Only at 100% CPU', 'When RAM was full'], answer: 'When CPU busy passed ~50%',
    why: 'He pointed at it live: above about 50% CPU busy, p95 rises.' },
  { tag: 'Fair test', q: 'One test just ended. You start the next one right away. What is wrong?', options: ['Nothing', 'Leftover CPU and load skew the result', 'k6 needs a restart'], answer: 'Leftover CPU and load skew the result',
    why: 'Let it cool down, and stop the old servers first (pm2 stop all, pm2 delete all).' },
  { tag: 'Fair test', q: 'What still made every number in this episode a little unfair?', options: ['k6, MongoDB and the servers shared one laptop', 'He used HTTP/1.1', 'The API had pagination'], answer: 'k6, MongoDB and the servers shared one laptop',
    why: 'Next episode spreads them over 2–3 machines (horizontal scaling).' },
];

const tagC = 'Cache it?';
const YN = ['✅ Cache it', '❌ Don’t cache'];
export const CACHE = [
  { tag: tagC, q: 'Your bank balance.', options: YN, answer: YN[1], why: 'It must be exact every time (consistency).' },
  { tag: tagC, q: 'Your bank transaction history.', options: YN, answer: YN[0], why: 'A few seconds late is fine. He used this exact pair: balance no, history yes.' },
  { tag: tagC, q: 'The like count on an Instagram reel.', options: YN, answer: YN[0], why: 'The count shows up a few seconds later; nobody is hurt (availability).' },
  { tag: tagC, q: 'Product search results during a big sale (Flipkart Big Billion Days).', options: YN, answer: YN[0], why: 'Lakhs of people hit the same query; a short cache saves the CPU and the DB.' },
  { tag: 'Nginx cache', q: 'Fastify on PM2 × 4 did 15,010 req/s. With Nginx caching 200 replies for 15 s?', options: ['~16,000', '~56,000', '~150,000'], answer: '~56,000',
    why: '56,631 req/s and 6.22M requests: repeats came from Nginx, not Node or MongoDB.' },
  { tag: 'Nginx cache', q: 'Which Nginx line keeps a 200 reply for 15 seconds?', options: ['proxy_pass http://fastify/;', 'proxy_cache_valid 200 15s;', 'proxy_cache_lock on;'], answer: 'proxy_cache_valid 200 15s;',
    why: 'proxy_cache turns the cache on; proxy_cache_valid sets how long a 200 stays.' },
  { tag: 'Nginx cache', q: 'How do you see whether a reply came from the cache?', options: ['The X-Cache-Status header (HIT/MISS)', 'The response time only', 'You can’t'], answer: 'The X-Cache-Status header (HIT/MISS)',
    why: 'His config adds <code>add_header X-Cache-Status $upstream_cache_status</code>.' },
  { tag: 'Nginx cache', q: 'Is caching the same thing as Redis?', options: ['Yes', 'No, it is a concept: Nginx, Node, Redis, Memcached…'], answer: 'No, it is a concept: Nginx, Node, Redis, Memcached…',
    why: 'Anywhere you keep a ready copy is a cache. And cached customer data needs a secure server.' },
  { tag: 'Bytes vs CPU', q: 'The cached run moved 20 GB in 2 minutes. You turn on compression. His prediction?', options: ['Fewer bytes and more req/s', 'Fewer bytes (2–3 GB) but fewer req/s (~50–53k)', 'No change'], answer: 'Fewer bytes (2–3 GB) but fewer req/s (~50–53k)',
    why: 'Compression saves bandwidth but the CPU works harder. He left it as your assignment.' },
  { tag: 'Bytes vs CPU', q: 'You put Cloudflare in front. Does your server now send less data?', options: ['Yes, everywhere', 'No: only Cloudflare → customer shrinks; your server → Cloudflare is still full size'], answer: 'No: only Cloudflare → customer shrinks; your server → Cloudflare is still full size',
    why: 'The data still has to travel from your server to Cloudflare.' },
];
