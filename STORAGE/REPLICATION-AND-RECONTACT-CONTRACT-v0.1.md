# ÆTHERNET Runtime Storage Replication and Recontact Contract v0.1

ÆTHERNET is the transport and recontact plane. It carries object transfer and evidence exchange; it is not the canonical store, custodian, authority, or witness.

## Replication protocol

1. Sender resolves an admitted DATASELF envelope and exact payload bytes.
2. Sender emits a transfer proposal binding content key, byte count, envelope digest, journal checkpoint, jurisdiction, retention, destination adapter registration, and nonce.
3. Destination validates identity, authority, jurisdiction, capacity, and adapter admission before accepting bytes.
4. Destination writes through its own admitted adapter using immutable no-replace publication.
5. Destination reads the object back and recomputes digest and byte count.
6. Destination issues a receiver-side persistence receipt with its own runtime, host, failure-domain, adapter, durability, and storage-generation identity.
7. A later independent recontact reads from the destination and verifies the same bytes.
8. Independent custody and witness states are evaluated separately.

## Failure rules

No acknowledgement before receiver-side read-back. No sender receipt substituted for receiver receipt. No retry may overwrite content. Duplicate key with different bytes quarantines the object and transfer. Interrupted transfer is resumable only from verified chunks or the full immutable payload. Transport encryption does not replace storage encryption or key custody.

## Continuity

Replication policies name required failure-domain separation, jurisdictions, durability class, retention, and restore-test frequency. Two paths terminating in the same host, disk, account, administrator, or key domain are not independent merely because their network routes differ.

## Current state

Transport contract only. No replication endpoint, bucket, key, tunnel, or production data movement is configured by this artifact.
