import { useState } from 'react';
import { Activity, User, Stethoscope, LogOut, ChevronDown, Menu, X } from 'lucide-react';
import { useAuth } from '@/lib/auth';

interface NavbarProps {
  page: string;
  setPage: (p: Page) => void;
}

export type Page = 'doctors' | 'patient-dashboard' | 'admin-dashboard';

export function Navbar({ page, setPage }: NavbarProps) {
  const { user, loginAsPatient, loginAsAdmin, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const navItems: { id: Page; label: string; show: boolean }[] = [
    { id: 'doctors', label: 'Find Doctors', show: true },
    { id: 'patient-dashboard', label: 'My Appointments', show: user?.role === 'patient' },
    { id: 'admin-dashboard', label: 'Admin Dashboard', show: user?.role === 'admin' },
  ];

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/90 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <button
          onClick={() => setPage('doctors')}
          className="flex items-center gap-2.5 transition hover:opacity-80"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 text-white shadow-sm">
            <Activity size={20} strokeWidth={2.5} />
          </div>
          <div className="text-left">
            <div className="text-base font-bold leading-tight text-slate-900">MediBook</div>
            <div className="text-[10px] font-medium uppercase tracking-wider text-brand-600">Hospital System</div>
          </div>
        </button>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-1 md:flex">
          {navItems.filter((n) => n.show).map((item) => (
            <button
              key={item.id}
              onClick={() => setPage(item.id)}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
                page === item.id
                  ? 'bg-brand-50 text-brand-700'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              {item.label}
            </button>
          ))}
        </nav>

        {/* Auth / Demo switcher */}
        <div className="flex items-center gap-3">
          {user ? (
            <div className="relative">
              <button
                onClick={() => setMenuOpen((v) => !v)}
                className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 shadow-sm transition hover:border-brand-300 hover:bg-brand-50"
              >
                <span
                  className={`flex h-7 w-7 items-center justify-center rounded-full ${
                    user.role === 'admin' ? 'bg-indigo-100 text-indigo-700' : 'bg-brand-100 text-brand-700'
                  }`}
                >
                  {user.role === 'admin' ? <Stethoscope size={15} /> : <User size={15} />}
                </span>
                <span className="hidden sm:inline">{user.role === 'admin' ? 'Doctor/Admin' : 'Patient'}</span>
                <ChevronDown size={16} className="text-slate-400" />
              </button>
              {menuOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
                  <div className="absolute right-0 top-full z-20 mt-2 w-56 rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl animate-modal-in">
                    <div className="px-3 py-2">
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Signed in as</p>
                      <p className="truncate text-sm font-medium text-slate-800">{user.name}</p>
                      <p className="truncate text-xs text-slate-500">{user.email}</p>
                    </div>
                    <div className="my-1 h-px bg-slate-100" />
                    <button
                      onClick={() => {
                        loginAsPatient();
                        setPage('doctors');
                        setMenuOpen(false);
                      }}
                      className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-slate-700 transition hover:bg-brand-50"
                    >
                      <User size={16} className="text-brand-600" /> Switch to Patient
                    </button>
                    <button
                      onClick={() => {
                        loginAsAdmin();
                        setPage('admin-dashboard');
                        setMenuOpen(false);
                      }}
                      className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-slate-700 transition hover:bg-indigo-50"
                    >
                      <Stethoscope size={16} className="text-indigo-600" /> Switch to Doctor/Admin
                    </button>
                    <div className="my-1 h-px bg-slate-100" />
                    <button
                      onClick={() => {
                        logout();
                        setPage('doctors');
                        setMenuOpen(false);
                      }}
                      className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-rose-600 transition hover:bg-rose-50"
                    >
                      <LogOut size={16} /> Sign out
                    </button>
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  loginAsPatient();
                  setPage('doctors');
                }}
                className="hidden items-center gap-1.5 rounded-lg bg-brand-50 px-3 py-1.5 text-sm font-medium text-brand-700 transition hover:bg-brand-100 sm:flex"
              >
                <User size={15} /> Login as Patient
              </button>
              <button
                onClick={() => {
                  loginAsAdmin();
                  setPage('admin-dashboard');
                }}
                className="hidden items-center gap-1.5 rounded-lg bg-indigo-50 px-3 py-1.5 text-sm font-medium text-indigo-700 transition hover:bg-indigo-100 sm:flex"
              >
                <Stethoscope size={15} /> Login as Doctor/Admin
              </button>
            </div>
          )}

          {/* Mobile toggle */}
          <button
            onClick={() => setMobileOpen((v) => !v)}
            className="rounded-lg p-2 text-slate-600 transition hover:bg-slate-100 md:hidden"
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="border-t border-slate-100 bg-white px-4 py-3 md:hidden">
          {navItems.filter((n) => n.show).map((item) => (
            <button
              key={item.id}
              onClick={() => {
                setPage(item.id);
                setMobileOpen(false);
              }}
              className={`block w-full rounded-lg px-3 py-2.5 text-left text-sm font-medium transition ${
                page === item.id ? 'bg-brand-50 text-brand-700' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {item.label}
            </button>
          ))}
          {!user && (
            <div className="mt-2 grid grid-cols-2 gap-2">
              <button
                onClick={() => {
                  loginAsPatient();
                  setPage('doctors');
                  setMobileOpen(false);
                }}
                className="rounded-lg bg-brand-50 px-3 py-2 text-sm font-medium text-brand-700"
              >
                Patient
              </button>
              <button
                onClick={() => {
                  loginAsAdmin();
                  setPage('admin-dashboard');
                  setMobileOpen(false);
                }}
                className="rounded-lg bg-indigo-50 px-3 py-2 text-sm font-medium text-indigo-700"
              >
                Doctor/Admin
              </button>
            </div>
          )}
        </div>
      )}
    </header>
  );
}
