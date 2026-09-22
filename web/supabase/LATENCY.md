# Progression latency migration

Apply `migrations/20260926_progression_latency.sql` before the matching web release.
The old deployed web client remains compatible: RPC signatures and result fields are preserved.
This migration has been tested in isolated PostgreSQL; it is not automatically applied by a web build.

- Every existing receipt moves to `progression_receipts`; no history expires or is deleted.
- The account row retains only `photo_last_event_at` throttle metadata.
- Existing writers remain atomic. The trigger archives receipts in the same transaction.
- Dedupe readers query the `(user_id, receipt_key)` primary key.
- Gift results add the committed progression snapshot, avoiding a second read.
- Receipt table/helper are service-role-only; authenticated clients cannot access them.

Validation: `tests/latency-database.test.mjs` covers backfill, old/new replay,
payload mismatch rejection, day rollover, purchases, letters/photos, RLS and reruns.
Set `PHOTO_PGLITE_MODULE` to an isolated `@electric-sql/pglite` installation and run
`node --experimental-strip-types tests/latency-database.test.mjs`.

Rollback if required: in one transaction, lock `user_progression` against writers,
drop only `archive_progression_receipts` trigger, merge each user's ledger payloads
back into `reward_receipts` (preserving `photo_last_event_at`), and restore the
receipt checks in the four RPCs from `progression_receipt(p_user_id,receipt)` to
their original JSON lookups. Keep `progression_receipts` and its history intact.
Do not reapply older whole migrations: they can overwrite unrelated rules/admin
time-band support. The extra gift response field is backward compatible and can remain.
