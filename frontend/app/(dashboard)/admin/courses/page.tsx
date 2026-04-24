'use client';

import { Badge } from '@/components/ui/badge';
import { Spinner } from '@/components/ui/spinner';
import { deleteCourseApi, fetchAllCourses, updateCourseApi, type CourseFull } from '@/lib/courses-service';
import Link from 'next/link';
import { useEffect, useState } from 'react';

export default function AdminCoursesPage() {
  const [courses, setCourses] = useState<CourseFull[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    try {
      setCourses(await fetchAllCourses());
    } catch {
      setError('No se pudieron cargar los cursos');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void load(); }, []);

  async function handleDelete(id: string, title: string) {
    if (!confirm(`¿Eliminar el curso "${title}"? Esta acción no se puede deshacer.`)) return;
    setDeletingId(id);
    try {
      await deleteCourseApi(id);
      await load();
    } catch {
      setError('No se pudo eliminar el curso');
    } finally {
      setDeletingId(null);
    }
  }

  async function handleTogglePublished(course: CourseFull) {
    setTogglingId(course.id);
    try {
      await updateCourseApi(course.id, { isPublished: !course.isPublished });
      await load();
    } catch {
      setError('No se pudo cambiar el estado del curso');
    } finally {
      setTogglingId(null);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Gestión de cursos</h1>
          <p className="mt-1 text-sm text-slate-400">{courses.length} cursos en la plataforma</p>
        </div>
        <Link
          href="/admin/courses/new"
          className="primary-button"
        >
          + Crear curso
        </Link>
      </div>

      {error && (
        <p className="rounded-xl bg-red-500/15 px-4 py-3 text-sm text-red-300">{error}</p>
      )}

      {loading ? (
        <div className="flex justify-center py-16"><Spinner size="lg" /></div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-slate-800">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-900/60">
                <th className="px-4 py-3 text-left font-semibold text-slate-400">Título</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-400">Estado</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-400">Precio</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-400">Módulos</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-400">Inscritos</th>
                <th className="px-4 py-3 text-right font-semibold text-slate-400">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {courses.map((course) => (
                <tr key={course.id} className="border-b border-slate-800/50 hover:bg-slate-800/30">
                  <td className="px-4 py-3">
                    <p className="font-medium text-white">{course.title}</p>
                    <p className="text-xs text-slate-500">{course.slug}</p>
                  </td>
                  <td className="px-4 py-3">
                    <Badge
                      label={course.isPublished ? 'Publicado' : 'Borrador'}
                      variant={course.isPublished ? 'green' : 'yellow'}
                    />
                  </td>
                  <td className="px-4 py-3 text-slate-300">
                    {course.price === 0 ? 'Gratis' : `${course.price} €`}
                  </td>
                  <td className="px-4 py-3 text-slate-300">{course.modules.length}</td>
                  <td className="px-4 py-3 text-slate-300">{course.enrollmentCount}</td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        disabled={togglingId === course.id}
                        onClick={() => handleTogglePublished(course)}
                        className="cursor-pointer rounded-lg bg-slate-700 px-3 py-1 text-xs font-semibold hover:bg-slate-600 transition-colors disabled:cursor-not-allowed"
                      >
                        {togglingId === course.id ? '...' : course.isPublished ? 'Ocultar' : 'Publicar'}
                      </button>
                      <Link
                        href={`/admin/courses/${course.id}/edit`}
                        className="cursor-pointer rounded-lg bg-cyan-500/20 px-3 py-1 text-xs font-semibold text-cyan-300 hover:bg-cyan-500/30 transition-colors"
                      >
                        Editar
                      </Link>
                      <button
                        type="button"
                        disabled={deletingId === course.id}
                        onClick={() => handleDelete(course.id, course.title)}
                        className="cursor-pointer rounded-lg bg-red-500/15 px-3 py-1 text-xs font-semibold text-red-300 hover:bg-red-500/25 transition-colors disabled:cursor-not-allowed"
                      >
                        {deletingId === course.id ? '...' : 'Eliminar'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {courses.length === 0 && (
            <p className="py-10 text-center text-sm text-slate-500">
              No hay cursos todavía.{' '}
              <Link href="/admin/courses/new" className="cursor-pointer text-cyan-400 hover:underline">
                Crear el primero
              </Link>
            </p>
          )}
        </div>
      )}
    </div>
  );
}
