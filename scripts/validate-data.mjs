import { access, readFile } from 'node:fs/promises';

const history = JSON.parse(await readFile(new URL('../src/data/rooms.json', import.meta.url), 'utf8'));
const upcoming = JSON.parse(await readFile(new URL('../src/data/upcoming.json', import.meta.url), 'utf8'));
const errors = [];

if (history.schemaVersion !== 1) errors.push('rooms.json schemaVersion must be 1');
if (!Array.isArray(history.rooms)) errors.push('rooms must be an array');
if (!history.rooms.length) errors.push('rooms must not be empty');
if (history.source?.recordCount !== history.rooms.length) errors.push('source.recordCount does not match rooms length');

const ids = new Set();
const composites = new Map();
for (const [index, room] of history.rooms.entries()) {
  const prefix = `room[${index}]`;
  if (room.id !== index + 1) errors.push(`${prefix}.id must be ${index + 1}`);
  if (ids.has(room.id)) errors.push(`${prefix}.id is duplicated`);
  ids.add(room.id);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(room.date)) errors.push(`${prefix}.date is invalid`);
  if (!room.location) errors.push(`${prefix}.location is required`);
  if (room.completionTime !== null && !/^\d{2}:\d{2}:\d{2}$/.test(room.completionTime)) errors.push(`${prefix}.completionTime is invalid`);
  if (room.completionTime === null && room.completionSeconds !== null) errors.push(`${prefix}.completionSeconds must be null without a time`);
  if (room.completionTime !== null && (!Number.isInteger(room.completionSeconds) || room.completionSeconds < 0)) errors.push(`${prefix}.completionSeconds is invalid`);
  if (room.completionTime !== null && Number.isInteger(room.completionSeconds)) {
    const [hours, minutes, seconds] = room.completionTime.split(':').map(Number);
    if ((hours * 3600) + (minutes * 60) + seconds !== room.completionSeconds) errors.push(`${prefix}.completionSeconds does not match completionTime`);
  }
  if (!Number.isInteger(room.players) || room.players < 1) errors.push(`${prefix}.players must be a positive integer`);
  if (!Number.isInteger(room.allottedMinutes) || room.allottedMinutes < 1) errors.push(`${prefix}.allottedMinutes must be a positive integer`);
  if (room.publicNote !== undefined && room.publicNote !== null && !room.publicNote.trim()) errors.push(`${prefix}.publicNote must not be blank`);
  if (!Array.isArray(room.sourceFlags)) errors.push(`${prefix}.sourceFlags must be an array`);
  if (room.photo !== undefined && room.photo !== null) {
    if (!room.photo.src?.startsWith('/images/rooms/')) errors.push(`${prefix}.photo.src must be under /images/rooms/`);
    if (!room.photo.alt?.trim()) errors.push(`${prefix}.photo.alt is required`);
    if (room.photo.width !== undefined && (!Number.isInteger(room.photo.width) || room.photo.width <= 0)) errors.push(`${prefix}.photo.width is invalid`);
    if (room.photo.height !== undefined && (!Number.isInteger(room.photo.height) || room.photo.height <= 0)) errors.push(`${prefix}.photo.height is invalid`);
    try {
      await access(new URL(`../public${room.photo.src}`, import.meta.url));
    } catch {
      errors.push(`${prefix}.photo.src does not exist`);
    }
  }
  const composite = [room.date, room.location, room.venue, room.game].join('|').toLowerCase();
  const first = composites.get(composite);
  if (first) {
    const flagged = room.sourceFlags?.includes('duplicate-core-fields') && first.sourceFlags?.includes('duplicate-core-fields');
    if (!flagged) errors.push(`${prefix} duplicates another date/location/venue/game record without a source flag`);
  } else {
    composites.set(composite, room);
  }
}

if (upcoming.schemaVersion !== 1) errors.push('upcoming.json schemaVersion must be 1');
if (!Array.isArray(upcoming.events)) errors.push('upcoming events must be an array');
for (const [index, event] of upcoming.events.entries()) {
  const prefix = `upcoming.events[${index}]`;
  if (!event.id || !event.date || !event.location || !event.venue || !event.game) errors.push(`${prefix} is missing a public field`);
  for (const forbidden of ['bookingReference', 'payment', 'qrCode', 'attendees', 'email', 'phone', 'rawIcs']) {
    if (forbidden in event) errors.push(`${prefix} contains forbidden field ${forbidden}`);
  }
}

if (errors.length) {
  console.error(`Data validation failed (${errors.length}):`);
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

const timed = history.rooms.filter((room) => room.completionSeconds !== null).length;
const named = history.rooms.filter((room) => room.game !== null).length;
console.log(`Validated ${history.rooms.length} rooms (${named} named, ${timed} timed) and ${upcoming.events.length} upcoming events.`);
