import mongoose from 'mongoose';

const DOH_ENDPOINTS = ['https://dns.google/resolve', 'https://cloudflare-dns.com/dns-query'];
const FAST_TIMEOUT = 8000;

const dnsJson = async (endpoint, name, type) => {
  const qs = endpoint.includes('dns-query')
    ? `?name=${encodeURIComponent(name)}&type=${type}`
    : `?name=${encodeURIComponent(name)}&type=${type}`;
  const res = await fetch(`${endpoint}${qs}`, {
    headers: endpoint.includes('dns-query') ? { Accept: 'application/dns-json' } : {},
    signal: AbortSignal.timeout(6000),
  });
  if (!res.ok) throw new Error(`DoH ${type} ${name}: HTTP ${res.status}`);
  const data = await res.json();
  if (data.Status !== 0 || !Array.isArray(data.Answer)) throw new Error(`DoH ${type} ${name}: no answer`);
  return data.Answer;
};

const firstAnswer = async (name, type) => {
  let last;
  for (const endpoint of DOH_ENDPOINTS) {
    try {
      return await dnsJson(endpoint, name, type);
    } catch (err) {
      last = err;
    }
  }
  throw last;
};

const isIp = (s) => /^\d{1,3}(\.\d{1,3}){3}$/.test(s);

const resolveToIp = async (host) => {
  let current = host;
  for (let i = 0; i < 4; i += 1) {
    const answers = await firstAnswer(current, 'A');
    const ip = answers.find((a) => a.type === 1 && isIp(a.data));
    if (ip) return ip.data;
    const cname = answers.find((a) => a.type === 5);
    if (!cname) break;
    current = cname.data.replace(/\.$/, '');
  }
  throw new Error(`Could not resolve ${host} to an IP via DoH`);
};

const resolveCluster = async (host) => {
  const srv = await firstAnswer(`_mongodb._tcp.${host}`, 'SRV');
  const servers = srv
    .map((a) => {
      const parts = a.data.split(' ');
      return parts.length === 4 ? { port: parts[2], target: parts[3].replace(/\.$/, '') } : null;
    })
    .filter(Boolean);
  if (!servers.length) throw new Error('No SRV records found via DoH');

  const ips = await Promise.all(servers.map(async (s) => `${await resolveToIp(s.target)}:${s.port}`));

  const txt = await firstAnswer(host, 'TXT');
  const params = txt.map((a) => a.data).join('&');

  return { ips, params };
};

const buildDirectUri = (original, cluster) => {
  const match = original.match(/^mongodb\+srv:\/\/([^@]+)@([^/]+)\/([^?]*)(\?.*)?$/);
  if (!match) throw new Error('Unsupported MONGODB_URI format');

  const [, creds, , db, query = ''] = match;
  const qs = new URLSearchParams(query.replace(/^\?/, ''));

  cluster.params.split('&').forEach((kv) => {
    const [k, v] = kv.split('=');
    if (k && v && !qs.has(k)) qs.set(k, v);
  });

  qs.set('tls', 'true');
  qs.set('tlsAllowInvalidHostnames', 'true');
  qs.set('directConnection', 'false');

  return `mongodb://${creds}@${cluster.ips.join(',')}/${db}?${qs}`;
};

const connectDB = async () => {
  const attempts = Number(process.env.DB_RETRY_ATTEMPTS) || 20;
  const delayMs = Number(process.env.DB_RETRY_DELAY_MS) || 15000;

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    if (attempt > 1) {
      console.log(`MongoDB unreachable — retry ${attempt}/${attempts} in ${delayMs / 1000}s...`);
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
    try {
      const conn = await mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: FAST_TIMEOUT });
      console.log(`MongoDB connected: ${conn.connection.host}`);
      return;
    } catch (error) {
      if (!process.env.MONGODB_URI.startsWith('mongodb+srv://')) {
        console.error('MongoDB connection error:', error.message);
        continue;
      }
    }

    // System DNS failed (e.g., a DNS filter drops *.mongodb.net). Fall back to
    // resolving the cluster over HTTPS (DoH) and connecting straight to its IPs.
    try {
      const host = process.env.MONGODB_URI.split('@')[1].split('/')[0];
      const cluster = await resolveCluster(host);
      const direct = buildDirectUri(process.env.MONGODB_URI, cluster);
      console.log('System DNS blocked MongoDB; using DoH-resolved direct connection...');
      const conn = await mongoose.connect(direct, { serverSelectionTimeoutMS: 15000 });
      console.log(`MongoDB connected: ${conn.connection.host}`);
      return;
    } catch (error) {
      console.error(`MongoDB connection error (attempt ${attempt}):`, error.message);
    }
  }

  console.error('MongoDB connection failed after all retries.');
  process.exit(1);
};

export default connectDB;