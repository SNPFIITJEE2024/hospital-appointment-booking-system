export function slotToLabel(slot: string): string {
  const [h, m] = slot.split(':').map(Number);
  const period = h >= 12 ? 'PM' : 'AM';
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${hour12.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')} ${period}`;
}

export function dateKey(d: Date): string {
  const y = d.getFullYear();
  const mo = (d.getMonth() + 1).toString().padStart(2, '0');
  const da = d.getDate().toString().padStart(2, '0');
  return `${y}-${mo}-${da}`;
}

export function parseDateKey(key: string): Date {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function shortId(id: string): string {
  return id.replace(/-/g, '').slice(0, 8).toUpperCase();
}

export function formatDateNice(key: string): string {
  const d = parseDateKey(key);
  return d.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function formatDateShort(key: string): string {
  const d = parseDateKey(key);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function isPastDate(key: string): boolean {
  const today = dateKey(new Date());
  return key < today;
}

export function isToday(key: string): boolean {
  return key === dateKey(new Date());
}
