import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { createCloudNetworkServer } from '../runtime/server.mjs';

const fixtureRegistry = runtimes => ({ registry_id: 'TEST-REGISTRY', runtimes: runtimes || [] });

async function withServer(t, registry = fixtureRegistry([])) {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'ourself-cloud-network-'));
  const registryFile = path.join(root, 'registry.json');
  await fs.writeFile(registryFile, JSON.stringify(registry));
  const server = createCloudNetworkServer({ registryFile, dataDir: path.join(root, 'data') });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const base = 'http://127.0.0.1:' + server.address().port;
  t.after(async () => {
    await new Promise(resolve => server.close(resolve));
    await fs.rm(root, { recursive: true, force: true });
  });
  return base;
}

test('health reports live experimental runtime without ratifying or enabling execution', async t => {
  const base = await withServer(t);
  const response = await fetch(base + '/healthz');
  const body = await response.json();
  assert.equal(response.status, 200);
  assert.equal(body.status, 'LIVE');
  assert.equal(body.ratification, 'NOT_GRANTED');
  assert.equal(body.authority_plane, 'UNBOUND');
  assert.equal(body.execution_plane, 'DISABLED');
});

test('runtime registry returns observed loopback health and a durable receipt', async t => {
  const fake = await withServer(t);
  const runtime = {
    runtime_id: 'LOCAL-TEST', service: 'test', base_url: fake, health_path: '/healthz',
    network_boundary: 'LOCAL_DEVICE', trust_level: 'UNVERIFIED', authority_ceiling: 'NONE'
  };
  const base = await withServer(t, fixtureRegistry([runtime]));
  const response = await fetch(base + '/v1/runtimes');
  const body = await response.json();
  assert.equal(body.runtimes[0].health, 'RESPONDING');
  assert.equal(body.runtimes[0].trust_level, 'UNVERIFIED');
  assert.equal(body.receipt.event, 'RUNTIME_REGISTRY_OBSERVED');
  const receipts = await (await fetch(base + '/v1/receipts')).json();
  assert.equal(receipts.count, 1);
});

test('mission, task, and capability writes fail closed and produce no-dispatch receipts', async t => {
  const base = await withServer(t);
  for (const route of ['/v1/missions', '/v1/tasks', '/v1/capabilities/resolve']) {
    const response = await fetch(base + route, {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ mission_id: 'M-1', task_id: 'T-1' })
    });
    const body = await response.json();
    assert.equal(response.status, 403);
    assert.equal(body.error, 'AUTHORITY_ENVELOPE_REQUIRED');
    assert.equal(body.execution, 'DISABLED');
    assert.equal(body.receipt.dispatched, false);
  }
  const receipts = await (await fetch(base + '/v1/receipts')).json();
  assert.equal(receipts.count, 3);
});

test('runtime registry refuses non-loopback endpoints', async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'ourself-cloud-network-'));
  const registryFile = path.join(root, 'registry.json');
  await fs.writeFile(registryFile, JSON.stringify(fixtureRegistry([{
    runtime_id: 'BAD', service: 'bad', base_url: 'https://example.com', health_path: '/',
    network_boundary: 'PUBLIC', trust_level: 'UNVERIFIED', authority_ceiling: 'NONE'
  }])));
  assert.throws(() => createCloudNetworkServer({ registryFile, dataDir: path.join(root, 'data') }), /MUST_BE_LOOPBACK/);
  await fs.rm(root, { recursive: true, force: true });
});
