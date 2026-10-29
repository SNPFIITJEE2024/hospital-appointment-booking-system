import { useState } from 'react';
import { AuthProvider, useAuth } from '@/lib/auth';
import { Navbar, type Page } from '@/components/Navbar';
import { DoctorListing } from '@/pages/DoctorListing';
import { PatientDashboard } from '@/pages/PatientDashboard';
import { AdminDashboard } from '@/pages/AdminDashboard';

function AppInner() {
  const { user } = useAuth();
  const [page, setPage] = useState<Page>('doctors');

  // Guard protected pages
  const effectivePage: Page =
    page === 'patient-dashboard' && user?.role !== 'patient'
      ? 'doctors'
      : page === 'admin-dashboard' && user?.role !== 'admin'
      ? 'doctors'
      : page;

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar page={effectivePage} setPage={setPage} />
      <main className="animate-fade-in">
        {effectivePage === 'doctors' && <DoctorListing />}
        {effectivePage === 'patient-dashboard' && <PatientDashboard setPage={setPage} />}
        {effectivePage === 'admin-dashboard' && <AdminDashboard />}
      </main>
      <footer className="border-t border-slate-200 bg-white py-6">
        <div className="mx-auto max-w-7xl px-4 text-center text-sm text-slate-400 sm:px-6 lg:px-8">
          MediBook Hospital Appointment System · Real-time slot booking with conflict prevention
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppInner />
    </AuthProvider>
  );
}
