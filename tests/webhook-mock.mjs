// Test-only APPLY_WEBHOOK_URL target: records POSTs; GET /received returns them; DELETE clears.
import { createServer } from 'node:http';

const received = [];
createServer((req, res) => {
  if (req.method === 'POST') {
    let body = '';
    req.on('data', (c) => (body += c));
    req.on('end', () => {
      received.push(JSON.parse(body));
      res.writeHead(200).end('ok');
    });
    return;
  }
  if (req.method === 'DELETE') received.length = 0;
  res.writeHead(200, { 'Content-Type': 'application/json' }).end(JSON.stringify(received));
}).listen(Number(process.env.PORT ?? 4390));
