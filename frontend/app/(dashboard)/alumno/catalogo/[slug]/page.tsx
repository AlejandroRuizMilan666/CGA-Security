'use client';

import { Spinner } from '@/components/ui/spinner';
import {
    enrollInCourseApi,
    fetchCourseBySlug,
    fetchMyEnrollments,
    type CourseFull,
} from '@/lib/courses-service';
import { faBook, faCircleCheck, faFile, faFileLines, faUsers, faVideo } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useParams, useRouter } from 'next/navigation';
import type { ReactElement } from 'react';
import { useEffect, useState } from 'react';

function moduleTypeIcon(type: string): ReactElement {
  if (type === 'VIDEO') return <FontAwesomeIcon icon={faVideo} />;
  if (type === 'DOCUMENT') return <FontAwesomeIcon icon={faFile} />;
  return <FontAwesomeIcon icon={faFileLines} />;
}

function moduleTypeLabel(type: string) {
  if (type === 'VIDEO') return 'Vídeo';
  if (type === 'DOCUMENT') return 'Documento';
  return 'Texto';
}

export default function CourseDetailPage() {
  const params = useParams<{ slug: string }>();
  const router = useRouter();
  const [course, setCourse] = useState<CourseFull | null>(null);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const [courseData, enrollments] = await Promise.all([
          fetchCourseBySlug(params.slug),
          fetchMyEnrollments(),
        ]);
        setCourse(courseData);
        setIsEnrolled(enrollments.some((e) => e.course.id === courseData.id));
      } catch {
        setError('No se pudo cargar el curso');
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, [params.slug]);

  async function handleEnroll() {
    if (!course) return;
    setEnrolling(true);
    setError(null);
    try {
      await enrollInCourseApi(course.id);
      setIsEnrolled(true);
      setSuccess('¡Inscripción completada! Ya puedes acceder al contenido.');
    } catch {
      setError('No se pudo completar la inscripción');
    } finally {
      setEnrolling(false);
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!course) {
    return <p className="text-slate-400">Curso no encontrado</p>;
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <button
        type="button"
        onClick={() => router.back()}
        className="cursor-pointer text-sm text-slate-400 hover:text-white transition-colors"
      >
        ← Volver al catálogo
      </button>

      <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6">
        <h1 className="text-2xl font-bold text-white">{course.title}</h1>
        {course.description && (
          <p className="mt-3 text-slate-300">{course.description}</p>
        )}

        <div className="mt-5 flex flex-wrap gap-4 border-t border-slate-800 pt-5 text-sm">
          <span className="text-slate-400">
            <FontAwesomeIcon icon={faBook} className="mr-1" />{course.modules.length} módulo{course.modules.length !== 1 ? 's' : ''}
          </span>
          <span className="text-slate-400"><FontAwesomeIcon icon={faUsers} className="mr-1" />{course.enrollmentCount} inscritos</span>
          <span className="font-bold text-cyan-300">
            {course.price === 0 ? 'Gratis' : `${course.price} €`}
          </span>
        </div>
      </div>

      {success && (
        <p className="rounded-xl bg-emerald-500/15 px-4 py-3 text-sm text-emerald-300">{success}</p>
      )}
      {error && (
        <p className="rounded-xl bg-red-500/15 px-4 py-3 text-sm text-red-300">{error}</p>
      )}

      {/* Enroll CTA */}
      {isEnrolled ? (
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="flex-1 rounded-xl bg-emerald-500/15 px-4 py-3 text-sm text-emerald-300">
            <FontAwesomeIcon icon={faCircleCheck} className="mr-1" /> Ya estás inscrito en este curso
          </div>
          <button
            type="button"
            onClick={() => router.push(`/alumno/mis-cursos/${course.id}`)}
            className="primary-button"
          >
            Ir al curso →
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={handleEnroll}
          disabled={enrolling}
          className="primary-button w-full"
        >
          {enrolling
            ? 'Procesando inscripción...'
            : course.price === 0
            ? 'Inscribirse gratis'
            : `Inscribirse por ${course.price} €`}
        </button>
      )}

      {/* Module list */}
      <div>
        <h2 className="mb-3 text-base font-semibold text-white">Contenido del curso</h2>
        <div className="space-y-2">
          {course.modules
            .sort((a, b) => a.position - b.position)
            .map((module, index) => (
              <div
                key={module.id}
                className="flex items-center gap-4 rounded-xl border border-slate-800 bg-slate-900/50 px-4 py-3"
              >
                <span className="text-xl">{moduleTypeIcon(module.type)}</span>
                <div className="flex-1">
                  <p className="text-sm font-medium text-white">
                    {index + 1}. {module.title}
                  </p>
                  <p className="text-xs text-slate-500">{moduleTypeLabel(module.type)}</p>
                </div>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}
