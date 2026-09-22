# Photo collection

Registry: `lib/photos.ts` + `lib/photo-catalog.json`. `node scripts/prepare-photos.mjs` copies approved files unchanged from `asset/library/photo_framed/` into `public/library/photo_framed/`. Counts: food 4, outfit 7, window 6, happy 21, hug 5.

Apply `migrations/20260922_photo_album.sql` after existing progression/reward migrations. The server uses service-role-only `acquire_photo_album`, so a missing migration fails closed instead of awarding under old rules. No table additions. Rollback the server to its previous RPC; existing data remains.

Persistence remains in `user_progression`: unique `collected_photo_ids`, standard-only `daily_photo_total`, and `daily_photo_category_counts` for category/band limits. `hug: 1` with `progression_date` records daily successful hug drops, including duplicates. Existing KST reset clears daily eligibility, never ownership.

Food 1/day; outfit 2/day and 1/band; window 2/day and 1/band; happy 6/day; standard total 10/day. Food/window remain 35%; wardrobe guarantees the first eligible outfit per band, bypassing the standard 3-second throttle. Wardrobe does not fall back to happy; a no-drop opens its message instead. Happy (including drawer) is 35%. VIP + letter_22 + accepted pet rolls 35% until one successful hug drop/day. Hug randomly picks any of 5 photos (including owned), independent of standard limits. Existing atomic helper rewards unique photos +30; duplicate hug returns discovery with +0. Receipts prevent retry rerolls. Row locks serialize writes.

Photo tab reuses the collection modal. Standard locked slots never render their photo URL. Only owned hug cards append for VIP, in acquisition order, excluded from /38. The same native-dialog polaroid opens for discovery and rereading. Rereading never calls reward APIs. Hug closing emits speech after the discovery queue closes.

Guest behavior is unchanged: room works, no account photo/reward writes. Wardrobe front hotspot calls the existing wardrobe acquisition hook once per click, with UI SFX and an in-flight guard.

Validation: `node tests/photos.test.ts`, `node tests/collection.test.ts`, and `PHOTO_PGLITE_MODULE=<isolated PGlite module URL> node tests/photo-database.test.mjs`. The DB test executes real migrations in isolated PostgreSQL; remote application must be verified separately. Client action labels remain signals, not authoritative gameplay proof (existing trust boundary).

Remote validation (2026-09-22): 20260922_photo_album.sql applied to the configured Supabase project. photo-album-validation.sql passed and rolled back all fixtures. Service-role RPC access verified; local app displayed a real discovery popup after an accepted food interaction.



Photo prop update: apply `migrations/20260923_photo_props.sql` after the letter migration. Applied and confirmed in Supabase on 2026-09-22. Adds service-role-only `reset_progression_dev`; the HTTP route rejects production and requires same-origin + verified bearer identity. No reset was run on a real account. Letters reset clears letters, quota, VIP/special trackers and the earned mailbox. Collection reset additionally clears photos/category counters; purchased gifts remain. Coins reset clears only balance, preserving daily counters/receipts. Guest resets clear guest letters only.

First-click fix: `20260924_photo_first_click.sql` guarantees the first eligible drawer drop per KST band, stores `drawer:<band>` in the existing daily category counts, and bypasses throttling only for that guarantee. Later drawer rolls remain 35%; happy/global caps still apply. Dev reset now validates Origin against incoming Host rather than Next dev internal URL. `RUN_PHOTO_RESET_TEST=1 node --env-file=.env.local tests/photo-reset.integration.mjs` passed against a disposable Supabase account (removed afterward): first wardrobe/drawer +30, all three reset scopes, reacquisition, bad-origin denial.
