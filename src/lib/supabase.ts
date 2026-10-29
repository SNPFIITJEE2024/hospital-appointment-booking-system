import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL as string;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

export const supabase = createClient(url, anonKey, {
  auth: { persistSession: false },
});

export type AppointmentStatus = 'confirmed' | 'completed' | 'cancelled';

export interface Doctor {
  id: string;
  name: string;
  specialty: string;
  experience_years: number;
  rating: number;
  fee: number;
  photo_url: string;
  bio: string;
  available: boolean;
  blocked_slots: Record<string, string[]>;
  created_at: string;
}

export interface Appointment {
  id: string;
  doctor_id: string;
  patient_name: string;
  patient_age: number;
  patient_gender: string;
  patient_phone: string;
  patient_email: string;
  reason: string;
  appointment_date: string;
  time_slot: string;
  status: AppointmentStatus;
  prescription_notes: string | null;
  created_at: string;
}

export interface AppointmentWithDoctor extends Appointment {
  doctor?: Doctor;
}
