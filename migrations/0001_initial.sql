CREATE TABLE equipment (
  id TEXT PRIMARY KEY NOT NULL,
  name TEXT NOT NULL,
  location TEXT NOT NULL
);

CREATE TABLE bookings (
  id TEXT PRIMARY KEY NOT NULL,
  equipmentId TEXT NOT NULL REFERENCES equipment(id),
  borrowerName TEXT NOT NULL,
  startAt TEXT NOT NULL,
  endAt TEXT NOT NULL,
  purpose TEXT NOT NULL,
  CHECK (startAt < endAt)
);

CREATE INDEX bookings_equipment_time ON bookings(equipmentId, startAt, endAt);

INSERT INTO equipment (id, name, location) VALUES
  ('eq-1', 'Projector A', 'Building 1'),
  ('eq-2', 'Camera A', 'Building 2');
