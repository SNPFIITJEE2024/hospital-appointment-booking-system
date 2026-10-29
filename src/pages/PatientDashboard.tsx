import { useState, useEffect, useMemo } from 'react';
import {
  CalendarClock,
  History,
  XCircle,
  CalendarPlus,
  Loader2,
  CalendarX,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import type { Appointment, Doctor } from '@/lib/supabase';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import { formatDateNice, slotToLabel, shortId, dateKey } from '@/lib/format';
import { Modal } from '@/components/Modal';
import { SLOT_TIMES } from '@/lib/constants';
import type { Page } from '@/components/Navbar';

interface PatientDashboardProps {
  setPage: (p: Page) => void;
}

export function PatientDashboard({ setPage }: PatientDashboardProps) {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [doctors, setDoctors] = useState<Record<string, Doctor>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState<string | null>(null);
  const [rescheduleAppt, setRescheduleAppt] = useState<Appointment | null>(null);

  async function load() {
    if (!user) return;
    setLoading(true);
    setError(null);
    const { data, error } = await supabase
      .from('appointments')
      .select('*')
      .eq('patient_email', user.email)
      .order('appointment_date', { ascending: true });
    if (error) {
      setError(error.message);
    } else {
      setAppointments((data ?? []) as Appointment[]);
      const doctorIds = [...new Set((data ?? []).map((a) => (a as Appointment).doctor_id))];
      if (doctorIds.length) {
        const { data: docs } = await supabase.from('doctors').select('*').in('id', doctorIds);
        const map: Record<string, Doctor> = {};
        (docs ?? []).forEach((d) => {
          map[(d as Doctor).id] = d as Doctor;
        });
        setDoctors(map);
      }
    }
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, [user]);

  const today = dateKey(new Date());

  const upcoming = useMemo(
    () =>
      appointments.filter(
        (a) => a.appointment_date >= today && a.status !== 'cancelled',
      ),
    [appointments, today],
  );

  const past = useMemo(
    () =>
      appointments.filter(
        (a) => a.appointment_date < today || a.status === 'cancelled' || a.status === 'completed',
      ),
    [appointments, today],
  );

  async function handleCancel(id: string) {
    setCancelling(id);
    const { error } = await supabase
      .from('appointments')
      .update({ status: 'cancelled' })
      .eq('id', id);
    setCancelling(null);
    if (error) {
      setError(error.message);
    } else {
      await load();
    }
  }

  if (!user) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-16 text-center sm:px-6 lg:px-8">
        <AlertCircle size={40} className="mx-auto text-slate-300" />
        <h2 className="mt-4 text-lg font-semibold text-slate-700">Please sign in as a patient</h2>
        <p className="mt-1 text-sm text-slate-500">Use the login button in the navbar to access your dashboard.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Patient Portal</h1>
        <p className="mt-1 text-slate-500">Welcome back, {user.name}. Manage your appointments below.</p>
      </div>

      {error && (
        <div className="mb-6 flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          <AlertCircle size={18} /> {error}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 size={28} className="animate-spin text-brand-500" />
        </div>
      ) : (
        <>
          {/* Upcoming */}
          <section className="mb-10">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-lg font-bold text-slate-900">
                <CalendarClock size={20} className="text-brand-600" />
                Upcoming Appointments
                <span className="rounded-full bg-brand-50 px-2 py-0.5 text-sm font-semibold text-brand-700">
                  {upcoming.length}
                </span>
              </h2>
              <button
                onClick={() => setPage('doctors')}
                className="flex items-center gap-1.5 rounded-lg bg-brand-50 px-3 py-2 text-sm font-medium text-brand-700 transition hover:bg-brand-100"
              >
                <CalendarPlus size={16} /> Book New
              </button>
            </div>

            {upcoming.length === 0 ? (
              <EmptyState
                icon={<CalendarX size={32} className="text-slate-300" />}
                title="No upcoming appointments"
                subtitle="Book your first consultation from the Find Doctors page."
              />
            ) : (
              <div className="space-y-3">
                {upcoming.map((appt) => (
                  <AppointmentRow
                    key={appt.id}
                    appt={appt}
                    doctor={doctors[appt.doctor_id]}
                    onCancel={() => handleCancel(appt.id)}
                    onReschedule={() => setRescheduleAppt(appt)}
                    cancelling={cancelling === appt.id}
                  />
                ))}
              </div>
            )}
          </section>

          {/* Past */}
          <section>
            <h2 className="mb-4 flex items-center gap-2 text-lg font-bold text-slate-900">
              <History size={20} className="text-slate-400" />
              Past Consultations
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-sm font-semibold text-slate-600">
                {past.length}
              </span>
            </h2>
            {past.length === 0 ? (
              <EmptyState
                icon={<History size={32} className="text-slate-300" />}
                title="No past consultations"
                subtitle="Your consultation history will appear here."
              />
            ) : (
              <div className="space-y-3">
                {past.map((appt) => (
                  <AppointmentRow key={appt.id} appt={appt} doctor={doctors[appt.doctor_id]} past />
                ))}
              </div>
            )}
          </section>
        </>
      )}

      {rescheduleAppt && doctors[rescheduleAppt.doctor_id] && (
        <RescheduleModal
          appointment={rescheduleAppt}
          doctor={doctors[rescheduleAppt.doctor_id]}
          onClose={() => setRescheduleAppt(null)}
          onDone={() => {
            setRescheduleAppt(null);
            load();
          }}
        />
      )}
    </div>
  );
}

function AppointmentRow({
  appt,
  doctor,
  onCancel,
  onReschedule,
  cancelling,
  past,
}: {
  appt: Appointment;
  doctor?: Doctor;
  onCancel?: () => void;
  onReschedule?: () => void;
  cancelling?: boolean;
  past?: boolean;
}) {
  const statusColors: Record<string, string> = {
    confirmed: 'bg-brand-50 text-brand-700 border-brand-200',
    completed: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    cancelled: 'bg-rose-50 text-rose-700 border-rose-200',
  };

  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:shadow-md sm:flex-row sm:items-center">
      {doctor && (
        <img
          src={doctor.photo_url}
          alt={doctor.name}
          className="h-16 w-16 flex-shrink-0 rounded-xl object-cover object-top"
        />
      )}
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <h3 className="font-bold text-slate-900">{doctor?.name ?? 'Doctor'}</h3>
          <span className={`rounded-full border px-2 py-0.5 text-xs font-semibold ${statusColors[appt.status]}`}>
            {appt.status}
          </span>
        </div>
        <p className="text-sm text-slate-500">{doctor?.specialty}</p>
        <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-600">
          <span className="flex items-center gap-1.5">
            <CalendarClock size={14} className="text-slate-400" />
            {formatDateNice(appt.appointment_date)}
          </span>
          <span className="flex items-center gap-1.5">
            <CheckCircle2 size={14} className="text-slate-400" />
            {slotToLabel(appt.time_slot)}
          </span>
          <span className="font-mono text-xs text-slate-400">#{shortId(appt.id)}</span>
        </div>
        {appt.prescription_notes && past && (
          <div className="mt-2 rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-600">
            <span className="font-semibold text-slate-700">Prescription: </span>
            {appt.prescription_notes}
          </div>
        )}
      </div>
      {!past && appt.status === 'confirmed' && (
        <div className="flex gap-2">
          <button
            onClick={onReschedule}
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 transition hover:border-brand-300 hover:text-brand-700"
          >
            Reschedule
          </button>
          <button
            onClick={onCancel}
            disabled={cancelling}
            className="flex items-center gap-1.5 rounded-lg border border-rose-200 px-3 py-2 text-sm font-medium text-rose-600 transition hover:bg-rose-50 disabled:opacity-60"
          >
            {cancelling ? <Loader2 size={15} className="animate-spin" /> : <XCircle size={15} />}
            Cancel
          </button>
        </div>
      )}
    </div>
  );
}

function EmptyState({ icon, title, subtitle }: { icon: React.ReactNode; title: string; subtitle: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-300 bg-white py-12 text-center">
      {icon}
      <p className="mt-3 font-medium text-slate-600">{title}</p>
      <p className="mt-1 text-sm text-slate-400">{subtitle}</p>
    </div>
  );
}

function RescheduleModal({
  appointment,
  doctor,
  onClose,
  onDone,
}: {
  appointment: Appointment;
  doctor: Doctor;
  onClose: () => void;
  onDone: () => void;
}) {
  const [dates, setDates] = useState<Date[]>([]);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [bookedSlots, setBookedSlots] = useState<string[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const days: Date[] = [];
    for (let i = 0; i < 7; i++) days.push(new Date(Date.now() + i * 86400000));
    setDates(days);
    setSelectedDate(dateKey(days[0]));
  }, []);

  useEffect(() => {
    if (!selectedDate) return;
    let cancelled = false;
    async function load() {
      setLoadingSlots(true);
      const { data } = await supabase
        .from('appointments')
        .select('time_slot')
        .eq('doctor_id', doctor.id)
        .eq('appointment_date', selectedDate!)
        .neq('status', 'cancelled');
      if (!cancelled) {
        // exclude the current appointment's own slot — it will be freed
        const slots = (data ?? [])
          .filter((r) => (r as { time_slot: string }).time_slot !== appointment.time_slot || selectedDate !== appointment.appointment_date)
          .map((r) => (r as { time_slot: string }).time_slot);
        setBookedSlots(slots);
        setLoadingSlots(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [selectedDate, doctor.id, appointment]);

  const blocked = doctor.blocked_slots?.[selectedDate ?? ''] ?? [];

  async function handleReschedule() {
    if (!selectedDate || !selectedSlot) return;
    setSubmitting(true);
    setError(null);
    const { error } = await supabase
      .from('appointments')
      .update({ appointment_date: selectedDate, time_slot: selectedSlot })
      .eq('id', appointment.id);
    setSubmitting(false);
    if (error) {
      setError(error.message);
      return;
    }
    onDone();
  }

  return (
    <Modal open onClose={onClose} title="Reschedule Appointment" subtitle={doctor.name} maxWidth="max-w-xl">
      <div className="space-y-5">
        <div className="rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-600">
          Current: <span className="font-medium">{formatDateNice(appointment.appointment_date)}</span> at{' '}
          <span className="font-medium">{slotToLabel(appointment.time_slot)}</span>
        </div>

        <div>
          <p className="mb-2 text-sm font-semibold text-slate-700">Select new date</p>
          <div className="flex gap-2 overflow-x-auto pb-2">
            {dates.map((d) => {
              const key = dateKey(d);
              return (
                <button
                  key={key}
                  onClick={() => {
                    setSelectedDate(key);
                    setSelectedSlot(null);
                  }}
                  className={`flex min-w-[68px] flex-col items-center rounded-xl border px-2.5 py-2 transition ${
                    selectedDate === key
                      ? 'border-brand-500 bg-brand-50 text-brand-700 ring-2 ring-brand-200'
                      : 'border-slate-200 bg-white text-slate-600 hover:border-brand-300'
                  }`}
                >
                  <span className="text-[11px] uppercase">{d.toLocaleDateString('en-US', { weekday: 'short' })}</span>
                  <span className="text-base font-bold">{d.getDate()}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <p className="mb-2 text-sm font-semibold text-slate-700">Select new time</p>
          <div className="grid grid-cols-3 gap-2">
            {SLOT_TIMES.map((slot) => {
              const isBooked = bookedSlots.includes(slot);
              const isBlocked = blocked.includes(slot);
              const disabled = isBooked || isBlocked || loadingSlots;
              return (
                <button
                  key={slot}
                  disabled={disabled}
                  onClick={() => setSelectedSlot(slot)}
                  className={`rounded-xl border px-2 py-2.5 text-sm font-semibold transition ${
                    selectedSlot === slot
                      ? 'border-brand-500 bg-brand-600 text-white'
                      : disabled
                      ? 'cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400'
                      : 'border-slate-200 bg-white text-slate-700 hover:border-brand-400 hover:bg-brand-50'
                  }`}
                >
                  {slotToLabel(slot)}
                </button>
              );
            })}
          </div>
        </div>

        {error && (
          <div className="flex items-center gap-2 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
            <AlertCircle size={16} /> {error}
          </div>
        )}

        <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
          <button onClick={onClose} className="rounded-xl px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-100">
            Cancel
          </button>
          <button
            onClick={handleReschedule}
            disabled={!selectedSlot || submitting}
            className="flex items-center gap-2 rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:opacity-60"
          >
            {submitting && <Loader2 size={16} className="animate-spin" />}
            Confirm Reschedule
          </button>
        </div>
      </div>
    </Modal>
  );
}
