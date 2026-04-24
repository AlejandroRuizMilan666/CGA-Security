'use client';

import { Spinner } from '@/components/ui/spinner';
import { useAuth } from '@/lib/auth-context';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

const ROLE_ROUTES: Record<string, string> = {
  ADMIN: '/admin',
  EMPRESA: '/empresa',
  ALUMNO: '/alumno',
};

const SERVICES = [
  {
    icon: '🔐',
    title: 'Auditorías de Seguridad',
    description:
      'Análisis y diagnóstico profesional de la postura de seguridad de tu empresa. Panel privado para el intercambio seguro de informes y documentación de auditoría.',
  },
  {
    icon: '🎓',
    title: 'Formación Online',
    description:
      'Catálogo de cursos especializados en ciberseguridad. Aprende a tu ritmo con seguimiento de progreso por módulo y acceso a materiales en cualquier dispositivo.',
  },
  {
    icon: '🏢',
    title: 'Panel Empresarial',
    description:
      'Entorno privado para empresas clientes. Descarga informes, comparte documentación con el equipo de CGA Security y gestiona tu perfil de forma segura.',
  },
];

export default function Home() {
  const { user, role, isLoading } = useAuth();
  const router = useRouter();

  /* If already logged in, redirect to the appropriate dashboard */
  useEffect(() => {
    if (!isLoading && user) {
      router.replace(ROLE_ROUTES[role ?? ''] ?? '/login');
    }
  }, [isLoading, user, role, router]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950">
        <Spinner size="lg" />
      </div>
    );
  }

  if (user) return null;

  return (
    <div className="flex min-h-screen flex-col bg-slate-950 text-slate-100">
      {/* ── Nav bar ─────────────────────────────────────────────────── */}
      <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-1.5">
            <span className="text-xl font-bold text-cyan-400">CGA</span>
            <span className="text-xl font-bold text-white">Security</span>
          </div>
          <nav className="flex items-center gap-3">
            <Link
              href="/login"
              className="rounded-xl border border-slate-700 px-4 py-2 text-sm font-semibold text-slate-300 transition-colors hover:border-slate-500 hover:text-white"
            >
              Iniciar sesión
            </Link>
            <Link
              href="/register"
              className="rounded-xl bg-cyan-400 px-4 py-2 text-sm font-bold text-slate-950 transition-colors hover:bg-cyan-300"
            >
              Registrarse
            </Link>
          </nav>
        </div>
      </header>

      <main className="flex-1">
        {/* ── Hero ──────────────────────────────────────────────────── */}
        <section className="mx-auto max-w-6xl px-6 py-24 text-center">
          <div className="mb-4 inline-block rounded-full border border-cyan-500/30 bg-cyan-500/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-cyan-400">
            Ciberseguridad profesional
          </div>
          <h1 className="mt-4 text-4xl font-extrabold leading-tight tracking-tight text-white sm:text-5xl lg:text-6xl">
            Protege tu empresa.
            <br />
            <span className="text-cyan-400">Forma a tu equipo.</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-slate-400">
            CGA Security combina servicios profesionales de ciberseguridad con una plataforma de
            formación online. Un único acceso para auditorías, documentación segura y cursos
            especializados.
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              href="/register"
              className="rounded-xl bg-cyan-400 px-8 py-3.5 text-base font-bold text-slate-950 transition-colors hover:bg-cyan-300"
            >
              Crear cuenta gratuita
            </Link>
            <Link
              href="/login"
              className="rounded-xl border border-slate-700 px-8 py-3.5 text-base font-semibold text-slate-300 transition-colors hover:border-slate-500 hover:text-white"
            >
              Iniciar sesión
            </Link>
          </div>
        </section>

        {/* ── Services ──────────────────────────────────────────────── */}
        <section className="border-t border-slate-800 bg-slate-900/50 py-20">
          <div className="mx-auto max-w-6xl px-6">
            <h2 className="mb-12 text-center text-2xl font-bold text-white">
              Todo en una sola plataforma
            </h2>
            <div className="grid gap-6 sm:grid-cols-3">
              {SERVICES.map((s) => (
                <div
                  key={s.title}
                  className="rounded-2xl border border-slate-800 bg-slate-900 p-7 transition-colors hover:border-slate-700"
                >
                  <div className="mb-4 text-4xl">{s.icon}</div>
                  <h3 className="mb-2 text-lg font-bold text-white">{s.title}</h3>
                  <p className="text-sm leading-relaxed text-slate-400">{s.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      {/* ── Footer ────────────────────────────────────────────────── */}
      <footer className="border-t border-slate-800 py-8 text-center text-sm text-slate-500">
        © {new Date().getFullYear()} CGA Security. Todos los derechos reservados.
      </footer>
    </div>
  );
}

