export const SPECIALTIES = [
  'Cardiology',
  'Dermatology',
  'Pediatrics',
  'General Medicine',
  'Orthopedics',
  'Neurology',
] as const;

export type Specialty = (typeof SPECIALTIES)[number];

export const SPECIALTY_META: Record<
  Specialty,
  { emoji: string; color: string; ring: string; chip: string }
> = {
  Cardiology: { emoji: '❤️', color: 'text-rose-600', ring: 'ring-rose-200', chip: 'bg-rose-50 text-rose-700' },
  Dermatology: { emoji: '🧴', color: 'text-amber-600', ring: 'ring-amber-200', chip: 'bg-amber-50 text-amber-700' },
  Pediatrics: { emoji: '🧸', color: 'text-sky-600', ring: 'ring-sky-200', chip: 'bg-sky-50 text-sky-700' },
  'General Medicine': { emoji: '🩺', color: 'text-teal-600', ring: 'ring-teal-200', chip: 'bg-teal-50 text-teal-700' },
  Orthopedics: { emoji: '🦴', color: 'text-indigo-600', ring: 'ring-indigo-200', chip: 'bg-indigo-50 text-indigo-700' },
  Neurology: { emoji: '🧠', color: 'text-violet-600', ring: 'ring-violet-200', chip: 'bg-violet-50 text-violet-700' },
};

export const SLOT_TIMES = ['09:00', '10:30', '12:00', '14:00', '15:30', '17:00'] as const;

export const SLOT_LABELS: Record<string, string> = {
  '09:00': '09:00 AM',
  '10:30': '10:30 AM',
  '12:00': '12:00 PM',
  '14:00': '02:00 PM',
  '15:30': '03:30 PM',
  '17:00': '05:00 PM',
};
