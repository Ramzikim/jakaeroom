# Account progression

Apply migrations/20260915_progression.sql before enabling progression consumers.
Existing profile/auth tables and guest flow are unchanged. GET /api/progression
verifies the existing Bearer token, creates the user's row if needed, resets KST
counters, and returns persistent state. It never accepts a client userId.

Server actions use progressionFor(verifiedUser.id). Never pass arbitrary client
amounts, item IDs, special-letter flags, prices or event IDs through unchecked.
Validate collection eligibility/catalog membership and generate stable event IDs
from the authoritative event. Only service_role can execute mutations; authenticated
users can SELECT their own row through RLS, but cannot mint coins with direct writes.

Defaults: zero balance/counters, empty collections, KST date, passive timestamp now.
ensure/load do not award coins automatically. Call addHeartCoins(30,{kind:'daily_login'})
from a verified login event when wiring rewards. Passive calls must be driven by
verified active presence; the database gates five minutes and caps 120/day, with no
catch-up payments. Refreshing does not restart the stored timer. Counters reset on
first progression access after KST midnight; collections, balance and receipts remain.

Collection calls return newlyCollected and delta. Duplicate item IDs pay zero.
spendHeartCoins(amount,stableEventId) returns insufficient_funds without a debit.
Retries reuse the same event ID; changing an event's amount/category is rejected.
Gift ownership and purchase markers do not charge coins or imply each other. A future
shop must combine price debit and ownership in one database transaction before launch.
No shop, collection UI, guest persistence, or room reward wiring is added here.

Rollback: disable the new progression consumer/route and keep the table/data intact.
The migration is additive; previous app versions continue working. Do not drop the
progression table to roll back application code. Apply this migration once via the
normal Supabase migration history.

Applied to kyvvhnrvmzatzjxbyojw through the authenticated Supabase SQL editor on 2026-09-15. progression-validation.sql passed against the real database; fixtures were rolled back. Local build, guest room HTTP 200 and unauthenticated progression HTTP 401 passed. Local authenticated HTTP testing requires SUPABASE_SERVICE_ROLE_KEY (not present in local .env.local); the existing deployment supplies this separately. No web deployment was performed by this migration task.
