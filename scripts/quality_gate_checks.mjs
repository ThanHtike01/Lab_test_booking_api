// Node.js + curl only. Run against a database with the guide's time slots free.
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';

const base = process.env.BASE_URL || 'http://localhost:8787/api';
const createdIds = new Set();
let requests = 0;

function request(label, method, path, expected, payload) {
  const args = ['-sS', '--max-time', '20', '-X', method, `${base}${path}`,
    '-w', '\n%{http_code}\n%{content_type}'];
  if (payload !== undefined) args.push('-H', 'Content-Type: application/json', '-d', JSON.stringify(payload));
  const result = spawnSync('curl', args, { encoding: 'utf8' });
  assert.equal(result.status, 0, result.stderr);
  const lines = result.stdout.split('\n');
  const contentType = lines.pop();
  const status = Number(lines.pop());
  const raw = lines.join('\n');
  requests++;
  console.log(`${requests}. ${label}: HTTP ${status} (expected ${expected})\n${raw || '<empty body>'}`);
  // Track our own inserts even when a later assertion fails, for cleanup.
  const body = raw ? JSON.parse(raw) : null;
  if (method === 'POST' && status === 201 && body?.id) createdIds.add(body.id);
  assert.equal(status, expected, label);
  if (status === 204) assert.equal(raw, '');
  else assert.match(contentType, /^application\/json\b/);
  if (status >= 400) {
    assert.deepEqual(Object.keys(body), ['error']);
    assert.equal(typeof body.error, 'string');
    assert.ok(body.error.length > 0);
  }
  if (method === 'DELETE' && status === 204) createdIds.delete(path.split('/').pop());
  return body;
}

function verifyBooking(actual, expected) {
  assert.equal(typeof actual.id, 'string');
  assert.ok(actual.id.length > 0);
  assert.deepEqual(actual, { id: actual.id, ...expected });
  console.log('  Exact booking fields and values verified.');
}

const initial = {
  equipmentId: 'eq-1', borrowerName: 'Somchai Jaidee',
  startAt: '2026-10-20T09:00:00.000Z', endAt: '2026-10-20T11:00:00.000Z',
  purpose: 'Class presentation',
};
const updated = { ...initial, startAt: '2026-10-20T12:00:00.000Z',
  endAt: '2026-10-20T14:00:00.000Z', purpose: 'Updated class presentation' };

console.log(`Quality Gate curl checks\nBase API URL: ${base}`);
try {
  // The nine cases and payloads from curl_test_guide.md, in guide order.
  const equipment = request('Guide 1: list equipment', 'GET', '/equipment', 200);
  assert.ok(Array.isArray(equipment) && equipment.length >= 2);
  for (const id of ['eq-1', 'eq-2']) assert.ok(equipment.some(row => row.id === id));
  assert.ok(equipment.every(row => ['id', 'name', 'location'].every(key => typeof row[key] === 'string')));
  assert.ok(Array.isArray(request('Guide 2: list bookings', 'GET', '/bookings', 200)));
  const booking = request('Guide 3: create', 'POST', '/bookings', 201, initial);
  const path = `/bookings/${booking.id}`;
  verifyBooking(booking, initial);
  assert.deepEqual(request('Guide 4: read', 'GET', path, 200), booking);
  const changed = request('Guide 5: full PATCH', 'PATCH', path, 200, updated);
  verifyBooking(changed, updated);
  assert.deepEqual(request('Verify PATCH persisted', 'GET', path, 200), changed);
  assert.ok(request('Verify booking appears in list', 'GET', '/bookings', 200)
    .some(row => JSON.stringify(row) === JSON.stringify(changed)));
  request('Guide 6: invalid POST range', 'POST', '/bookings', 400, {
    ...initial, startAt: '2026-10-21T11:00:00.000Z', endAt: '2026-10-21T09:00:00.000Z', purpose: 'Invalid time range test',
  });
  request('Guide 7: contained POST overlap', 'POST', '/bookings', 409, {
    ...updated, borrowerName: 'Suda Dee', startAt: '2026-10-20T12:30:00.000Z', endAt: '2026-10-20T13:30:00.000Z', purpose: 'Conflict test',
  });
  request('Guide 8: missing booking', 'GET', '/bookings/not-found', 404);
  request('Guide 9: delete', 'DELETE', path, 204);
  request('Verify deleted booking is absent', 'GET', path, 404);

  // Additional overlap, validation, persistence and binding checks.
  const anchor = request('Edge: create anchor [12,14)', 'POST', '/bookings', 201, updated);
  const anchorPath = `/bookings/${anchor.id}`;
  const shapes = [
    ['identical', '12:00', '14:00'], ['contained', '12:30', '13:30'],
    ['containing', '11:00', '15:00'], ['left intersection', '11:00', '12:30'],
    ['right intersection', '13:30', '15:00'],
  ];
  const at = time => `2026-10-20T${time}:00.000Z`;
  for (const [label, start, end] of shapes) {
    request(`Edge: POST ${label} overlap`, 'POST', '/bookings', 409,
      { ...updated, startAt: at(start), endAt: at(end) });
  }
  const before = request('Edge: left adjacency allowed', 'POST', '/bookings', 201,
    { ...updated, startAt: at('11:00'), endAt: at('12:00') });
  const after = request('Edge: right adjacency allowed', 'POST', '/bookings', 201,
    { ...updated, startAt: at('14:00'), endAt: at('15:00') });
  const afterPath = `/bookings/${after.id}`;
  for (const [label, start, end] of shapes) {
    request(`Edge: PATCH ${label} overlap`, 'PATCH', afterPath, 409,
      { startAt: at(start), endAt: at(end) });
    assert.deepEqual(request('Verify rejected PATCH leaves values unchanged', 'GET', afterPath, 200), after);
  }
  assert.deepEqual(request('Edge: full PATCH excludes itself', 'PATCH', anchorPath, 200, updated), anchor);
  const partial = request('Edge: partial PATCH preserves omitted fields', 'PATCH', anchorPath, 200,
    { purpose: 'Ownership check' });
  assert.deepEqual(partial, { ...anchor, purpose: 'Ownership check' });
  const other = request('Edge: different equipment can overlap', 'POST', '/bookings', 201,
    { ...updated, equipmentId: 'eq-2' });
  request('Edge: changing equipment checks target conflicts', 'PATCH', `/bookings/${other.id}`, 409, { equipmentId: 'eq-1' });
  assert.deepEqual(request('Verify equipment was not changed on conflict', 'GET', `/bookings/${other.id}`, 200), other);
  for (const [label, patch] of [
    ['equal timestamps', { endAt: updated.startAt }],
    ['reversed timestamps', { endAt: at('11:00') }],
    ['unknown equipment', { equipmentId: 'missing-equipment' }],
    ['empty PATCH', {}], ['null field', { borrowerName: null }],
    ['wrong field type', { equipmentId: 1 }], ['blank field', { purpose: '   ' }],
    ['unknown field', { extra: 'value' }], ['impossible date', { startAt: '2026-02-30T09:00:00.000Z' }],
  ]) {
    request(`Edge: PATCH ${label}`, 'PATCH', anchorPath, 400, patch);
  }
  assert.deepEqual(request('Verify invalid PATCHes did not alter anchor', 'GET', anchorPath, 200), partial);
  for (const [label, payload] of [
    ['unknown equipment', { ...updated, equipmentId: 'missing-equipment' }],
    ['SQL-like equipment ID', { ...updated, equipmentId: "eq-1' OR 1=1 --" }],
    ['equal times', { ...updated, endAt: updated.startAt }],
    ['null body', null], ['array body', []], ['missing fields', { equipmentId: 'eq-1' }],
  ]) request(`Edge: POST ${label}`, 'POST', '/bookings', 400, payload);
  request('Edge: SQL-like path ID is just an ID', 'GET', `/bookings/${encodeURIComponent("' OR 1=1 --")}`, 404);
  request('Edge: missing PATCH resource', 'PATCH', '/bookings/not-found', 404, { purpose: 'Missing' });
  request('Edge: missing DELETE resource', 'DELETE', '/bookings/not-found', 404);
  request('Edge: unknown route JSON error', 'GET', '/unknown', 404);
  const literalInput = { ...updated, borrowerName: "O'Brien; DROP TABLE bookings; --",
    startAt: '2026-10-22T09:00:00Z', endAt: '2026-10-22T10:00:00Z' };
  const literal = request('Edge: SQL-like borrower text is stored literally', 'POST', '/bookings', 201, literalInput);
  verifyBooking(literal, { ...literalInput, startAt: '2026-10-22T09:00:00.000Z', endAt: '2026-10-22T10:00:00.000Z' });
  assert.deepEqual(request('Verify literal text and normalized timestamps persisted', 'GET', `/bookings/${literal.id}`, 200), literal);
  const rows = request('Verify failed POSTs inserted no extra bookings', 'GET', '/bookings', 200);
  assert.equal(rows.filter(row => row.startAt.startsWith('2026-10-20')).length, 4,
    'Run with the guide time slots free; only our four successful edge bookings should exist on this date');
  assert.ok(rows.some(row => row.id === before.id));
} finally {
  // Delete only records this run created. Preserve other users' data.
  for (const id of [...createdIds]) request('Cleanup test booking', 'DELETE', `/bookings/${id}`, 204);
}
console.log(`All ${requests} Quality Gate HTTP checks and value assertions passed.`);
