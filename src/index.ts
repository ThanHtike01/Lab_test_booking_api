import { Hono } from 'hono';
import { HTTPException } from 'hono/http-exception';

type Booking = {
  id: string;
  equipmentId: string;
  borrowerName: string;
  startAt: string;
  endAt: string;
  purpose: string;
};
type BookingInput = Omit<Booking, 'id'>;
const fields = ['equipmentId', 'borrowerName', 'startAt', 'endAt', 'purpose'] as const;
const app = new Hono<{ Bindings: Env }>();

function invalid(message: string): never {
  throw new HTTPException(400, { message });
}

// Reject dates that JavaScript would silently roll into the next month.
function normalizeTime(value: string, field: string): string {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z$/.test(value)) {
    invalid(`${field} must be a UTC ISO timestamp, for example 2026-10-20T09:00:00.000Z`);
  }
  const canonical = value.length === 20 ? value.replace('Z', '.000Z') : value;
  const date = new Date(canonical);
  if (!Number.isFinite(date.getTime()) || date.toISOString() !== canonical) {
    invalid(`${field} must be a valid date and time`);
  }
  return canonical;
}

async function readInput(request: Request, current?: Booking): Promise<BookingInput> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    invalid('Request body must be valid JSON');
  }
  if (body === null || typeof body !== 'object' || Array.isArray(body)) {
    invalid('Request body must be a JSON object');
  }
  const values = body as Record<string, unknown>;
  const keys = Object.keys(values);
  if (keys.length === 0) invalid('Provide booking fields');
  if (keys.some((key) => !fields.some((field) => field === key))) {
    invalid('Only equipmentId, borrowerName, startAt, endAt and purpose are allowed');
  }
  const result: BookingInput = { equipmentId: '', borrowerName: '', startAt: '', endAt: '', purpose: '' };
  for (const field of fields) {
    const value = Object.hasOwn(values, field) ? values[field] : current?.[field];
    if (typeof value !== 'string' || value.trim() === '') {
      invalid(`${field} must be a nonempty string`);
    }
    result[field] = value.trim();
  }
  result.startAt = normalizeTime(result.startAt, 'startAt');
  result.endAt = normalizeTime(result.endAt, 'endAt');
  if (result.startAt >= result.endAt) invalid('startAt must be earlier than endAt');
  return result;
}

async function requireEquipment(db: D1Database, equipmentId: string): Promise<void> {
  const equipment = await db.prepare('SELECT id FROM equipment WHERE id = ?').bind(equipmentId).first();
  if (!equipment) invalid('equipmentId must refer to existing equipment');
}

app.get('/api/equipment', async (c) => {
  const rows = await c.env.DB.prepare('SELECT id, name, location FROM equipment ORDER BY id').all();
  return c.json(rows.results);
});

app.get('/api/bookings', async (c) => {
  const rows = await c.env.DB.prepare('SELECT * FROM bookings ORDER BY startAt, id').all<Booking>();
  return c.json(rows.results);
});

app.get('/api/bookings/:id', async (c) => {
  const booking = await c.env.DB.prepare('SELECT * FROM bookings WHERE id = ?')
    .bind(c.req.param('id')).first<Booking>();
  if (!booking) return c.json({ error: 'Booking not found' }, 404);
  return c.json(booking);
});

app.post('/api/bookings', async (c) => {
  const input = await readInput(c.req.raw);
  await requireEquipment(c.env.DB, input.equipmentId);
  const id = crypto.randomUUID();
  // Conditional INSERT checks overlap and writes in one database statement.
  const booking = await c.env.DB.prepare(`
    INSERT INTO bookings (id, equipmentId, borrowerName, startAt, endAt, purpose)
    SELECT ?, ?, ?, ?, ?, ?
    WHERE NOT EXISTS (
      SELECT 1 FROM bookings WHERE equipmentId = ? AND startAt < ? AND endAt > ?
    )
    RETURNING *
  `).bind(id, input.equipmentId, input.borrowerName, input.startAt, input.endAt,
    input.purpose, input.equipmentId, input.endAt, input.startAt).first<Booking>();
  if (!booking) return c.json({ error: 'Booking time conflicts with an existing booking' }, 409);
  return c.json(booking, 201);
});

app.patch('/api/bookings/:id', async (c) => {
  const id = c.req.param('id');
  const current = await c.env.DB.prepare('SELECT * FROM bookings WHERE id = ?').bind(id).first<Booking>();
  if (!current) return c.json({ error: 'Booking not found' }, 404);
  const input = await readInput(c.req.raw, current);
  await requireEquipment(c.env.DB, input.equipmentId);
  const booking = await c.env.DB.prepare(`
    UPDATE bookings SET equipmentId = ?, borrowerName = ?, startAt = ?, endAt = ?, purpose = ?
    WHERE id = ? AND NOT EXISTS (
      SELECT 1 FROM bookings
      WHERE equipmentId = ? AND id <> ? AND startAt < ? AND endAt > ?
    )
    RETURNING *
  `).bind(input.equipmentId, input.borrowerName, input.startAt, input.endAt, input.purpose,
    id, input.equipmentId, id, input.endAt, input.startAt).first<Booking>();
  if (!booking) {
    const exists = await c.env.DB.prepare('SELECT id FROM bookings WHERE id = ?').bind(id).first();
    if (!exists) return c.json({ error: 'Booking not found' }, 404);
    return c.json({ error: 'Booking time conflicts with an existing booking' }, 409);
  }
  return c.json(booking);
});

app.delete('/api/bookings/:id', async (c) => {
  const deleted = await c.env.DB.prepare('DELETE FROM bookings WHERE id = ? RETURNING id')
    .bind(c.req.param('id')).first();
  if (!deleted) return c.json({ error: 'Booking not found' }, 404);
  return c.body(null, 204);
});

app.notFound((c) => c.json({ error: 'Route not found' }, 404));
app.onError((error, c) => {
  if (error instanceof HTTPException) return c.json({ error: error.message }, error.status);
  console.error(error);
  return c.json({ error: 'Internal server error' }, 500);
});

export default app;
