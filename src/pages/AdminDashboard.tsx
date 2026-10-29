import { useState, useEffect, useMemo } from 'react';
import {
  LayoutDashboard,
  Users,
  CalendarDays,
  Loader2,
  AlertCircle,
  CheckCircle2,
  CircleDot,
  XCircle,
  FileText,
  Ban,
  Save,
  Activity,
} from 'lucide-react';
import type { Appointment, Doctor } from '@/lib/supabase';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import { formatDateNice, slotToLabel, shortId, dateKey } from '@/lib/format';
import { SLOT_TIMES, SPECIALTIES } from '@/lib/constants';
import { Modal } from '@/components/Modal';

export function AdminDashboard() {
  const { user } = useAuth();
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState(dateKey(new Date()));
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>('all');
  const [prescriptionAppt, setPrescriptionAppt] = useState<Appointment | null>(null);
  const [blockDoctor, setBlockDoctor] = useState<Doctor | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    const [docsRes, apptsRes] = await Promise.all([
      supabase.from('doctors').select('*').order('name'),
      supabase.from('appointments').select('*').order('appointment_date', { ascending: true }),
    ]);
    if (docsRes.error || apptsRes.error) {
      setError(docsRes.error?.message || apptsRes.error?.message || 'Failed to load data');
    } else {
      setDoctors((docsRes.data ?? []) as Doctor[]);
      setAppointments((apptsRes.data ?? []) as Appointment[]);
    }
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  const doctorMap = useMemo(() => {
    const m: Record<string, Doctor> = {};
    doctors.forEach((d) => (m[d.id] = d));
    return m;
  }, [doctors]);

  const filteredAppts = useMemo(() => {
    return appointments.filter((a) => {
      const matchesDate = a.appointment_date === selectedDate;
      const matchesDoctor = selectedDoctorId === 'all' || a.doctor_id === selectedDoctorId;
      return matchesDate && matchesDoctor;
    });
  }, [appointments, selectedDate, selectedDoctorId]);

  // 7-day date strip
  const dateStrip = useMemo(() => {
    const days: Date[] = [];
    for (let i = 0; i < 7; i++) days.push(new Date(Date.now() + i * 86400000));
    return days;
  }, []);

  async function updateStatus(id: string, status: Appointment['status']) {
    const { error } = await supabase.from('appointments').update({ status }).eq('id', id);
    if (error) {
      setError(error.message);
    } else {
      await load();
    }
  }

  async function toggleDoctorAvailability(doc: Doctor) {
    const { error } = await supabase
      .from('doctors')
      .update({ available: !doc.available })
      .eq('id', doc.id);
    if (error) setError(error.message);
    else await load();
  }

  if (!user || user.role !== 'admin') {
    return (
      <div className="mx-auto max-w-7xl px-4 py-16 text-center sm:px-6 lg:px-8">
        <AlertCircle size={40} className="mx-auto text-slate-300" />
        <h2 className="mt-4 text-lg font-semibold text-slate-700">Admin access required</h2>
        <p className="mt-1 text-sm text-slate-500">Use the navbar to login as Doctor/Admin.</p>
      </div>
    );
  }

  const stats = {
    total: filteredAppts.length,
    confirmed: filteredAppts.filter((a) => a.status === 'confirmed').length,
    completed: filteredAppts.filter((a) => a.status === 'completed').length,
    cancelled: filteredAppts.filter((a) => a.status === 'cancelled').length,
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6">
        <h1 className="flex items-center gap-2 text-2xl font-bold text-slate-900">
          <LayoutDashboard size={24} className="text-indigo-600" />
          Admin & Doctor Dashboard
        </h1>
        <p className="mt-1 text-slate-500">Manage daily schedules, patient queues, and doctor availability.</p>
      </div>

      {error && (
        <div className="mb-6 flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          <AlertCircle size={18} /> {error}
          <button onClick={() => setError(null)} className="ml-auto text-rose-500 hover:text-rose-700">Dismiss</button>
        </div>
      )}

      {/* Stats cards */}
      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Total Today" value={stats.total} icon={<CalendarDays size={18} />} color="brand" />
        <StatCard label="Confirmed" value={stats.confirmed} icon={<CircleDot size={18} />} color="amber" />
        <StatCard label="Completed" value={stats.completed} icon={<CheckCircle2 size={18} />} color="emerald" />
        <StatCard label="Cancelled" value={stats.cancelled} icon={<XCircle size={18} />} color="rose" />
      </div>

      {/* Controls: date strip + doctor filter */}
      <div className="mb-5 flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="mb-2 text-sm font-semibold text-slate-700">Schedule date</p>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {dateStrip.map((d) => {
              const key = dateKey(d);
              return (
                <button
                  key={key}
                  onClick={() => setSelectedDate(key)}
                  className={`flex min-w-[64px] flex-col items-center rounded-lg border px-2.5 py-1.5 text-xs transition ${
                    selectedDate === key
                      ? 'border-indigo-500 bg-indigo-50 text-indigo-700 ring-2 ring-indigo-200'
                      : 'border-slate-200 bg-white text-slate-600 hover:border-indigo-300'
                  }`}
                >
                  <span className="uppercase">{d.toLocaleDateString('en-US', { weekday: 'short' })}</span>
                  <span className="text-base font-bold">{d.getDate()}</span>
                </button>
              );
            })}
          </div>
        </div>
        <div>
          <p className="mb-2 text-sm font-semibold text-slate-700">Filter by doctor</p>
          <select
            value={selectedDoctorId}
            onChange={(e) => setSelectedDoctorId(e.target.value)}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
          >
            <option value="all">All Doctors</option>
            {doctors.map((d) => (
              <option key={d.id} value={d.id}>{d.name} — {d.specialty}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Patient queue table */}
      <div className="mb-8 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-5 py-4">
          <h2 className="flex items-center gap-2 text-lg font-bold text-slate-900">
            <Users size={20} className="text-indigo-600" />
            Patient Queue — {formatDateNice(selectedDate)}
          </h2>
        </div>
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 size={24} className="animate-spin text-indigo-500" />
          </div>
        ) : filteredAppts.length === 0 ? (
          <div className="py-12 text-center text-slate-400">
            <CalendarDays size={32} className="mx-auto text-slate-300" />
            <p className="mt-2 text-sm">No appointments scheduled for this date.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-5 py-3">Time</th>
                  <th className="px-5 py-3">Patient</th>
                  <th className="px-5 py-3">Doctor</th>
                  <th className="px-5 py-3">Reason</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredAppts
                  .slice()
                  .sort((a, b) => a.time_slot.localeCompare(b.time_slot))
                  .map((appt) => {
                    const doc = doctorMap[appt.doctor_id];
                    return (
                      <tr key={appt.id} className="transition hover:bg-slate-50/50">
                        <td className="whitespace-nowrap px-5 py-3 font-semibold text-slate-800">
                          {slotToLabel(appt.time_slot)}
                        </td>
                        <td className="px-5 py-3">
                          <div className="font-medium text-slate-800">{appt.patient_name}</div>
                          <div className="text-xs text-slate-400">
                            {appt.patient_age}y · {appt.patient_gender} · {appt.patient_phone}
                          </div>
                          <div className="font-mono text-[10px] text-slate-300">#{shortId(appt.id)}</div>
                        </td>
                        <td className="px-5 py-3 text-slate-600">{doc?.name ?? '—'}</td>
                        <td className="max-w-xs px-5 py-3">
                          <p className="truncate text-slate-600" title={appt.reason}>{appt.reason}</p>
                          {appt.prescription_notes && (
                            <p className="mt-1 truncate text-xs text-emerald-600" title={appt.prescription_notes}>
                              Rx: {appt.prescription_notes}
                            </p>
                          )}
                        </td>
                        <td className="px-5 py-3">
                          <StatusBadge status={appt.status} />
                        </td>
                        <td className="px-5 py-3">
                          <div className="flex items-center justify-end gap-1.5">
                            {appt.status === 'confirmed' && (
                              <>
                                <ActionButton
                                  onClick={() => updateStatus(appt.id, 'completed')}
                                  icon={<CheckCircle2 size={14} />}
                                  label="Complete"
                                  color="emerald"
                                />
                                <ActionButton
                                  onClick={() => setPrescriptionAppt(appt)}
                                  icon={<FileText size={14} />}
                                  label="Rx"
                                  color="indigo"
                                />
                                <ActionButton
                                  onClick={() => updateStatus(appt.id, 'cancelled')}
                                  icon={<XCircle size={14} />}
                                  label="Cancel"
                                  color="rose"
                                />
                              </>
                            )}
                            {appt.status === 'completed' && (
                              <ActionButton
                                onClick={() => setPrescriptionAppt(appt)}
                                icon={<FileText size={14} />}
                                label="View Rx"
                                color="indigo"
                              />
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Doctor schedule manager */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-5 py-4">
          <h2 className="flex items-center gap-2 text-lg font-bold text-slate-900">
            <Activity size={20} className="text-indigo-600" />
            Doctor Schedule Manager
          </h2>
          <p className="mt-0.5 text-sm text-slate-500">Toggle working availability or block specific hours.</p>
        </div>
        <div className="divide-y divide-slate-100">
          {doctors.map((doc) => (
            <div key={doc.id} className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <img src={doc.photo_url} alt={doc.name} className="h-12 w-12 rounded-xl object-cover object-top" />
                <div>
                  <p className="font-semibold text-slate-900">{doc.name}</p>
                  <p className="text-sm text-slate-500">{doc.specialty} · {doc.experience_years}y exp</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => toggleDoctorAvailability(doc)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${
                    doc.available ? 'bg-emerald-500' : 'bg-slate-300'
                  }`}
                  aria-label="Toggle availability"
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition ${
                      doc.available ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
                <span className={`text-sm font-medium ${doc.available ? 'text-emerald-600' : 'text-slate-400'}`}>
                  {doc.available ? 'On Duty' : 'Off Duty'}
                </span>
                <button
                  onClick={() => setBlockDoctor(doc)}
                  className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:border-indigo-300 hover:text-indigo-700"
                >
                  <Ban size={14} /> Block Hours
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Prescription modal */}
      {prescriptionAppt && (
        <PrescriptionModal
          appointment={prescriptionAppt}
          doctor={doctorMap[prescriptionAppt.doctor_id]}
          onClose={() => setPrescriptionAppt(null)}
          onSaved={() => {
            setPrescriptionAppt(null);
            load();
          }}
        />
      )}

      {/* Block hours modal */}
      {blockDoctor && (
        <BlockHoursModal
          doctor={blockDoctor}
          onClose={() => setBlockDoctor(null)}
          onSaved={() => {
            setBlockDoctor(null);
            load();
          }}
        />
      )}
    </div>
  );
}

function StatCard({
  label,
  value,
  icon,
  color,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  color: string;
}) {
  const colors: Record<string, string> = {
    brand: 'bg-brand-50 text-brand-700',
    amber: 'bg-amber-50 text-amber-700',
    emerald: 'bg-emerald-50 text-emerald-700',
    rose: 'bg-rose-50 text-rose-700',
  };
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center gap-2">
        <span className={`flex h-8 w-8 items-center justify-center rounded-lg ${colors[color]}`}>{icon}</span>
        <span className="text-sm font-medium text-slate-500">{label}</span>
      </div>
      <p className="mt-2 text-3xl font-extrabold text-slate-900">{value}</p>
    </div>
  );
}

function StatusBadge({ status }: { status: Appointment['status'] }) {
  const map: Record<string, { label: string; cls: string }> = {
    confirmed: { label: 'Confirmed', cls: 'bg-brand-50 text-brand-700 border-brand-200' },
    completed: { label: 'Completed', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    cancelled: { label: 'Cancelled', cls: 'bg-rose-50 text-rose-700 border-rose-200' },
  };
  const s = map[status];
  return (
    <span className={`inline-block rounded-full border px-2.5 py-0.5 text-xs font-semibold ${s.cls}`}>
      {s.label}
    </span>
  );
}

function ActionButton({
  onClick,
  icon,
  label,
  color,
}: {
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  color: string;
}) {
  const colors: Record<string, string> = {
    emerald: 'text-emerald-600 hover:bg-emerald-50 border-emerald-200',
    indigo: 'text-indigo-600 hover:bg-indigo-50 border-indigo-200',
    rose: 'text-rose-600 hover:bg-rose-50 border-rose-200',
  };
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition ${colors[color]}`}
    >
      {icon} {label}
    </button>
  );
}

function PrescriptionModal({
  appointment,
  doctor,
  onClose,
  onSaved,
}: {
  appointment: Appointment;
  doctor?: Doctor;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [notes, setNotes] = useState(appointment.prescription_notes ?? '');
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    await supabase.from('appointments').update({ prescription_notes: notes.trim() || null }).eq('id', appointment.id);
    setSaving(false);
    onSaved();
  }

  return (
    <Modal open onClose={onClose} title="Prescription Notes" subtitle={`${appointment.patient_name} · ${doctor?.name ?? ''}`} maxWidth="max-w-lg">
      <div className="space-y-4">
        <div className="rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-600">
          <span className="font-medium">{formatDateNice(appointment.appointment_date)}</span> at{' '}
          <span className="font-medium">{slotToLabel(appointment.time_slot)}</span>
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700">Reason for visit</label>
          <p className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600">
            {appointment.reason}
          </p>
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700">Prescription / Notes</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={5}
            className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-800 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
            placeholder="Enter medication, dosage, follow-up instructions..."
          />
        </div>
        <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
          <button onClick={onClose} className="rounded-xl px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-100">
            Close
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:opacity-60"
          >
            {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            Save Notes
          </button>
        </div>
      </div>
    </Modal>
  );
}

function BlockHoursModal({
  doctor,
  onClose,
  onSaved,
}: {
  doctor: Doctor;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [selectedDate, setSelectedDate] = useState(dateKey(new Date()));
  const [dateStrip] = useState(() => {
    const days: Date[] = [];
    for (let i = 0; i < 7; i++) days.push(new Date(Date.now() + i * 86400000));
    return days;
  });
  const [blocked, setBlocked] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setBlocked(doctor.blocked_slots?.[selectedDate] ?? []);
  }, [doctor.blocked_slots, selectedDate]);

  function toggleSlot(slot: string) {
    setBlocked((prev) => (prev.includes(slot) ? prev.filter((s) => s !== slot) : [...prev, slot]));
  }

  async function handleSave() {
    setSaving(true);
    const newBlocked = { ...doctor.blocked_slots, [selectedDate]: blocked };
    if (blocked.length === 0) delete newBlocked[selectedDate];
    await supabase.from('doctors').update({ blocked_slots: newBlocked }).eq('id', doctor.id);
    setSaving(false);
    onSaved();
  }

  return (
    <Modal open onClose={onClose} title="Block Hours" subtitle={doctor.name} maxWidth="max-w-lg">
      <div className="space-y-4">
        <div>
          <p className="mb-2 text-sm font-semibold text-slate-700">Select date</p>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {dateStrip.map((d) => {
              const key = dateKey(d);
              return (
                <button
                  key={key}
                  onClick={() => setSelectedDate(key)}
                  className={`flex min-w-[64px] flex-col items-center rounded-lg border px-2.5 py-1.5 text-xs transition ${
                    selectedDate === key
                      ? 'border-indigo-500 bg-indigo-50 text-indigo-700 ring-2 ring-indigo-200'
                      : 'border-slate-200 bg-white text-slate-600 hover:border-indigo-300'
                  }`}
                >
                  <span className="uppercase">{d.toLocaleDateString('en-US', { weekday: 'short' })}</span>
                  <span className="text-base font-bold">{d.getDate()}</span>
                </button>
              );
            })}
          </div>
        </div>
        <div>
          <p className="mb-2 text-sm font-semibold text-slate-700">Toggle blocked slots</p>
          <div className="grid grid-cols-3 gap-2">
            {SLOT_TIMES.map((slot) => (
              <button
                key={slot}
                onClick={() => toggleSlot(slot)}
                className={`rounded-xl border px-2 py-2.5 text-sm font-semibold transition ${
                  blocked.includes(slot)
                    ? 'border-rose-400 bg-rose-50 text-rose-700'
                    : 'border-slate-200 bg-white text-slate-700 hover:border-indigo-300'
                }`}
              >
                {slotToLabel(slot)}
                {blocked.includes(slot) && <span className="ml-1 text-xs">✕</span>}
              </button>
            ))}
          </div>
        </div>
        <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
          <button onClick={onClose} className="rounded-xl px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-100">
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:opacity-60"
          >
            {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            Save
          </button>
        </div>
      </div>
    </Modal>
  );
}
