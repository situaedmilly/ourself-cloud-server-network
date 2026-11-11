# OURDATASELFBASE Continuity Adapter Specification v1

```
class: SPECIFICATION
status: FOUNDER_AUTHORIZED_FOR_DRAFTING
ratification: NOT_GRANTED
implementation_status: NOT_IMPLEMENTED
deployment_status: NOT_DEPLOYED
promotion_boundary: NOT_CROSSED
```

This is an additive specification. It does not alter or promote the existing Cloud Server Network Runtime Specification v0. No endpoint, server, runtime, or authority is claimed live by this document.

## 1. Purpose and responsibility

Define how OURSELFCLOUDSERVERNETWORK coordinates continuity for OURDATASELFBASE without becoming its canonical data store or authority root.

- OURDATASELFBASE governs object identity, envelopes, lineage, custody policy, and admissibility.
- ALTONUMBUSELF identifies memory instances and memory-object contracts.
- SELFSERVE provides bounded storage/recontact implementations.
- OURPROCESSORSELF validates envelopes and supplied transition journals.
- SELFPI supplies identity, jurisdiction, admission, attestation, and witness decisions.
- OURSELFCLOUDSERVERNETWORK routes, replicates, recontacts, and coordinates recovery.
- The Mission Kernel preserves mission continuity; it is not the data-object store.
- Cognitive Commons projects governed state to humans and agents; it is not the canonical ledger.

The network cannot create authority from reachability, availability, model confidence, replication count, or agent consensus.

## 2. Data continuity packets

The minimum data-plane packet set is:

- `DATA_OBJECT_DESCRIPTOR`: object ID, reality/instance, envelope digest, payload digest, byte count, classification, jurisdiction, current sequence, and source locator.
- `DATA_REPLICA_REQUEST`: exact object/envelope digest, requested destination, retention class, and admission reference.
- `DATA_REPLICA_RECEIPT`: destination, stored object digest, byte count, envelope digest, journal head, signer identity, and evidence references.
- `DATA_RECONTACT_PROOF`: later retrieval result, exact payload digest, envelope digest, journal head, verifier identity, and timestamp.
- `DATA_CONTINUITY_EVENT`: source/destination identity, transition ID, prior and resulting journal heads, replication/recontact state, and failure reason.
- `WRITER_LEASE_ENVELOPE`: authority-issued writer epoch, single-writer scope, object/reality scope, start/expiry, fencing token, and revocation reference.
- `RECOVERY_CHECKPOINT`: last verified journal event, object sequence, replica set, unresolved transitions, interrupted executor, and safe resume point.

Every packet carries a version, producer, consumer, provenance, integrity digest, jurisdiction, retention class, authority/admission references where required, and an expected receipt.

## 3. Canonical replication law

1. Replicate payload bytes by their exact SHA-256 content key.
2. Replicate the envelope as a separate immutable object.
3. Replicate the append-only transition journal without rewriting event order.
4. Verify object digest, byte count, envelope digest, journal sequence, and journal head at the destination.
5. Recontact from a later runtime or independent route.
6. Append a replica receipt and a recontact proof as separate evidence.
7. Treat a replica as a candidate until its jurisdiction, custody, admission, and witness predicates resolve.

Replica count is not independence. Two replicas controlled by the same operator are redundancy, not independent custody. A successful copy is not a verified replica until read-back and recontact match.

## 4. Single-writer and failover law

The v1 network must not permit multi-writer failover.

A write-capable runtime requires a fresh, authority-issued writer lease bound to:
- one reality and object scope;
- one admitted writer identity;
- one monotonically increasing writer epoch;
- one fencing token;
- a bounded validity interval;
- the exact expected preimage digest and object sequence.

If lease authority, clock confidence, or fencing state is unavailable, all replicas become read-only. A network partition must never cause two nodes to accept writes independently. No last-writer-wins merge is permitted.

Read failover may select another replica only after identity, jurisdiction, payload digest, envelope digest, and journal head match. If a replica is stale, return it as explicitly stale/unverified; never silently present it as current.

## 5. Recovery and continuity

A recovery checkpoint records:
- last verified transition event and journal head;
- last verified object sequence and digest;
- replica locations and verification state;
- pending or interrupted transitions;
- operations whose effects are uncertain;
- the next safe resume point;
- required human review.

An executor loss yields INTERRUPTED or DEGRADED state. It does not authorize replay. Before resumption, the runtime must recontact the last verified state and reconcile any incomplete transition using the transition ID, nonce, preimage, and event chain.

## 6. Failure behavior

- No authority lease: read-only.
- Duplicate writer epoch or stale fencing token: reject.
- Reused nonce or transition ID: reject/quarantine.
- Broken journal chain: quarantine the affected segment and all dependent projections.
- Digest or byte-count mismatch: reject replica and preserve evidence.
- Missing recontact proof: replica remains unverified.
- Unknown jurisdiction or custody: no cross-boundary transfer.
- No independent witness: no promotion to WITNESSED or REALISELF.
- No safe resume point: pause for human review.

## 7. Non-SQL persistence constraint

The continuity plane transports content-addressed objects, envelopes, and append-only journals. It does not require a relational database. Any index or routing projection is derived, rebuildable, and non-authoritative. No SQL or Supabase service may become canonical through an implementation shortcut.

## 8. Runtime acceptance tests

The future runtime must prove, in both directions:
1. source object → destination replica → exact byte read-back;
2. source journal → destination journal → exact head and sequence continuity;
3. source writer epoch → destination fencing rejection of stale writer;
4. active runtime loss → read-only failover → later recontact;
5. duplicate transition replay → rejection;
6. incomplete transition → recovery checkpoint → safe resumption;
7. jurisdiction mismatch → transfer refusal;
8. independent witness verification → separately admitted promotion.

A passing health check or successful HTTP response is insufficient.

## 9. Current realization state

```
SPECIFICATION: PRESENT
RUNTIME_IMPLEMENTATION: NOT_IMPLEMENTED
DEPLOYMENT: NOT_DEPLOYED
SELFSERVE_ADAPTER_BINDING: NOT_ADMITTED
WRITER_LEASE_AUTHORITY: NOT_IMPLEMENTED
REPLICA_RECONTACT_AUTOMATION: NOT_IMPLEMENTED
INDEPENDENT_CUSTODY: NOT_ESTABLISHED
INDEPENDENT_WITNESS: NOT_ESTABLISHED
REALISELF: FALSE
```

This specification may be reviewed and ratified separately. Drafting authority does not constitute ratification, implementation, deployment, or promotion.
