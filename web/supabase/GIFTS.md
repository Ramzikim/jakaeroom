# Gift backend

Validation status: registry/price/letter tests, existing behavior/profile/content tests, TypeScript and production build passed. `gift-validation.sql` contains transactional database assertions but has not been executed; remote migration application awaits approval. Actual concurrency/persistence and authenticated integration are not yet verified.

`lib/gifts.ts` is the sole gift/price registry: seven gifts, no visual dependencies. `lib/server/gifts.ts` exposes `giftsFor(verifiedUserId)`; pass null for guests. No endpoint, room UI, TV selection, asset or shop rendering is added.

Apply `migrations/20260915_gifts.sql` after the progression migration. Only service_role can execute it. The existing row lock encloses spending and both ownership markers. Catalog and regular-letter IDs come from trusted server imports, never request data. Prices remain centralized in TypeScript. Wrong route/band, unknown, owned and unaffordable gifts return structured failures. The actual KST clock wins over caller-supplied bands (06:00 / 16:00 / 18:30 / 23:00).

Ownership uses existing `owned_gift_ids`, `purchased_gift_ids`, balance and reward receipts. Pity uses additive `homeshopping_date`, `homeshopping_daily_state` with per-band `viewCount`, `shown`, `lastSeenGiftId`, and deduplication event IDs. Old daily reset logic preserves these columns. Gift helpers lazily reset pity on a new KST day, never ownership. Raw event IDs are omitted from helper responses.

Future TV flow: ask `shouldForceHomeshopping(band)` before the upcoming view, then `recordEligibleTvView(band,stableEventId)` once per eligible view, then `markHomeshoppingShown(band)` if selected. The first three recorded misses do not force; the fourth does. Reusing a view ID does not increment twice. After a showing or ownership no forcing is needed that day. Random 20–25% selection belongs to future TV integration and is intentionally not wired here.

`grantGift` is restricted to verified letter completion; it cannot bypass paid routes. `collectLetter` reevaluates the free mailbox after collection, including retries. Direct SQL imports/older collection callers must call `evaluateLetterCompletionGift` after syncing. A transient gift-grant failure never rolls back an already-collected letter; reevaluation repairs it. Regular letters are taken from the existing 28-letter registry; special letters do not count.

Guest mutations return `authentication_required`; missing DB configuration returns `unavailable`. Query convenience helpers return false/empty on failure; `load()` retains the structured reason. No login wall is introduced.

Rollback: revert the helper integration and drop only `gift_gameplay(uuid,text,text,text,uuid,text,jsonb,text[])`. Retain progression columns/data to preserve ownership and balances. Do not roll back purchases by deleting records.
