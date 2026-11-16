// EP-3 challenges. From the video unless marked "(general example)".
const A = ['Round robin', 'Weighted round robin', 'Least connections', 'IP hash', 'Generic hash', 'Random (power of two)'];
const tag = 'Which algorithm?';

export const ALGO = [
  { tag, q: 'Three identical servers. Every API call is short.', options: A, answer: A[0],
    why: 'Round robin is Nginx’s default: first, second, third, repeat. Use it when every server can handle the load.' },
  { tag, q: 'One server has twice the CPU and RAM of the others.', options: A, answer: A[1],
    why: 'Weighted round robin (<code>server s1 weight=3;</code>) gives bigger servers a bigger share.' },
  { tag, q: 'Some requests are big file uploads; others finish in milliseconds.', options: A, answer: A[2],
    why: 'Least connections (<code>least_conn;</code>) sends the next request to the server with the fewest active connections.' },
  { tag, q: 'Login sessions live in each server’s memory, and users get logged out when they land on another server.', options: A, answer: A[3],
    why: 'IP hash (<code>ip_hash;</code>) keeps a client on the same server, so its session is always there.' },
  { tag, q: 'Each server caches pages. You want <code>/video/42</code> to always hit the server whose cache is already warm.', options: A, answer: A[4],
    why: 'Generic hash (<code>hash $request_uri consistent;</code>): the same key (URL, user id, cookie) always goes to the same server.' },
  { tag, q: 'Many servers and several load balancers in front, each seeing only part of the load.', options: A, answer: A[5],
    why: 'Random two (<code>random two least_conn;</code>) picks 2 servers at random and sends to the less busy one.' },
  { tag, q: 'Requests from the US should go to the US server and requests from Delhi to the Delhi server.', options: A, answer: A[3],
    why: 'He used this as the IP hash example: you decide where a client’s requests go.' },
  { tag: 'Round robin', q: 'Server B is on slow Wi-Fi. Does round robin notice and send it fewer requests?', options: ['Yes, it skips slow servers', 'No, it doesn’t check whether the last request finished'], answer: 'No, it doesn’t check whether the last request finished',
    why: 'Round robin keeps pushing new requests in turn. That’s why you use it only when every server is equally capable.' },
  { tag: 'Which load balancer?', q: 'A small team wants a free, well-known software load balancer.', options: ['Nginx', 'F5 BIG-IP', 'AWS ALB'], answer: 'Nginx',
    why: 'In his AI’s table Nginx is free (Plus is paid) and the safest choice. F5 is expensive hardware, ALB is a paid cloud service.' },
  { tag: 'Which load balancer?', q: 'You run many microservices and want a proxy built for them.', options: ['Envoy', 'Caddy', 'Citrix'], answer: 'Envoy',
    why: 'Envoy is free and “very good for microservices”.' },
  { tag: 'Which load balancer?', q: 'A company with its own physical data centre buys a dedicated load-balancing box.', options: ['Traefik', 'F5 BIG-IP', 'LVS'], answer: 'F5 BIG-IP',
    why: 'Hardware load balancers (F5 BIG-IP, Citrix) sit physically in big data centres. They are paid and expensive.' },
  { tag: 'Which load balancer?', q: 'You want HTTPS certificates set up automatically with almost no config.', options: ['Caddy', 'LVS', 'HAProxy'], answer: 'Caddy',
    why: 'His AI’s table: Caddy is free with automatic SSL.' },
];

const U = ['Scale up (bigger machine)', 'Scale out (more machines)'];
export const UPOUT = [
  { tag: 'Up or out?', q: 'One person does teaching, client calls, content, accounts and hiring, at 160% of capacity. What is the real risk?', options: ['None, the work gets done', 'A single point of failure: if they fall sick, everything stops'], answer: 'A single point of failure: if they fall sick, everything stops',
    why: 'His story: when the one top performer leaves, the whole business drops. Distribute the work and keep backups.' },
  { tag: 'Up or out?', q: 'Your only server is at 95% CPU every evening, and a crash takes the whole app down.', options: U, answer: U[1],
    why: 'A bigger machine is still one machine. Scaling out removes the single point of failure.' },
  { tag: 'Up or out?', q: 'Budget is tight, the load fits on one bigger machine, and a short outage is acceptable.', options: U, answer: U[0],
    why: 'Vertical scaling is often cheaper. Every extra machine adds cost, maintenance and liability.' },
  { tag: 'Up or out?', q: 'In a restaurant, the waiter, cook, cleaner, cashier and delivery person are different people. Which is that?', options: U, answer: U[1],
    why: 'His analogy for horizontal scaling: never put all the load on one person.' },
  { tag: 'Find the bottleneck', q: 'One Mac alone did 1,244,513 requests. Two Macs behind Nginx over 2.4 GHz Wi-Fi did 62,368, with 1.9 MB/s received. What is the bottleneck?', options: ['Nginx', 'Server B’s CPU', 'The Wi-Fi network'], answer: 'The Wi-Fi network',
    why: '“The problem isn’t the computer, it’s the network.” On a 1 Gbps LAN the same setup served 1,016,029.' },
  { tag: 'Find the bottleneck', q: 'On the LAN, Server A’s CPU passes 95% during the test. Why?', options: ['The LAN cable is too slow', 'k6, Nginx and MongoDB also run on Server A', 'Round robin is wrong'], answer: 'k6, Nginx and MongoDB also run on Server A',
    why: 'k6 used 12–23% of the CPU and MongoDB 102%. In production they run on their own machines.' },
  { tag: 'Find the bottleneck', q: 'Where should k6 run in a serious load test?', options: ['On the app server', 'On its own machine, away from Nginx and the servers'], answer: 'On its own machine, away from Nginx and the servers',
    why: 'His next step: separate the Nginx server, k6 and the app servers so the test doesn’t eat the server’s CPU.' },
  { tag: 'Data centre', q: 'How do a data centre’s servers talk to each other?', options: ['Wi-Fi 6', 'Cat6/Cat7 cables and optical fibre through switches', 'Thunderbolt cables'], answer: 'Cat6/Cat7 cables and optical fibre through switches',
    why: 'At 10, 40 or 100 Gbps, all wired. Wi-Fi is never used for that traffic.' },
  { tag: 'Data centre', q: 'How did he turn two laptops into a 1 Gbps LAN?', options: ['A Wi-Fi router used only as a switch, with Ethernet cables', 'A faster Wi-Fi password', 'A cloud VPN'], answer: 'A Wi-Fi router used only as a switch, with Ethernet cables',
    why: 'No internet on that router, Wi-Fi off on both Macs, then the new IP (192.168.1.27) in the Nginx upstream.' },
  { tag: 'Numbers', q: 'The LAN run counted 1,016,029 requests in 1m50s. About how many per second?', options: ['~920', '~9,200', '~92,000'], answer: '~9,200',
    why: '1m50s = 110 s. 1,016,029 ÷ 110 ≈ 9,236 requests per second.' },
];
