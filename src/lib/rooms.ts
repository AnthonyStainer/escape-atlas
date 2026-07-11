import history from '../data/rooms.json';
import upcomingData from '../data/upcoming.json';

export interface Room {
  id: number;
  date: string;
  location: string;
  venue: string | null;
  game: string | null;
  completionTime: string | null;
  completionSeconds: number | null;
  players: number | null;
  allottedMinutes: number | null;
  notes: string | null;
  sourceFlags: string[];
}

export interface UpcomingEvent {
  id: string;
  date: string;
  time?: string | null;
  location: string;
  venue: string;
  game: string;
  note?: string | null;
}

export const source = history.source;
export const rooms = history.rooms as Room[];
export const upcoming = upcomingData.events as UpcomingEvent[];

export function slugify(value: string): string {
  return value
    .normalize('NFKD')
    .replace(/[’']/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase();
}

export function roomSlug(room: Room): string {
  const label = room.game ?? room.venue ?? `room-${room.id}`;
  return `${String(room.id).padStart(3, '0')}-${slugify(label)}`;
}

export function roomTitle(room: Room): string {
  return room.game ?? `Unnamed room #${room.id}`;
}

export function formatDate(value: string, options: Intl.DateTimeFormatOptions = {}): string {
  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
    ...options,
  }).format(new Date(`${value}T12:00:00Z`));
}

export function formatDuration(value: string | null): string {
  if (!value) return 'Not recorded';
  const [hours, minutes, seconds] = value.split(':').map(Number);
  if (hours === 0) return `${minutes}:${String(seconds).padStart(2, '0')}`;
  return `${hours}h ${String(minutes).padStart(2, '0')}m`;
}

function countBy(values: Array<string | null>): Array<{ label: string; count: number }> {
  const counts = new Map<string, number>();
  for (const value of values) {
    if (value) counts.set(value, (counts.get(value) ?? 0) + 1);
  }
  return [...counts.entries()]
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));
}

export const roomsNewestFirst = [...rooms].sort((a, b) => b.date.localeCompare(a.date) || b.id - a.id);
export const locations = countBy(rooms.map((room) => room.location));
export const venues = countBy(rooms.map((room) => room.venue));
export const years = countBy(rooms.map((room) => room.date.slice(0, 4))).sort((a, b) => a.label.localeCompare(b.label));
export const timedRooms = rooms.filter((room) => room.completionSeconds !== null);
export const shortestRecorded = [...timedRooms].sort((a, b) => (a.completionSeconds ?? Infinity) - (b.completionSeconds ?? Infinity))[0];

export const stats = {
  total: rooms.length,
  years: new Set(rooms.map((room) => room.date.slice(0, 4))).size,
  locations: locations.length,
  venues: venues.length,
  timed: timedRooms.length,
  first: rooms[0],
  latest: roomsNewestFirst[0],
};
