'use client';

import { Badge } from '@/components/ui/badge';
import { Spinner } from '@/components/ui/spinner';
import { fetchMyEnrollments, type EnrollmentWithProgress } from '@/lib/courses-service';
import Link from 'next/link';
import { useEffect, useState } from 'react';

function paymentVariant(status: string): 'green' | 'yellow' | 'red' {
  if (status === 'COMPLETED') return 'green';
  if (status === 'PENDING') return 'yellow';
  return 'red';
}

function paymentLabel(status: string) {
  if (status === 'COMPLETED') return 'Pagado';
  if (status === 'PENDING') return 'Pendiente';
  return 'Fallido';
}

export default function MisCursosPage() {
  const [enrollments, setEnrollments] = useState<EnrollmentWithProgress[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMyEnrollments()
      .then(setEnrollments)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Mis cursos</h1>
        <p className="mt-1 text-sm text-slate-400">
          {enrollments.length} {enrollments.length !== 1 ? 'inscripciones' : 'inscripción'}
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Spinner size="lg" /></div>
      ) : enrollments.length === 0 ? (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/50 py-16 text-center">
          <p className="text-slate-400">Todavía no estás inscrito en ningún curso</p>
          <Link
            href="/alumno/catalogo"
            className="cursor-pointer mt-4 inline-block text-sm font-semibold text-cyan-400 hover:text-cyan-300"
          >
            Explorar catálogo →
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {enrollments.map((enrollment) => {
            const moduleCount = enrollment.course.modules?.length ?? 0;

            return (
            <Link
              key={enrollment.id}
              href={`/alumno/mis-cursos/${enrollment.course.id}`}
              className="cursor-pointer block rounded-2xl border border-slate-800 bg-slate-900/80 p-5 hover:border-cyan-500/40 hover:bg-slate-800 transition-colors"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="font-bold text-white">{enrollment.course.title}</h2>
                  {enrollment.course.description && (
                    <p className="mt-1 text-sm text-slate-400 line-clamp-1">
                      {enrollment.course.description}
                    </p>
                  )}
                </div>
                <Badge
                  label={paymentLabel(enrollment.paymentStatus)}
                  variant={paymentVariant(enrollment.paymentStatus)}
                />
              </div>

              <div className="mt-4 space-y-1">
                <div className="flex justify-between text-xs text-slate-400">
                  <span>
                    {moduleCount} módulo{moduleCount !== 1 ? 's' : ''}
                  </span>
                  <span>{Math.round(enrollment.progressPercent)}% completado</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-slate-700">
                  <div
                    className="h-2 rounded-full bg-cyan-400 transition-all"
                    style={{ width: `${enrollment.progressPercent}%` }}
                  />
                </div>
              </div>

              <p className="mt-3 text-xs text-slate-500">
                Inscrito el {new Date(enrollment.enrolledAt).toLocaleDateString('es-ES', {
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric',
                })}
              </p>
            </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
