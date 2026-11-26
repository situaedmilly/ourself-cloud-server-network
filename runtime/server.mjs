import http from 'node:http';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '..');
const HOST = '127.0.0.1';
const PORT = Number(process.env.OURSELF_CLOUD_NETWORK_PORT || 49330);
const DATA_DIR = process.env.OURSELF_CLOUD_NETWORK_DATA_DIR || path.join(ROOT, 'runtime', 'data');
const REGISTRY_FILE = process.env.OURSELF_CLOUD_NETWORK_REGISTRY || path.join(HERE, 'registry.v0.1.json');
const MAX_BODY_BYTES = 32 * 1024;

const json = (res, status, body) => {
  const bytes = Buffer.from(JSON.stringify(body));
  res.writeHead(status, {
    'content-type': 'application/json; charset=utf-8',
    'content-length': bytes.length,
    'cache-control': 'no-store',
    'x-content-type-options': 'nosniff'
  });
  res.end(bytes);
};

const readBody = req => new Promise((resolve, reject) => {
  const chunks = [];
  let size = 0;
  req.on('data', chunk => {
    size += chunk.length;
    if (size > MAX_BODY_BYTES) {
      reject(Object.assign(new Error('BODY_TOO_LARGE'), { status: 413 }));
      req.destroy();
      return;
    }
    chunks.push(chunk);
  });
  req.on('end', () => resolve(Buffer.concat(chunks)));
  req.on('error', reject);
});

const validateRegistry = registry => {
  if (!Array.isArray(registry.runtimes)) throw new Error('INVALID_RUNTIME_REGISTRY');
  for (const runtime of registry.runtimes) {
    const url = new URL(runtime.base_url);
    if (url.protocol !== 'http:' || url.hostname !== '127.0.0.1') {
      throw new Error('RUNTIME_REGISTRY_ENDPOINT_MUST_BE_LOOPBACK');
    }
  }
};

export function createCloudNetworkServer({ registryFile = REGISTRY_FILE, dataDir = DATA_DIR } = {}) {
  const registry = JSON.parse(fs.readFileSync(registryFile, 'utf8'));
  validateRegistry(registry);
  const receiptFile = path.join(dataDir, 'observations.jsonl');

  const record = async entry => {
    await fs.promises.mkdir(dataDir, { recursive: true, mode: 0o700 });
    const receipt = {
      schema: 'ourself.cloud-observation-receipt.v0.1',
      receipt_id: crypto.randomUUID(),
      occurred_at: new Date().toISOString(),
      service: 'OURSELF-CLOUD-SERVER-NETWORK',
      external_effect: false,
      ...entry
    };
    const handle = await fs.promises.open(receiptFile, 'a', 0o600);
    try {
      await handle.writeFile(JSON.stringify(receipt) + '\n');
      await handle.sync();
    } finally {
      await handle.close();
    }
    return receipt;
  };

  return http.createServer(async (req, res) => {
    const url = new URL(req.url || '/', 'http://127.0.0.1');
    if (req.method === 'GET' && url.pathname === '/healthz') {
      return json(res, 200, {
        service: 'OURSELF-CLOUD-SERVER-NETWORK',
        status: 'LIVE',
        implementation_status: 'EXPERIMENTAL_RUNTIME',
        ratification: 'NOT_GRANTED',
        deployment_scope: 'LOCAL_DEVICE',
        authority_plane: 'UNBOUND',
        mission_plane: 'READ_ONLY',
        execution_plane: 'DISABLED',
        registry_id: registry.registry_id,
        external_effect: false
      });
    }
    if (req.method === 'GET' && url.pathname === '/v1/runtimes') {
      const runtimes = await Promise.all(registry.runtimes.map(async runtime => {
        const started = Date.now();
        try {
          const response = await fetch(new URL(runtime.health_path, runtime.base_url), {
            headers: { accept: 'application/json' },
            signal: AbortSignal.timeout(1800)
          });
          const body = await response.text();
          return {
            runtime_id: runtime.runtime_id,
            service: runtime.service,
            network_boundary: runtime.network_boundary,
            trust_level: runtime.trust_level,
            authority_ceiling: runtime.authority_ceiling,
            observed_status: response.status,
            health: response.ok ? 'RESPONDING' : 'NON_HEALTHY',
            latency_ms: Date.now() - started,
            response_sha256: crypto.createHash('sha256').update(body).digest('hex')
          };
        } catch (error) {
          return {
            runtime_id: runtime.runtime_id,
            service: runtime.service,
            network_boundary: runtime.network_boundary,
            trust_level: runtime.trust_level,
            authority_ceiling: runtime.authority_ceiling,
            observed_status: null,
            health: 'UNREACHABLE',
            latency_ms: Date.now() - started,
            error_code: error.name === 'TimeoutError' ? 'PROBE_TIMEOUT' : 'CONNECT_FAILED'
          };
        }
      }));
      const receipt = await record({
        event: 'RUNTIME_REGISTRY_OBSERVED',
        registry_id: registry.registry_id,
        observed_runtime_count: runtimes.length,
        responding_runtime_count: runtimes.filter(r => r.health === 'RESPONDING').length
      });
      return json(res, 200, {
        registry_id: registry.registry_id,
        status: 'OBSERVATIONAL_ONLY',
        observed_at: receipt.occurred_at,
        runtimes,
        receipt
      });
    }
    if (req.method === 'GET' && url.pathname === '/v1/receipts') {
      let receipts = [];
      try {
        receipts = (await fs.promises.readFile(receiptFile, 'utf8'))
          .split('\n').filter(Boolean).map(line => JSON.parse(line));
      } catch (error) {
        if (error.code !== 'ENOENT') return json(res, 500, { error: 'RECEIPT_STORE_READ_FAILED' });
      }
      return json(res, 200, { count: receipts.length, receipts });
    }
    if (req.method === 'POST' && ['/v1/missions', '/v1/tasks', '/v1/capabilities/resolve'].includes(url.pathname)) {
      let body;
      try { body = await readBody(req); }
      catch (error) { return json(res, error.status || 400, { error: error.message || 'INVALID_REQUEST' }); }
      const receipt = await record({
        event: 'GOVERNED_OPERATION_DENIED',
        route: url.pathname,
        method: req.method,
        request_sha256: crypto.createHash('sha256').update(body).digest('hex'),
        decision: 'DENY',
        reason: 'AUTHORITY_PLANE_UNBOUND',
        dispatched: false
      });
      return json(res, 403, {
        error: 'AUTHORITY_ENVELOPE_REQUIRED',
        standing: 'NOT_ADMITTED',
        execution: 'DISABLED',
        receipt
      });
    }
    return json(res, 404, { error: 'ROUTE_NOT_FOUND' });
  });
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const registry = JSON.parse(fs.readFileSync(REGISTRY_FILE, 'utf8'));
  validateRegistry(registry);
  const server = createCloudNetworkServer();
  server.listen(PORT, HOST, () => console.log(JSON.stringify({
    event: 'OURSELF_CLOUD_NETWORK_LISTENING',
    host: HOST,
    port: PORT,
    registry: REGISTRY_FILE,
    status: 'EXPERIMENTAL_RUNTIME',
    authority_plane: 'UNBOUND',
    execution_plane: 'DISABLED'
  })));
  process.on('SIGTERM', () => server.close(() => process.exit(0)));
  process.on('SIGINT', () => server.close(() => process.exit(0)));
}
