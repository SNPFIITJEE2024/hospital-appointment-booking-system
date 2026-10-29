import { Star, Clock, DollarSign, BadgeCheck } from 'lucide-react';
import type { Doctor } from '@/lib/supabase';
import { SPECIALTY_META } from '@/lib/constants';

interface DoctorCardProps {
  doctor: Doctor;
  onBook: (doctor: Doctor) => void;
}

export function DoctorCard({ doctor, onBook }: DoctorCardProps) {
  const meta = SPECIALTY_META[doctor.specialty as keyof typeof SPECIALTY_META];

  return (
    <div className="group flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg">
      <div className="relative h-44 w-full overflow-hidden bg-slate-100">
        <img
          src={doctor.photo_url}
          alt={doctor.name}
          className="h-full w-full object-cover object-top transition duration-300 group-hover:scale-105"
          loading="lazy"
        />
        <div className="absolute left-3 top-3">
          <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${meta?.chip ?? 'bg-slate-100 text-slate-700'}`}>
            {meta?.emoji} {doctor.specialty}
          </span>
        </div>
        <div className="absolute right-3 top-3">
          {doctor.available ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/95 px-2.5 py-1 text-xs font-semibold text-white shadow-sm">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white" /> Available
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 rounded-full bg-slate-600/90 px-2.5 py-1 text-xs font-semibold text-white">
              Off Duty
            </span>
          )}
        </div>
      </div>

      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h3 className="text-base font-bold text-slate-900">{doctor.name}</h3>
            <div className="mt-0.5 flex items-center gap-1 text-sm text-slate-500">
              <BadgeCheck size={14} className="text-brand-500" />
              {doctor.experience_years} yrs experience
            </div>
          </div>
          <div className="flex items-center gap-1 rounded-lg bg-amber-50 px-2 py-1">
            <Star size={14} className="fill-amber-400 text-amber-400" />
            <span className="text-sm font-bold text-amber-700">{doctor.rating.toFixed(1)}</span>
          </div>
        </div>

        <p className="mt-3 line-clamp-2 text-sm leading-relaxed text-slate-600">{doctor.bio}</p>

        <div className="mt-4 flex items-center gap-4 border-t border-slate-100 pt-4 text-sm">
          <div className="flex items-center gap-1.5 text-slate-600">
            <Clock size={15} className="text-slate-400" />
            <span className="font-medium">${doctor.fee.toFixed(0)}</span>
            <span className="text-slate-400">/ visit</span>
          </div>
          <div className="flex items-center gap-1.5 text-slate-600">
            <DollarSign size={15} className="text-slate-400" />
            <span className="font-medium">6 slots</span>
            <span className="text-slate-400">/ day</span>
          </div>
        </div>

        <button
          onClick={() => onBook(doctor)}
          disabled={!doctor.available}
          className={`mt-4 w-full rounded-xl py-2.5 text-sm font-semibold transition ${
            doctor.available
              ? 'bg-brand-600 text-white shadow-sm hover:bg-brand-700 active:scale-[0.98]'
              : 'cursor-not-allowed bg-slate-100 text-slate-400'
          }`}
        >
          {doctor.available ? 'Book Appointment' : 'Currently Unavailable'}
        </button>
      </div>
    </div>
  );
}
