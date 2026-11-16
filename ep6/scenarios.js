// EP-6 challenges. From the video unless marked "(general)".
const T = ['MongoDB', 'Typesense', 'Redis', 'Kafka', 'Gemma 3 (tags)', 'BGE-M3 (vectors)'];
const tag = 'Which piece?';

export const TOOL = [
  { tag, q: 'The one place that holds the full product, its tags, category and vector. If anything else is wiped, rebuild from here.', options: T, answer: T[0],
    why: 'MongoDB is the single source of truth. Typesense and Redis are copies you can rebuild (reindex).' },
  { tag, q: 'Answer “tomatto” and “आलू” in a fraction of a second, ranking by keyword and meaning together.', options: T, answer: T[1],
    why: 'Typesense keeps the index in RAM, tolerates typos and runs hybrid keyword + vector search.' },
  { tag, q: 'The same popular query arrives 1,000 times a minute. Skip the model and the index.', options: T, answer: T[2],
    why: '<code>search:{q}</code> is cached for 60 s and <code>qvec:{query}</code> keeps the query vector, so BGE-M3 and Typesense are both skipped.' },
  { tag, q: 'An admin saves a product. Reply at once; the AI work happens later, with retries.', options: T, answer: T[3],
    why: 'The API publishes to <code>products.ingest</code> and replies 202. After 3 failed retries an event goes to <code>products.ingest.dlq</code>.' },
  { tag, q: 'Turn “Potato 1 kg” into potato, aloo, आलू, batata and common typos.', options: T, answer: T[4],
    why: 'Gemma 3 4B (3.4 GB, via Ollama) writes the tags once, when the product is added. It beat Qwen on Indian languages in his tests.' },
  { tag, q: '“मच्छर खा गए रे बाबा” shares no word with “All Out refill”, yet must find it.', options: T, answer: T[5],
    why: 'BGE-M3 turns the query and the product into vectors that sit close when the meaning is close.' },
  { tag, q: 'Lakhs of old products need tags tonight without hurting daytime traffic.', options: T, answer: T[3],
    why: 'A night batch job pushes them into the same Kafka pipeline; the workers re-tag and re-embed in bulk.' },
];

const C = 'Design call';
export const CALLS = [
  { tag: C, q: 'When should the LLM write a product’s tags?', options: ['On every search', 'Once, when the product is added', 'Never, type them by hand'], answer: 'Once, when the product is added',
    why: 'Tags are made at write time (and by a night batch for old products). Search time only needs a cached query vector.' },
  { tag: C, q: 'A search returns zero results.', options: ['Add the query as a tag automatically', 'Log it; AI suggests a match; the admin approves with one click', 'Show an error'], answer: 'Log it; AI suggests a match; the admin approves with one click',
    why: 'The AI’s own advice: a junk query could become a tag, and one wrong tag spoils every user’s search. Sometimes the product isn’t in the catalog.' },
  { tag: C, q: 'Ollama is down while a new product is being tagged.', options: ['Save it with no checks', 'Fail closed: no tag, it stays pending', 'Use the shopper’s query as the tag'], answer: 'Fail closed: no tag, it stays pending',
    why: 'When the model or the guard can’t decide, add nothing. The tag is retried later.' },
  { tag: C, q: 'Should the LLM write directly to the products collection?', options: ['Yes, it is faster', 'No: AI only generates; the backend validates and writes'], answer: 'No: AI only generates; the backend validates and writes',
    why: '“AI’s only job is to generate.” The model never gets DB or system access.' },
  { tag: C, q: 'Search across all of India in one index, like Amazon?', options: ['Yes, one index', 'No: pincode → dark store; filter every search by store'], answer: 'No: pincode → dark store; filter every search by store',
    why: 'Quick commerce delivers from the nearby store. A clear zone makes search faster and more accurate.' },
  { tag: C, q: 'Elasticsearch or Typesense for this app today?', options: ['Elasticsearch: the truck', 'Typesense: the sports bike'], answer: 'Typesense: the sports bike',
    why: 'Typesense is light, in RAM, typo-tolerant and hybrid. Elasticsearch can do everything but is heavier to run: “maintaining the elephant is the hard part”.' },
  { tag: C, q: 'Where do you check for abusive or non-veg words?', options: ['Only in the admin form', 'At every door: suggest, admin tags, Kafka worker, missed searches, trending'], answer: 'At every door: suggest, admin tags, Kafka worker, missed searches, trending',
    why: 'The Kafka worker is the final gate: re-tag, seed and mapping all pass through it. The admin can’t override a block.' },
];
