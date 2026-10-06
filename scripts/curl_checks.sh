#!/usr/bin/env bash
# Run with: bash scripts/curl_checks.sh (API must already be running).
set -euo pipefail
BASE_URL=${BASE_URL:-http://localhost:8787/api}
response_file=$(mktemp)
trap 'rm -f "$response_file"' EXIT

# Print actual responses; stop if the expected status or JSON shape differs.
check() {
  local label=$1 expected=$2
  shift 2
  local status
  status=$(curl -sS -o "$response_file" -w '%{http_code}' "$@")
  printf '\n%s: HTTP %s (expected %s)\n' "$label" "$status" "$expected"
  cat "$response_file"
  printf '\n'
  test "$status" = "$expected"
  node --input-type=module - "$response_file" "$status" <<'JS'
import { readFileSync } from 'node:fs';
const body = readFileSync(process.argv[2], 'utf8');
const status = Number(process.argv[3]);
if (status === 204) {
  if (body !== '') throw new Error('204 must have an empty body');
} else {
  const value = JSON.parse(body);
  if (status >= 400) {
    if (typeof value.error !== 'string' || Object.keys(value).length !== 1) throw new Error('Invalid error shape');
  } else {
    for (const row of Array.isArray(value) ? value : [value]) {
      const keys = 'equipmentId' in row
        ? ['id', 'equipmentId', 'borrowerName', 'startAt', 'endAt', 'purpose']
        : ['id', 'name', 'location'];
      if (!keys.every(key => typeof row[key] === 'string')) throw new Error('Invalid response shape');
    }
  }
}
JS
}

get_id() {
  node --input-type=module - "$response_file" <<'JS'
import { readFileSync } from 'node:fs';
console.log(JSON.parse(readFileSync(process.argv[2], 'utf8')).id);
JS
}

check 'List equipment' 200 "$BASE_URL/equipment"
check 'List bookings' 200 "$BASE_URL/bookings"
booking='{"equipmentId":"eq-1","borrowerName":"Somchai Jaidee","startAt":"2026-10-20T09:00:00.000Z","endAt":"2026-10-20T11:00:00.000Z","purpose":"Class presentation"}'
check 'Create booking' 201 -X POST "$BASE_URL/bookings" -H 'Content-Type: application/json' -d "$booking"
BOOKING_ID=$(get_id)
check 'Read booking' 200 "$BASE_URL/bookings/$BOOKING_ID"
check 'Update without self-conflict' 200 -X PATCH "$BASE_URL/bookings/$BOOKING_ID" -H 'Content-Type: application/json' -d '{"purpose":"Updated presentation"}'
check 'Overlapping POST' 409 -X POST "$BASE_URL/bookings" -H 'Content-Type: application/json' -d "$booking"
check 'Adjacent booking is allowed' 201 -X POST "$BASE_URL/bookings" -H 'Content-Type: application/json' -d '{"equipmentId":"eq-1","borrowerName":"Second borrower","startAt":"2026-10-20T11:00:00.000Z","endAt":"2026-10-20T12:00:00.000Z","purpose":"Next class"}'
SECOND_ID=$(get_id)
check 'Overlapping PATCH' 409 -X PATCH "$BASE_URL/bookings/$BOOKING_ID" -H 'Content-Type: application/json' -d '{"endAt":"2026-10-20T11:30:00.000Z"}'
check 'Invalid time order' 400 -X PATCH "$BASE_URL/bookings/$BOOKING_ID" -H 'Content-Type: application/json' -d '{"endAt":"2026-10-20T08:00:00.000Z"}'
check 'Missing POST fields' 400 -X POST "$BASE_URL/bookings" -H 'Content-Type: application/json' -d '{}'
check 'Unknown equipment' 400 -X PATCH "$BASE_URL/bookings/$BOOKING_ID" -H 'Content-Type: application/json' -d '{"equipmentId":"missing-equipment"}'
check 'Impossible calendar date' 400 -X PATCH "$BASE_URL/bookings/$BOOKING_ID" -H 'Content-Type: application/json' -d '{"startAt":"2026-02-30T09:00:00.000Z"}'
check 'Malformed JSON' 400 -X POST "$BASE_URL/bookings" -H 'Content-Type: application/json' -d '{'
check 'Booking not found GET' 404 "$BASE_URL/bookings/missing-booking"
check 'Booking not found PATCH' 404 -X PATCH "$BASE_URL/bookings/missing-booking" -H 'Content-Type: application/json' -d '{"purpose":"Unknown"}'
check 'Delete booking' 204 -X DELETE "$BASE_URL/bookings/$BOOKING_ID"
check 'Deleted booking not found' 404 "$BASE_URL/bookings/$BOOKING_ID"
check 'Booking not found DELETE' 404 -X DELETE "$BASE_URL/bookings/$BOOKING_ID"
check 'Delete adjacent booking' 204 -X DELETE "$BASE_URL/bookings/$SECOND_ID"
printf '\nAll curl checks passed.\n'
