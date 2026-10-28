import type { Hours } from './types';

const toMin = (t: string) => {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
};

/** Current weekday (0 = Sunday) and minutes since midnight in Algiers. */
export function algiersNow(date = new Date()) {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Africa/Algiers', weekday: 'short', hour: '2-digit', minute: '2-digit', hour12: false,
  }).formatToParts(date);
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? '';
  const day = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(get('weekday'));
  return { day, minutes: (Number(get('hour')) % 24) * 60 + Number(get('minute')) };
}

export type OpenState = { open: true; until: string } | { open: false; opensAt: string | null };

/** Whether the restaurant is open now, handling hours that run past midnight (e.g. 11:00–01:00). */
export function openState(hours: Hours[], date = new Date()): OpenState {
  const { day, minutes } = algiersNow(date);
  const find = (d: number) => hours.find((h) => h.day === (d + 7) % 7);
  const today = find(day);
  const yesterday = find(day - 1);

  if (yesterday && !yesterday.closed && toMin(yesterday.close) < toMin(yesterday.open) && minutes < toMin(yesterday.close)) {
    return { open: true, until: yesterday.close };
  }
  if (today && !today.closed) {
    const o = toMin(today.open);
    const c = toMin(today.close);
    const overnight = c <= o;
    if (minutes >= o && (overnight || minutes < c)) return { open: true, until: today.close };
    if (minutes < o) return { open: false, opensAt: today.open };
  }
  for (let i = 1; i <= 7; i++) {
    const h = find(day + i);
    if (h && !h.closed) return { open: false, opensAt: h.open };
  }
  return { open: false, opensAt: null };
}
