import { useState, useMemo, useEffect } from 'react';
import { Search, Stethoscope, AlertCircle } from 'lucide-react';
import type { Doctor } from '@/lib/supabase';
import { supabase } from '@/lib/supabase';
import { SPECIALTIES } from '@/lib/constants';
import { DoctorCard } from '@/components/DoctorCard';
import { BookingModal } from '@/components/BookingModal';

export function DoctorListing() {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [activeSpecialty, setActiveSpecialty] = useState<string>('All');
  const [bookingDoctor, setBookingDoctor] = useState<Doctor | null>(null);

  async function loadDoctors() {
    setLoading(true);
    setError(null);
    const { data, error } = await supabase
      .from('doctors')
      .select('*')
      .order('rating', { ascending: false });
    if (error) {
      setError(error.message);
    } else {
      setDoctors((data ?? []) as Doctor[]);
    }
    setLoading(false);
  }

  useEffect(() => {
    loadDoctors();
  }, []);

  const filtered = useMemo(() => {
    return doctors.filter((d) => {
      const matchesSearch =
        d.name.toLowerCase().includes(search.toLowerCase()) ||
        d.specialty.toLowerCase().includes(search.toLowerCase());
      const matchesSpecialty = activeSpecialty === 'All' || d.specialty === activeSpecialty;
      return matchesSearch && matchesSpecialty;
    });
  }, [doctors, search, activeSpecialty]);

  const filterPills = ['All', ...SPECIALTIES];

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Hero */}
      <div className="mb-8 overflow-hidden rounded-3xl bg-gradient-to-br from-brand-600 via-brand-700 to-brand-900 px-6 py-10 text-white shadow-lg sm:px-10 sm:py-14">
        <div className="flex items-center gap-2 text-brand-200">
          <Stethoscope size={20} />
          <span className="text-sm font-semibold uppercase tracking-wide">Book your appointment</span>
        </div>
        <h1 className="mt-3 max-w-2xl text-3xl font-extrabold leading-tight sm:text-4xl">
          Find the right specialist for your care
        </h1>
        <p className="mt-3 max-w-xl text-brand-100">
          Browse verified doctors across six departments, check real-time slot availability, and book in minutes.
        </p>
      </div>

      {/* Search */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by doctor name or specialty..."
            className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-11 pr-4 text-sm text-slate-800 shadow-sm outline-none transition focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
          />
        </div>
        <div className="text-sm text-slate-500">
          {loading ? 'Loading...' : `${filtered.length} doctor${filtered.length !== 1 ? 's' : ''} found`}
        </div>
      </div>

      {/* Specialty filter pills */}
      <div className="mb-8 flex flex-wrap gap-2">
        {filterPills.map((pill) => (
          <button
            key={pill}
            onClick={() => setActiveSpecialty(pill)}
            className={`rounded-full px-4 py-2 text-sm font-medium transition ${
              activeSpecialty === pill
                ? 'bg-brand-600 text-white shadow-sm'
                : 'border border-slate-200 bg-white text-slate-600 hover:border-brand-300 hover:text-brand-700'
            }`}
          >
            {pill}
          </button>
        ))}
      </div>

      {/* Grid */}
      {error ? (
        <div className="flex items-center gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4 text-rose-700">
          <AlertCircle size={20} />
          <span className="text-sm">{error}</span>
        </div>
      ) : loading ? (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-80 animate-pulse rounded-2xl border border-slate-200 bg-slate-100" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white py-16 text-center">
          <Search size={32} className="mx-auto text-slate-300" />
          <p className="mt-3 text-slate-500">No doctors match your search.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((doctor) => (
            <DoctorCard key={doctor.id} doctor={doctor} onBook={setBookingDoctor} />
          ))}
        </div>
      )}

      {bookingDoctor && (
        <BookingModal
          doctor={bookingDoctor}
          onClose={() => setBookingDoctor(null)}
          onBooked={() => {
            setBookingDoctor(null);
            loadDoctors();
          }}
        />
      )}
    </div>
  );
}
