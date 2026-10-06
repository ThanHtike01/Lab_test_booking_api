# Quality Gate review

Reviewed on 2026-10-06 (Asia/Bangkok) against `quality_gate.md`, `curl_test_guide.md`, `exam_brief_en.md`, and `rubric_en.md`.

Public Base API URL: `https://campus-equipment-booking-api.thanhtike.workers.dev/api`.

The existing API already implemented POST/PATCH overlap prevention, PATCH self-exclusion, adjacent bookings, time-order validation, equipment validation, parameter-bound SQL, and JSON errors. No defect in those rules was found in this review. Improvements below address real verification and explanation gaps rather than pretending those rules were missing.

## Findings → action taken → evidence

| Area | Finding | Action taken | Evidence |
| --- | --- | --- | --- |
| Reliability / Accuracy | The first-version script mainly checked statuses and field types. It could pass even if a rejected PATCH altered a record, a successful PATCH returned stale values, or a failed POST inserted a row. | Added exact-value assertions, read-after-write checks, list membership, reads after rejected PATCHes, and a count of successful test bookings. | `scripts/quality_gate_checks.mjs`: checks 3–7 and 21–35, 45, 56–58 verify values/persistence. All assertions passed against the public API; actual output is in `TEST_EVIDENCE.md`. |
| Reliability | Existing evidence covered one duplicate POST and one PATCH overlap, but not enclosure/intersection shapes, adjacency on both sides, full-payload self-update, or changing equipment into a conflict. | Added identical, contained, containing, left-intersecting and right-intersecting cases for both POST and PATCH; both adjacency boundaries; full PATCH self-exclusion; different equipment and equipment-change checks. | Public checks 14–35: conflicts returned 409, adjacent POSTs returned 201, unchanged full PATCH returned 200, another equipment could overlap, and conflicting equipment change returned 409 without changing the record. |
| Delivery Quality / Purpose | README and API contract still said the Quality Gate was deferred and the curl guide absent, despite both now being supplied. This made the current submission instructions inaccurate. | Updated stage descriptions, linked this review, added the public guide/edge-case command and test-data prerequisites, and retained the local/public URL distinction. | Read `README.md` and `API_CONTRACT.md`; the documented `BASE_URL=... node scripts/quality_gate_checks.mjs` command was executed successfully against the public URL. |
| Reasoning / You Own It | The brief ownership notes did not explain the payload-reference 400 versus URL-resource 404 distinction, why checking only a start time misses enclosing overlaps, why conditional writes matter, or the concurrent partial-PATCH limitation. The AI log had no Quality Gate interaction yet. | Added concrete interval/status examples, required-versus-assumed behaviour, the reason for binding and conditional SQL, and an explicit concurrency limitation. Logged this interaction and provided student explanation notes; later linked the supplied manual-test screenshots. | `API_CONTRACT.md`, “Explain the decisions”; `AI_LOG.md`, Quality Gate interaction. Public checks demonstrate 400/404/409, enclosure detection, self-exclusion and literal storage of SQL-like text. |

## Verification performed

- `npm run typecheck`: passed, exit 0.
- `BASE_URL=https://campus-equipment-booking-api.thanhtike.workers.dev/api node scripts/quality_gate_checks.mjs`: all 63 HTTP checks and value assertions passed, exit 0. It executes all nine guide cases, then extra cases. Its five remaining test bookings were deleted with 204 responses; the guide booking was deleted earlier.
- Supplementary public curls checked malformed JSON and the booking list after cleanup; see their actual output in `TEST_EVIDENCE.md`.
- Read all SQL in `src/index.ts`: request-derived values use placeholders and `.bind(...)`; there is no request interpolation or concatenation. SQL-like strings were also tested as equipment IDs, path IDs, and borrower names. These runtime examples supplement source inspection; they are not a comprehensive security audit.
- The schema has a foreign key and `CHECK (startAt < endAt)`. Fixed-width UTC normalization supports its text comparisons. Invalid/missing data, nonexistent equipment, impossible dates, equal and reversed times, empty PATCH, null/array payloads, blank/type-invalid fields, unknown fields/routes, and missing GET/PATCH/DELETE resources were exercised.
- SHA-256 of `src/index.ts` is unchanged from the saved pre-review version: `71b4bfa9ff24c62f4e39fb439c22b944c1262bf6b903afa7cb362badd3015f11`. Runtime code, schema and deployment configuration were not changed. No redeploy was necessary; tests used the already deployed public API.

No load/concurrency test or simulated database-failure test was run. The conditional statements protect overlap checks within a write; simultaneous partial updates to one booking may overwrite each other's non-conflicting field changes. Optimistic locking is outside the required simple contract and was not added.

## First-version snapshot

Saved the existing implementation before review edits in `snapshots/before-quality-gate.tar.gz`.
Archive SHA-256: `8907405f84eb71d5a48b238c915c4021df954c7598a58135b14478fd2df2a284`.

This archive is a snapshot made at the start of this review. It is not evidence of the brief's minute-30 commit/screenshot. The student reported that the original first-version screenshot was missed. The later reconstructed commit is recorded below.

## Submission summary

The six submission deliverables and test evidence are complete.

- [x] Public manual curl evidence is supplied: 12 screenshots showing 15 requests, collected in `output/pdf/API_Test_Screenshot_Evidence.pdf` and indexed in `TEST_EVIDENCE.md`.
- [x] Success, validation, not-found and conflict cases are covered, including adjacency, PATCH self-exclusion and unchanged data after a rejected update.
- [x] Plain-language explanation notes for status codes, overlap, PATCH, timestamps, binding, the foreign key and review improvements are in the final section of `AI_LOG.md`.

Technical checks passed. No runtime changes were needed for submission preparation.

## Reconstructed checkpoint and restoration

After completing this review, the student reported missing the first-version
screenshot. The agent saved the reviewed version externally and restored the
review-start snapshot. The student committed that reconstruction as
`6e62f19a140f4cc28d984d64e9ab7e32dc75a873` on 2026-10-06 at
14:34:51 (Asia/Bangkok). After the student said "committed", the agent restored
the reviewed version while keeping that commit intact.

This is a later reconstructed checkpoint, not evidence of a minute-30 commit
or screenshot. The original snapshot requirement remains a matter to resolve
honestly with the instructor. The supplied manual-test screenshots are now recorded above.
