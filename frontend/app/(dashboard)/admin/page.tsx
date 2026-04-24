'use client';

import { Spinner } from '@/components/ui/spinner';
import { StatCard } from '@/components/ui/stat-card';
import { fetchCompanies } from '@/lib/companies-service';
import { fetchAllCourses } from '@/lib/courses-service';
import { fetchUsers } from '@/lib/users-service';
import {
    faBook,
    faBuilding,
    faPlus,
    faUsers,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import Link from 'next/link';
import { useEffect, useState } from 'react';

export default function AdminDashboard() {
  const [stats, setStats] = useState({ users: 0, companies: 0, courses: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [users, companies, courses] = await Promise.all([
          fetchUsers(),
          fetchCompanies(),
          fetchAllCourses(),
        ]);
        setStats({ users: users.length, companies: companies.length, courses: courses.length });
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, []);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white">Panel de administración</h1>
        <p className="mt-1 text-sm text-slate-400">
          Resumen global de la plataforma CGA Security
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Spinner size="lg" />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <StatCard
              title="Usuarios registrados"
              value={stats.users}
              icon={<FontAwesomeIcon icon={faUsers} className="text-lg" />}
              sub="Alumnos, empresas y admins"
            />
            <StatCard
              title="Empresas"
              value={stats.companies}
              icon={<FontAwesomeIcon icon={faBuilding} className="text-lg" />}
              sub="Con acceso al panel empresarial"
            />
            <StatCard
              title="Cursos"
              value={stats.courses}
              icon={<FontAwesomeIcon icon={faBook} className="text-lg" />}
              sub="Publicados y borradores"
            />
          </div>

          <div>
            <h2 className="mb-4 text-lg font-semibold text-white">Acceso rápido</h2>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {[
                { href: '/admin/users', label: 'Gestionar usuarios', icon: <FontAwesomeIcon icon={faUsers} />, desc: 'Alta, edición y desactivación' },
                { href: '/admin/companies', label: 'Ver empresas', icon: <FontAwesomeIcon icon={faBuilding} />, desc: 'Detalle y auditorías' },
                { href: '/admin/courses', label: 'Gestionar cursos', icon: <FontAwesomeIcon icon={faBook} />, desc: 'Crear, editar y publicar' },
                { href: '/admin/courses/new', label: 'Crear curso', icon: <FontAwesomeIcon icon={faPlus} />, desc: 'Nuevo curso con módulos' },
              ].map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="cursor-pointer rounded-2xl border border-slate-800 bg-slate-900/80 p-5 hover:border-cyan-500/40 hover:bg-slate-800 transition-colors"
                >
                  <span className="text-2xl">{item.icon}</span>
                  <p className="mt-3 font-semibold text-white">{item.label}</p>
                  <p className="mt-1 text-xs text-slate-400">{item.desc}</p>
                </Link>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
