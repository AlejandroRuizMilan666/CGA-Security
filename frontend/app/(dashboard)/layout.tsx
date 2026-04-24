'use client';

import { Spinner } from '@/components/ui/spinner';
import { useAuth } from '@/lib/auth-context';
import {
    faBars,
    faBook,
    faBuilding,
    faFile,
    faGear,
    faGraduationCap,
    faHouse,
    faMagnifyingGlass,
    faRightFromBracket,
    faUser,
    faUsers,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState, type ReactNode } from 'react';

/* ─── Nav definitions by role ─────────────────────────────────────────── */

const ADMIN_LINKS = [
  { href: '/admin', label: 'Dashboard', icon: <FontAwesomeIcon icon={faHouse} /> },
  { href: '/admin/users', label: 'Usuarios', icon: <FontAwesomeIcon icon={faUsers} /> },
  { href: '/admin/companies', label: 'Empresas', icon: <FontAwesomeIcon icon={faBuilding} /> },
  { href: '/admin/courses', label: 'Cursos', icon: <FontAwesomeIcon icon={faBook} /> },
];

const EMPRESA_LINKS = [
  { href: '/empresa', label: 'Dashboard', icon: <FontAwesomeIcon icon={faHouse} /> },
  { href: '/empresa/documentos', label: 'Documentos', icon: <FontAwesomeIcon icon={faFile} /> },
  { href: '/empresa/perfil', label: 'Perfil empresa', icon: <FontAwesomeIcon icon={faGear} /> },
];

const ALUMNO_LINKS = [
  { href: '/alumno', label: 'Dashboard', icon: <FontAwesomeIcon icon={faHouse} /> },
  { href: '/alumno/catalogo', label: 'Catálogo', icon: <FontAwesomeIcon icon={faMagnifyingGlass} /> },
  { href: '/alumno/mis-cursos', label: 'Mis cursos', icon: <FontAwesomeIcon icon={faGraduationCap} /> },
  { href: '/alumno/perfil', label: 'Mi perfil', icon: <FontAwesomeIcon icon={faUser} /> },
];

function navLinks(role: string | null) {
  if (role === 'ADMIN') return ADMIN_LINKS;
  if (role === 'EMPRESA') return EMPRESA_LINKS;
  if (role === 'ALUMNO') return ALUMNO_LINKS;
  return [];
}

function roleLabel(role: string | null) {
  if (role === 'ADMIN') return 'Administrador';
  if (role === 'EMPRESA') return 'Empresa';
  if (role === 'ALUMNO') return 'Alumno';
  return '';
}

/* ─── Layout ──────────────────────────────────────────────────────────── */

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const { user, role, isLoading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (!isLoading && !user) {
      router.replace('/');
    }
  }, [isLoading, user, router]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!user) return null;

  const links = navLinks(role);

  async function handleLogout() {
    await logout();
    router.replace('/');
  }

  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-100">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/60 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-30 flex w-64 flex-col border-r border-slate-800 bg-slate-900 transition-transform lg:static lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Logo */}
        <div className="flex h-16 items-center gap-2 border-b border-slate-800 px-5">
          <span className="text-lg font-bold text-cyan-400">CGA</span>
          <span className="text-lg font-semibold text-white">Security</span>
        </div>

        {/* User info */}
        <div className="border-b border-slate-800 px-5 py-4">
          <p className="text-sm font-semibold text-white truncate">{user.fullName}</p>
          <p className="text-xs text-slate-400 truncate">{user.email}</p>
          <span className="mt-1 inline-block rounded-full bg-cyan-500/15 px-2 py-0.5 text-xs font-semibold text-cyan-300">
            {roleLabel(role)}
          </span>
        </div>

        {/* Nav links */}
        <nav className="flex-1 overflow-y-auto px-3 py-4">
          <ul className="space-y-1">
            {links.map((link) => {
              const isActive = pathname === link.href;
              return (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    onClick={() => setSidebarOpen(false)}
                    className={`cursor-pointer flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-cyan-500/15 text-cyan-300'
                        : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                    }`}
                  >
                    <span>{link.icon}</span>
                    {link.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Logout */}
        <div className="border-t border-slate-800 p-3">
          <button
            type="button"
            onClick={handleLogout}
            className="cursor-pointer flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
          >
            <FontAwesomeIcon icon={faRightFromBracket} className="w-4" />
            Cerrar sesión
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Mobile top bar */}
        <header className="flex h-16 items-center gap-4 border-b border-slate-800 bg-slate-900 px-4 lg:hidden">
          <button
            type="button"
            aria-label="Abrir menú"
            onClick={() => setSidebarOpen(true)}
            className="cursor-pointer rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white"
          >
            <FontAwesomeIcon icon={faBars} />
          </button>
          <span className="font-bold text-cyan-400">CGA Security</span>
        </header>

        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}
