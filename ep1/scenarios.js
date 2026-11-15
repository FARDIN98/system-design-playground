// EP-1 scenario challenges. Examples are from the video unless marked "(general example)".
const CA = ['C + P: correct or nothing', 'A + P: always answer'];
const VH = ['Vertical: one bigger machine', 'Horizontal: more machines'];

export const SCENARIOS = [
  { tag: 'CP or AP?', q: 'Your <b>UPI balance</b> is shown on PhonePe, GPay and BHIM. The network between two DB nodes breaks.', options: CA, answer: CA[0],
    why: 'Money must be the same and correct everywhere. Better to say “try again” than show a wrong balance.' },
  { tag: 'CP or AP?', q: 'An <b>Instagram like count</b> is read millions of times a minute. A DB node loses its link.', options: CA, answer: CA[1],
    why: 'Showing 1000 likes when the real count is 1001 is fine. Always answering matters more.' },
  { tag: 'CP or AP?', q: 'A <b>bank’s transaction history</b> list in the app (not the balance check before paying).', options: CA, answer: CA[1],
    why: 'The video notes history can lag a bit. A slightly old list is OK; the balance check before a payment is the part that needs C.' },
  { tag: 'CP or AP?', q: 'Two people pay for the <b>last seat</b> on BookMyShow while the DB nodes are split. (general example)', options: CA, answer: CA[0],
    why: 'Selling one seat twice is like spending the same money twice. Refuse on the side that can’t confirm.' },
  { tag: 'CP or AP?', q: 'WhatsApp’s <b>“last seen”</b> time while the network between data centres is flaky. (general example)', options: CA, answer: CA[1],
    why: 'A last-seen time that is a few seconds old hurts nobody. Keep answering.' },
  { tag: 'CP or AP?', q: 'Your app’s DB nodes are split. You must keep the <b>wallet balance</b> exact. Which node answers?', options: ['Both nodes, each with what it knows', 'Only the primary; the other refuses', 'Neither; shut down the whole app'], answer: 'Only the primary; the other refuses',
    why: 'In C + P the node that can’t reach the primary refuses, so no one sees or spends a wrong balance (like the playground’s Delhi node).' },
  { tag: 'Scale up or out?', q: '<b>Big Billion Day</b> sale: 1 lakh users arrive at once, and one server crash must not stop the sale.', options: VH, answer: VH[1],
    why: 'Use 3+ servers behind a load balancer. If one dies, the others keep running.' },
  { tag: 'Scale up or out?', q: 'A small internal tool with few users and a tight budget. Downtime is annoying but not costly.', options: VH, answer: VH[0],
    why: 'The AI picture in the video says vertical is best for simple apps. Just keep in mind it is a single point of failure.' },
  { tag: 'Scale up or out?', q: '“Server down → <b>all bookings stop</b>.” Which design has this problem?', options: VH, answer: VH[0],
    why: 'One big machine is a single point of failure, however many cores it has.' },
  { tag: 'Scale up or out?', q: 'A <b>chai shop</b> with 500 customers opens a second and third branch.', options: VH, answer: VH[1],
    why: 'More branches = more machines sharing the load. Adding staff to one shop would be vertical.' },
  { tag: 'DB scaling', q: 'Reads on your products table are getting slow. What do you try <b>first</b>?', options: ['Indexing', 'Replication', 'Sharding'], answer: 'Indexing',
    why: 'The order from the video: indexing → replication (copies, also a backup) → sharding (split the data).' },
  { tag: 'DB scaling', q: 'Indexes are done, but one DB node still can’t serve all the reads, and you want a copy in case it dies.', options: ['Indexing', 'Replication', 'Sharding'], answer: 'Replication',
    why: 'Replication keeps copies on several nodes: more nodes to read from, and a backup.' },
];
