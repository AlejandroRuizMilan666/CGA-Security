'use client';

import { Badge } from '@/components/ui/badge';
import { Spinner } from '@/components/ui/spinner';
import { StatCard } from '@/components/ui/stat-card';
import { useAuth } from '@/lib/auth-context';
import { fetchMyEnrollments, type EnrollmentWithProgress } from '@/lib/courses-service';
import { faCircleCheck, faGraduationCap, faHourglassHalf } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import Link from 'next/link';
import { useEffect, useState } from 'react';

function paymentBadge(status: string) {
  if (status === 'COMPLETED') return <Badge label="Pagado" variant="green" />;
  if (status === 'PENDING') return <Badge label="Pendiente" variant="yellow" />;
  return <Badge label="Fallido" variant="red" />;
}

export default function AlumnoDashboard() {
  const { user } = useAuth();
  const [enrollments, setEnrollments] = useState<EnrollmentWithProgress[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMyEnrollments()
      .then(setEnrollments)
      .finally(() => setLoading(false));
  }, []);

  const completed = enrollments.filter((e) => e.progressPercent === 100).length;

  return (
    <div className="space-y-8">
      <div>
        <p className="text-sm font-semibold uppercase tracking-widest text-cyan-400">
          Panel de alumno
        </p>
        <h1 className="mt-1 text-2xl font-bold text-white">
          Hola, {user?.fullName}
        </h1>
        <p className="mt-1 text-sm text-slate-400">
          Continúa donde lo dejaste o explora nuevos cursos
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Spinner size="lg" /></div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <StatCard
              title="Cursos inscritos"
              value={enrollments.length}
              icon={<FontAwesomeIcon icon={faGraduationCap} className="text-lg" />}
            />
            <StatCard
              title="Completados"
              value={completed}
              icon={<FontAwesomeIcon icon={faCircleCheck} className="text-lg" />}
              sub="100% progreso"
            />
            <StatCard
              title="En progreso"
              value={enrollments.length - completed}
              icon={<FontAwesomeIcon icon={faHourglassHalf} className="text-lg" />}
            />
          </div>

          {/* Active enrollments */}
          {enrollments.length > 0 && (
            <div>
              <div className="mb-4">
                <h2 className="text-lg font-semibold text-white">Mis cursos</h2>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {enrollments.slice(0, 4).map((enrollment) => (
                  <Link
                    key={enrollment.id}
                    href={`/alumno/mis-cursos/${enrollment.course.id}`}
                    className="cursor-pointer rounded-2xl border border-slate-800 bg-slate-900/80 p-5 hover:border-cyan-500/40 hover:bg-slate-800 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-semibold text-white">{enrollment.course.title}</h3>
                      {paymentBadge(enrollment.paymentStatus)}
                    </div>
                    <div className="mt-3">
                      <div className="flex justify-between text-xs text-slate-400 mb-1">
                        <span>Progreso</span>
                        <span>{Math.round(enrollment.progressPercent)}%</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-slate-700">
                        <div
                          className="h-1.5 rounded-full bg-cyan-400 transition-all"
                          style={{ width: `${enrollment.progressPercent}%` }}
                        />
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-3">
            <Link
              href="/alumno/catalogo"
              className="primary-button"
            >
              Explorar catálogo
            </Link>
            {enrollments.length > 0 && (
              <Link
                href="/alumno/mis-cursos"
                className="cursor-pointer rounded-xl border border-slate-700 px-5 py-2.5 text-sm font-semibold text-slate-300 hover:bg-slate-800 transition-colors"
              >
                Ver todos mis cursos
              </Link>
            )}
          </div>
        </>
      )}
    </div>
  );
}
