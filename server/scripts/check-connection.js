import 'dotenv/config';
import net from 'net';
import { resolveSrv } from 'dns/promises';

const ping = (host, port, timeoutMs = 5000) => {
  return new Promise((resolve) => {
    const start = Date.now();
    const socket = new net.Socket();
    socket.setTimeout(timeoutMs);
    socket.once('connect', () => {
      socket.destroy();
      resolve({ ok: true, ms: Date.now() - start });
    });
    socket.once('error', (err) => {
      resolve({ ok: false, error: err.message });
    });
    socket.once('timeout', () => {
      socket.destroy();
      resolve({ ok: false, error: 'timeout' });
    });
    socket.connect(port, host);
  });
};

const uri = process.env.MONGODB_URI || '';
console.log('URI host:', new URL(uri).host);

let hosts = [new URL(uri).host];
try {
  const records = await resolveSrv(`_mongodb._tcp.${hosts[0]}`);
  hosts = records.map((r) => r.name);
  console.log('Resolved SRV shards:', hosts.join(', '));
} catch (err) {
  console.log('SRV resolve failed (trying direct):', err.message);
}

for (const host of hosts) {
  const result = await ping(host, 27017);
  console.log(`${host}:27017 -> ${result.ok ? `CONNECTED in ${result.ms}ms` : `FAILED (${result.error})`}`);
}

process.exit(0);