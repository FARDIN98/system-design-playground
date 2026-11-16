// EP-5 challenges. From the video unless marked "(general)".
const T = ['Redis counter', 'HyperLogLog', 'Cuckoo filter', 'Mongo unique index', 'Kafka topic'];
const tag = 'Which tool?';

export const TOOL = [
  { tag, q: 'Show the total number of times a reel was viewed, including repeat views.', options: T, answer: T[0],
    why: 'A plain counter: <code>INCRBY post:{id}:views</code>. Reopening the post adds to it.' },
  { tag, q: 'Show how many <b>different</b> people viewed a reel that millions watched.', options: T, answer: T[1],
    why: 'HyperLogLog (<code>PFADD</code> / <code>PFCOUNT</code>) counts unique items in a few KB of hashes, with a small error.' },
  { tag, q: 'Show “you liked this” on every post in the feed without a DB query per post. Users can unlike.', options: T, answer: T[2],
    why: 'A per-user Cuckoo filter: “no” is certain, “maybe” is checked in Mongo, and it supports delete for unlikes.' },
  { tag, q: 'The same like event arrived twice. Make sure only one like is stored.', options: T, answer: T[3],
    why: 'A unique index on postId + userId rejects the duplicate; Redis then gets +1 only for rows really inserted.' },
  { tag, q: 'A million likes arrive in minutes; don’t make the user wait for the DB.', options: T, answer: T[4],
    why: 'The API drops each like in the Kafka likes topic and replies 202; a consumer writes them in batches.' },
  { tag, q: 'The exact like count for a post, which goes up on like and down on unlike.', options: T, answer: T[0],
    why: '+1 on like, −1 on unlike, but only when the DB really changed. HyperLogLog can’t subtract.' },
  { tag, q: 'Mark a reel as “seen” for a user so the feed can skip it. Seen never changes back.', options: T, answer: T[2],
    why: 'He reused the same Cuckoo filter type (<code>user:{id}:seen</code>) so there is only one kind of filter. A Bloom filter would also fit when nothing is ever deleted.' },
];

const C = 'Design call';
export const CALLS = [
  { tag: C, q: 'What should <code>POST /posts/:id/like</code> return once the event is in Kafka?', options: ['200 OK after the DB write', '202 Accepted right away', '201 Created with the new count'], answer: '202 Accepted right away',
    why: 'The like is accepted, not yet written. The UI shows +1 optimistically and reloads the real number 1.5 s later.' },
  { tag: C, q: 'Your startup gets 500–600 likes a day. Add Kafka now?', options: ['Yes, always start with Kafka', 'No, write directly and add the queue when the app grows'], answer: 'No, write directly and add the queue when the app grows',
    why: 'He said this himself: don’t take the scaling stress at the start; batching matters when the app grows.' },
  { tag: C, q: 'A repeated unlike reaches the consumer. <code>deleteOne</code> returns deletedCount 0. What happens to the Redis counter?', options: ['−1', 'Nothing', '+1'], answer: 'Nothing',
    why: 'Decrement only when a row was really deleted. Otherwise the counter goes negative.' },
  { tag: C, q: 'Redis is down while a user opens a profile.', options: ['Return 500 for the whole page', 'Return the posts; counts come back later', 'Count likes in Mongo for every post'], answer: 'Return the posts; counts come back later',
    why: 'The service shouldn’t go down with Redis. Counting in Mongo on every page load is exactly what the design avoids.' },
  { tag: C, q: 'Each like needs a counter +1 and a Cuckoo add in Redis, on another server.', options: ['Two separate calls per like', 'One Lua script per batch chunk', 'Skip Redis, use Mongo'], answer: 'One Lua script per batch chunk',
    why: 'Lua runs several commands in one network trip, atomically. His consumer used chunks of 5K (counters) and 2K (Cuckoo).' },
  { tag: C, q: 'The AI suggested KafkaJS. What do you do?', options: ['Install it, the AI knows best', 'Check its status first; he picked Confluent’s client'], answer: 'Check its status first; he picked Confluent’s client',
    why: 'KafkaJS isn’t actively maintained. Cross-check every dependency an AI suggests.' },
  { tag: C, q: 'The consumer crashed between the Mongo insert and the Redis +1. The counter is now 1 low.', options: ['Ignore it forever', 'A reconcile job fixes the counters later', 'Delete the like'], answer: 'A reconcile job fixes the counters later',
    why: 'Counter drift is expected; Mongo with its unique index is the source of truth.' },
];
