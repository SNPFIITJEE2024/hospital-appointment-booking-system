import { useState, useEffect, useMemo } from 'react';
import { CalendarDays, Clock, CheckCircle2, Loader2, AlertCircle, Lock } from 'lucide-react';
import type { Doctor, Appointment } from '@/lib/supabase';
import { supabase } from '@/lib/supabase';
import { SLOT_TIMES } from '@/lib/constants';
import { dateKey, slotToLabel, shortId, formatDateNice } from '@/lib/format';
import { useAuth } from '@/lib/auth';
import { Modal } from '@/components/Modal';

interface BookingModalProps {
  doctor: Doctor;
  onClose: () => void;
  onBooked: () => void;
}

type Step = 'select' | 'form' | 'success';

const GENDERS = ['Male', 'Female', 'Other'] as const;

export function BookingModal({ doctor, onClose, onBooked }: BookingModalProps) {
  const { user } = useAuth();
  const [step, setStep] = useState<Step>('select');
  const [dates, setDates] = useState<Date[]>([]);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [bookedSlots, setBookedSlots] = useState<Record<string, string[]>>({});
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);

  // form
  const [form, setForm] = useState({
    patient_name: user?.role === 'patient' ? user.name : '',
    patient_age: '',
    patient_gender: '',
    patient_phone: '',
    patient_email: user?.role === 'patient' ? user.email : '',
    reason: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [createdAppt, setCreatedAppt] = useState<Appointment | null>(null);

  // build 7-day rolling calendar
  useEffect(() => {
    const days: Date[] = [];
    for (let i = 0; i < 7; i++) {
      days.push(new Date(Date.now() + i * 86400000));
    }
    setDates(days);
    setSelectedDate(dateKey(days[0]));
  }, []);

  // load booked slots for selected date
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
        const slots = (data ?? []).map((r) => (r as { time_slot: string }).time_slot);
        setBookedSlots((prev) => ({ ...prev, [selectedDate!]: slots }));
        setLoadingSlots(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [selectedDate, doctor.id]);

  const blockedForDate = useMemo(() => {
    return doctor.blocked_slots?.[selectedDate ?? ''] ?? [];
  }, [doctor.blocked_slots, selectedDate]);

  function isSlotBooked(slot: string): boolean {
    return (bookedSlots[selectedDate ?? ''] ?? []).includes(slot);
  }
  function isSlotBlocked(slot: string): boolean {
    return blockedForDate.includes(slot);
  }

  function validate(): boolean {
    const e: Record<string, string> = {};
    if (!form.patient_name.trim()) e.patient_name = 'Full name is required';
    else if (form.patient_name.trim().length < 2) e.patient_name = 'Name must be at least 2 characters';

    const age = Number(form.patient_age);
    if (!form.patient_age) e.patient_age = 'Age is required';
    else if (isNaN(age) || age < 0 || age > 130) e.patient_age = 'Enter a valid age (0–130)';

    if (!form.patient_gender) e.patient_gender = 'Please select a gender';

    const phone = form.patient_phone.replace(/[\s()-]/g, '');
    if (!form.patient_phone) e.patient_phone = 'Phone number is required';
    else if (!/^\+?\d{7,15}$/.test(phone)) e.patient_phone = 'Enter a valid phone number';

    if (!form.patient_email.trim()) e.patient_email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.patient_email)) e.patient_email = 'Enter a valid email';

    if (!form.reason.trim()) e.reason = 'Please describe your symptoms or reason for visit';
    else if (form.reason.trim().length < 5) e.reason = 'Please provide more detail (min 5 characters)';

    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleConfirm() {
    if (!validate() || !selectedDate || !selectedSlot) return;
    setSubmitting(true);
    setSubmitError(null);

    // conflict re-check: query again to prevent race condition
    const { data: conflict } = await supabase
      .from('appointments')
      .select('id')
      .eq('doctor_id', doctor.id)
      .eq('appointment_date', selectedDate)
      .eq('time_slot', selectedSlot)
      .neq('status', 'cancelled')
      .maybeSingle();

    if (conflict) {
      setSubmitError('This slot was just booked by someone else. Please pick another slot.');
      setSubmitting(false);
      setStep('select');
      setSelectedSlot(null);
      return;
    }

    const payload = {
      doctor_id: doctor.id,
      patient_name: form.patient_name.trim(),
      patient_age: Number(form.patient_age),
      patient_gender: form.patient_gender,
      patient_phone: form.patient_phone.trim(),
      patient_email: form.patient_email.trim(),
      reason: form.reason.trim(),
      appointment_date: selectedDate,
      time_slot: selectedSlot,
      status: 'confirmed' as const,
    };

    const { data, error } = await supabase
      .from('appointments')
      .insert(payload)
      .select()
      .single();

    if (error) {
      setSubmitError(error.message);
      setSubmitting(false);
      return;
    }

    setCreatedAppt(data as Appointment);
    setSubmitting(false);
    setStep('success');
  }

  return (
    <Modal
      open
      onClose={onClose}
      title={step === 'success' ? 'Appointment Confirmed' : `Book with ${doctor.name}`}
      subtitle={step === 'success' ? undefined : doctor.specialty}
      maxWidth="max-w-2xl"
    >
      {/* Step 1: Date + Slot selection */}
      {step === 'select' && (
        <div className="space-y-6">
          {/* 7-day calendar strip */}
          <div>
            <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-700">
              <CalendarDays size={16} className="text-brand-600" />
              Select a date
            </div>
            <div className="flex gap-2 overflow-x-auto pb-2">
              {dates.map((d) => {
                const key = dateKey(d);
                const isSel = selectedDate === key;
                return (
                  <button
                    key={key}
                    onClick={() => {
                      setSelectedDate(key);
                      setSelectedSlot(null);
                    }}
                    className={`flex min-w-[72px] flex-col items-center rounded-xl border px-3 py-2.5 transition ${
                      isSel
                        ? 'border-brand-500 bg-brand-50 text-brand-700 ring-2 ring-brand-200'
                        : 'border-slate-200 bg-white text-slate-600 hover:border-brand-300'
                    }`}
                  >
                    <span className="text-[11px] font-medium uppercase">
                      {d.toLocaleDateString('en-US', { weekday: 'short' })}
                    </span>
                    <span className="text-lg font-bold">{d.getDate()}</span>
                    <span className="text-[11px] text-slate-400">
                      {d.toLocaleDateString('en-US', { month: 'short' })}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Slot grid */}
          <div>
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                <Clock size={16} className="text-brand-600" />
                Available time slots
              </div>
              {loadingSlots && <Loader2 size={16} className="animate-spin text-slate-400" />}
            </div>
            <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
              {SLOT_TIMES.map((slot) => {
                const booked = isSlotBooked(slot);
                const blocked = isSlotBlocked(slot);
                const disabled = booked || blocked || loadingSlots;
                const isSel = selectedSlot === slot;
                return (
                  <button
                    key={slot}
                    disabled={disabled}
                    onClick={() => setSelectedSlot(slot)}
                    className={`relative rounded-xl border px-3 py-3 text-sm font-semibold transition ${
                      isSel
                        ? 'border-brand-500 bg-brand-600 text-white shadow-sm'
                        : booked
                        ? 'cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400'
                        : blocked
                        ? 'cursor-not-allowed border-amber-200 bg-amber-50 text-amber-500'
                        : 'border-slate-200 bg-white text-slate-700 hover:border-brand-400 hover:bg-brand-50'
                    }`}
                  >
                    {slotToLabel(slot)}
                    {booked && (
                      <span className="mt-1 flex items-center justify-center gap-1 text-[10px] font-medium uppercase">
                        <Lock size={10} /> Booked
                      </span>
                    )}
                    {blocked && (
                      <span className="mt-1 block text-[10px] font-medium uppercase">Blocked</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Proceed */}
          <div className="flex items-center justify-between border-t border-slate-100 pt-4">
            <p className="text-sm text-slate-500">
              {selectedSlot ? (
                <span className="flex items-center gap-1.5 text-brand-700">
                  <CheckCircle2 size={16} /> {formatDateNice(selectedDate!)} at {slotToLabel(selectedSlot)}
                </span>
              ) : (
                'Select a time slot to continue'
              )}
            </p>
            <button
              onClick={() => setStep('form')}
              disabled={!selectedSlot}
              className={`rounded-xl px-5 py-2.5 text-sm font-semibold transition ${
                selectedSlot
                  ? 'bg-brand-600 text-white hover:bg-brand-700 active:scale-[0.98]'
                  : 'cursor-not-allowed bg-slate-100 text-slate-400'
              }`}
            >
              Continue
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Patient form */}
      {step === 'form' && (
        <div className="space-y-4">
          <div className="rounded-xl bg-brand-50 px-4 py-3 text-sm">
            <p className="font-semibold text-brand-800">{doctor.name}</p>
            <p className="text-brand-600">
              {formatDateNice(selectedDate!)} · {slotToLabel(selectedSlot!)} · ${doctor.fee.toFixed(0)}
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Patient Full Name" error={errors.patient_name} className="sm:col-span-2">
              <input
                type="text"
                value={form.patient_name}
                onChange={(e) => setForm({ ...form, patient_name: e.target.value })}
                className={inputCls(errors.patient_name)}
                placeholder="e.g. John Doe"
              />
            </Field>
            <Field label="Age" error={errors.patient_age}>
              <input
                type="number"
                value={form.patient_age}
                onChange={(e) => setForm({ ...form, patient_age: e.target.value })}
                className={inputCls(errors.patient_age)}
                placeholder="e.g. 35"
              />
            </Field>
            <Field label="Gender" error={errors.patient_gender}>
              <select
                value={form.patient_gender}
                onChange={(e) => setForm({ ...form, patient_gender: e.target.value })}
                className={inputCls(errors.patient_gender)}
              >
                <option value="">Select...</option>
                {GENDERS.map((g) => (
                  <option key={g} value={g}>{g}</option>
                ))}
              </select>
            </Field>
            <Field label="Phone Number" error={errors.patient_phone}>
              <input
                type="tel"
                value={form.patient_phone}
                onChange={(e) => setForm({ ...form, patient_phone: e.target.value })}
                className={inputCls(errors.patient_phone)}
                placeholder="e.g. +1 555 123 4567"
              />
            </Field>
            <Field label="Email" error={errors.patient_email}>
              <input
                type="email"
                value={form.patient_email}
                onChange={(e) => setForm({ ...form, patient_email: e.target.value })}
                className={inputCls(errors.patient_email)}
                placeholder="e.g. john@email.com"
              />
            </Field>
            <Field label="Reason for Consultation / Symptoms" error={errors.reason} className="sm:col-span-2">
              <textarea
                value={form.reason}
                onChange={(e) => setForm({ ...form, reason: e.target.value })}
                rows={3}
                className={inputCls(errors.reason)}
                placeholder="Describe your symptoms or reason for visit..."
              />
            </Field>
          </div>

          {submitError && (
            <div className="flex items-center gap-2 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
              <AlertCircle size={16} /> {submitError}
            </div>
          )}

          <div className="flex items-center justify-between border-t border-slate-100 pt-4">
            <button
              onClick={() => setStep('select')}
              className="rounded-xl px-4 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-100"
            >
              Back
            </button>
            <button
              onClick={handleConfirm}
              disabled={submitting}
              className="flex items-center gap-2 rounded-xl bg-brand-600 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-700 active:scale-[0.98] disabled:opacity-60"
            >
              {submitting ? (
                <>
                  <Loader2 size={16} className="animate-spin" /> Confirming...
                </>
              ) : (
                'Confirm Booking'
              )}
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Success / Appointment slip */}
      {step === 'success' && createdAppt && (
        <AppointmentSlip
          appointment={createdAppt}
          doctor={doctor}
          onClose={onClose}
          onBooked={onBooked}
        />
      )}
    </Modal>
  );
}

function Field({
  label,
  error,
  children,
  className = '',
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <label className="mb-1.5 block text-sm font-medium text-slate-700">{label}</label>
      {children}
      {error && <p className="mt-1 text-xs font-medium text-rose-600">{error}</p>}
    </div>
  );
}

function inputCls(error?: string): string {
  return `w-full rounded-xl border bg-white px-3.5 py-2.5 text-sm text-slate-800 outline-none transition focus:ring-2 ${
    error
      ? 'border-rose-300 focus:border-rose-400 focus:ring-rose-100'
      : 'border-slate-200 focus:border-brand-400 focus:ring-brand-100'
  }`;
}

function AppointmentSlip({
  appointment,
  doctor,
  onClose,
  onBooked,
}: {
  appointment: Appointment;
  doctor: Doctor;
  onClose: () => void;
  onBooked: () => void;
}) {
  return (
    <div>
      <div className="mb-5 flex flex-col items-center text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
          <CheckCircle2 size={36} className="text-emerald-600" />
        </div>
        <h3 className="mt-4 text-xl font-bold text-slate-900">Appointment Confirmed!</h3>
        <p className="mt-1 text-sm text-slate-500">A confirmation has been recorded. Save your appointment ID.</p>
      </div>

      <div className="print-slip rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 p-5">
        <div className="mb-4 flex items-center justify-between border-b border-slate-200 pb-3">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 text-white">
              <CalendarDays size={18} />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-900">MediBook Hospital</p>
              <p className="text-[11px] text-slate-500">Appointment Slip</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-[11px] uppercase text-slate-400">Appointment ID</p>
            <p className="font-mono text-sm font-bold text-brand-700">#{shortId(appointment.id)}</p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <SlipRow label="Patient" value={appointment.patient_name} />
          <SlipRow label="Age / Gender" value={`${appointment.patient_age} / ${appointment.patient_gender}`} />
          <SlipRow label="Doctor" value={doctor.name} />
          <SlipRow label="Department" value={doctor.specialty} />
          <SlipRow label="Date" value={formatDateNice(appointment.appointment_date)} />
          <SlipRow label="Time" value={slotToLabel(appointment.time_slot)} />
          <SlipRow label="Fee" value={`$${doctor.fee.toFixed(0)}`} />
          <SlipRow label="Status" value="Confirmed" />
          <div className="col-span-2">
            <SlipRow label="Reason" value={appointment.reason} />
          </div>
        </div>
      </div>

      <div className="no-print mt-5 flex items-center justify-between">
        <button
          onClick={() => window.print()}
          className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
        >
          Print Slip
        </button>
        <button
          onClick={() => {
            onBooked();
            onClose();
          }}
          className="rounded-xl bg-brand-600 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-700"
        >
          Done
        </button>
      </div>
    </div>
  );
}

function SlipRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">{label}</p>
      <p className="font-medium text-slate-800">{value}</p>
    </div>
  );
}
