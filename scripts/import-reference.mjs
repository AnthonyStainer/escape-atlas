import { createHash } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const args = process.argv.slice(2);

function valueFor(flag) {
  const index = args.indexOf(flag);
  return index === -1 ? undefined : args[index + 1];
}

const sourcePath = valueFor('--source');
const outputPath = valueFor('--output') ?? 'src/data/rooms.json';
const workbookPath = valueFor('--workbook');

if (!sourcePath) {
  console.error('Usage: npm run import:history -- --source <escape-rooms.md> [--workbook <source.xlsx>] [--output <rooms.json>]');
  process.exit(2);
}

const source = await readFile(sourcePath, 'utf8');
const updatedMatch = source.match(/\*Last updated:\s*(\d{4}-\d{2}-\d{2})\*/);
const tableLine = /^\|\s*(\d+)\s*\|\s*([^|]*)\|\s*([^|]*)\|\s*([^|]*)\|\s*([^|]*)\|\s*([^|]*)\|\s*([^|]*)\|$/;

function nullIfBlank(value) {
  const trimmed = value.trim();
  return trimmed === '' || trimmed === '-' ? null : trimmed;
}

function secondsFor(value) {
  if (!value) return null;
  const match = value.match(/^(\d{2}):(\d{2}):(\d{2})$/);
  if (!match) throw new Error(`Invalid completion time: ${value}`);
  return Number(match[1]) * 3600 + Number(match[2]) * 60 + Number(match[3]);
}

const rooms = [];
for (const line of source.split('\n')) {
  const match = line.match(tableLine);
  if (!match) continue;

  const id = Number(match[1]);
  const completionTime = nullIfBlank(match[6]);
  const notes = nullIfBlank(match[7]);
  const playersMatch = notes?.match(/(?:^|,\s*)(\d+) players?\b/i);
  const allottedMatch = notes?.match(/(?:^|,\s*)(\d+) min(?:ute)? game(?:,|$)/i);

  rooms.push({
    id,
    date: match[2].trim(),
    location: match[3].trim(),
    venue: nullIfBlank(match[4]),
    game: nullIfBlank(match[5]),
    completionTime,
    completionSeconds: secondsFor(completionTime),
    players: playersMatch ? Number(playersMatch[1]) : 2,
    allottedMinutes: allottedMatch ? Number(allottedMatch[1]) : 60,
    notes,
    sourceFlags: [],
  });
}

const expectedIds = Array.from({ length: rooms.length }, (_, index) => index + 1);
if (JSON.stringify(rooms.map((room) => room.id)) !== JSON.stringify(expectedIds)) {
  throw new Error('Room IDs are not unique and sequential from 1.');
}
if (rooms.length !== 159) {
  throw new Error(`Expected 159 rooms, found ${rooms.length}.`);
}

const compositeGroups = new Map();
for (const room of rooms) {
  const composite = [room.date, room.location, room.venue, room.game].join('|').toLowerCase();
  const group = compositeGroups.get(composite) ?? [];
  group.push(room);
  compositeGroups.set(composite, group);
}
for (const group of compositeGroups.values()) {
  if (group.length > 1) {
    for (const room of group) room.sourceFlags.push('duplicate-core-fields');
  }
}

let workbookSha256 = null;
if (workbookPath) {
  const workbook = await readFile(workbookPath);
  workbookSha256 = createHash('sha256').update(workbook).digest('hex');
}

const data = {
  schemaVersion: 1,
  source: {
    label: "Trenna's authoritative escape-room history",
    reference: 'memory/reference/escape-rooms.md',
    referenceUpdated: updatedMatch?.[1] ?? null,
    workbook: workbookPath ? path.basename(workbookPath) : null,
    workbookSha256,
    recordCount: rooms.length,
  },
  rooms,
};

await writeFile(outputPath, `${JSON.stringify(data, null, 2)}\n`, 'utf8');
console.log(`Imported ${rooms.length} rooms to ${outputPath}.`);
