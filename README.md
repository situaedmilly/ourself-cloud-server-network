# OURSELF Cloud Server Network

Governed continuity fabric for missions, runtimes, capabilities, evidence, recovery, and execution across computational realms.

## Runtime v0.1

This repository now contains an experimental, local-only observational runtime.

- GET /healthz: live process and governance-state report.
- GET /v1/runtimes: probe the pinned loopback runtime registry and append an observation receipt.
- GET /v1/receipts: read the append-only observation ledger.
- POST /v1/missions, /v1/tasks, /v1/capabilities/resolve: fail closed with 403 AUTHORITY_ENVELOPE_REQUIRED.

The runtime binds only to 127.0.0.1:49330. Registry endpoints must also be loopback. No remote runtime discovery, arbitrary URL probing, execution dispatch, authority issuance, or promotion is implemented.

## Governance boundary

This runtime does not ratify the Cloud Server Network specification or create constitutional authority.

- Ratification: NOT_GRANTED
- Authority plane: UNBOUND
- Mission plane: READ_ONLY
- Execution plane: DISABLED
- Deployment scope: LOCAL_DEVICE
- Production readiness: NOT_CLAIMED

The runtime is an operational diagnostic and evidence surface, not the complete governed continuity fabric.

## Run

Node.js 22 or newer. No third-party dependencies.

    npm test
    npm start
    curl http://127.0.0.1:49330/healthz
    curl http://127.0.0.1:49330/v1/runtimes
