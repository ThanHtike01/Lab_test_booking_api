# API contract

Source of truth: `exam_brief_en.md` and `rubric_en.md`. Reviewed using `quality_gate.md` and `curl_test_guide.md`; endpoint behaviour is unchanged from the first version.

Public Base API URL (submission): `https://campus-equipment-booking-api.thanhtike.workers.dev/api`

Local Base API URL: `http://localhost:8787/api`

| Method | Path | Success response |
| --- | --- | --- |
| GET | `/api/equipment` | 200, array of equipment |
| GET | `/api/bookings` | 200, array of bookings (possibly empty) |
| GET | `/api/bookings/:id` | 200, one booking |
| POST | `/api/bookings` | 201, created booking |
| PATCH | `/api/bookings/:id` | 200, updated booking |
| DELETE | `/api/bookings/:id` | 204, no response body |

Equipment objects contain `id`, `name`, and `location`. The migration seeds `eq-1` and `eq-2`.

## Request and response

POST requires all five fields. PATCH accepts any nonempty subset of these same fields; omitted fields retain their current values. Send a JSON object:

```json
{
  "equipmentId": "eq-1",
  "borrowerName": "Somchai Jaidee",
  "startAt": "2026-10-20T09:00:00.000Z",
  "endAt": "2026-10-20T11:00:00.000Z",
  "purpose": "Class presentation"
}
```

A booking response contains exactly these five fields plus a generated string `id`:

```json
{
  "id": "<generated UUID>",
  "equipmentId": "eq-1",
  "borrowerName": "Somchai Jaidee",
  "startAt": "2026-10-20T09:00:00.000Z",
  "endAt": "2026-10-20T11:00:00.000Z",
  "purpose": "Class presentation"
}
```

## Errors and assumptions

All errors use `{ "error": "An understandable message" }`.

- 400: malformed JSON, non-object body, missing POST fields, empty PATCH, unknown fields, non-string/blank fields, invalid timestamp, unknown `equipmentId`, or `startAt >= endAt`.
- 404: booking ID does not exist (GET, PATCH, DELETE); unknown route.
- 409: requested time overlaps another booking for the same equipment (POST or PATCH).
- 500: unexpected server/database error, still using the JSON error format.

The brief does not specify PATCH omission semantics or time boundary handling; the assumptions here make them explicit. Strings are trimmed. Timestamps must be valid UTC ISO strings in `YYYY-MM-DDTHH:mm:ssZ` or `YYYY-MM-DDTHH:mm:ss.sssZ` form and are stored/returned with three millisecond digits. Impossible calendar dates are rejected. No future-only rule is imposed.

Intervals include the start and exclude the end. A booking ending at 11:00 can be followed by one starting at 11:00. Overlap means `existing.startAt < requested.endAt AND existing.endAt > requested.startAt`. PATCH checks the merged booking and excludes its own ID. Other equipment can be booked at the same time.

Conflict checking is part of the INSERT/UPDATE SQL statement, so checking and writing happen together. Every request-derived SQL value is passed to `.bind(...)` using `?` placeholders.

## Explain the decisions (ownership practice)

- **400** means the supplied booking data is invalid. An unknown `equipmentId` is an invalid reference in the payload. **404** means the booking identified in the URL is absent. PATCH looks up that booking first, so a missing booking returns 404 even if its payload is also invalid. **409** means otherwise valid data conflicts with another reservation. **204** means deletion succeeded and there is no response body.
- For an existing booking **[12:00,14:00)**, a request **[13:00,15:00)** overlaps because `12:00 < 15:00` and `14:00 > 13:00`. A request **[14:00,15:00)** does not: `14:00 > 14:00` is false. A request enclosing the whole existing interval also conflicts; checking only the new start would miss it.
- PATCH merges supplied fields into the current booking before checking time order, equipment, and conflicts. `id <> ?` excludes only that booking, not other bookings for the same equipment. A purpose-only update must still succeed while retaining the original equipment and times.
- `WHERE NOT EXISTS` guards the INSERT/UPDATE itself. A separate SELECT followed by an unconditional write could allow two requests to pass the check before either wrote. The current statement keeps the conflict decision and write together. This review does not claim a load/concurrency test was executed.
- Fixed-width UTC strings make chronological and SQL text comparison agree. The format restrictions, partial PATCH support, trimming, rejecting unknown fields, and allowing adjacent bookings are documented assumptions; the brief mandates the route names, fields, status codes, equipment existence, time order, and absence of overlaps.
- The foreign key ensures each booking refers to equipment. It does not detect time conflicts. `?` placeholders and `.bind(...)` keep values separate from SQL syntax; an apostrophe in a name is stored as text.

Scope limitation: simultaneous partial updates to the same booking can overwrite each other's changes because PATCH reads the current row before writing merged values. Conflict prevention still occurs inside the write statement. Versioning/optimistic locking is outside this simple course contract; this review does not claim it is implemented.

These notes are prompts for practice, not evidence that the student understands them. Explain one concrete example of each in your own words in `AI_LOG.md`.

## Simple schema / ERD

```text
equipment (1) ───────── (many) bookings
id TEXT PK                     id TEXT PK
name TEXT                      equipmentId TEXT FK → equipment.id
location TEXT                  borrowerName TEXT
                               startAt TEXT (normalized UTC)
                               endAt TEXT (normalized UTC)
                               purpose TEXT
```

All columns are NOT NULL. `CHECK (startAt < endAt)` supports the time rule. The foreign key prevents orphan bookings. See `migrations/0001_initial.sql`. Equipment has no write endpoints in this version.
