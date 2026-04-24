'use client';

import { Spinner } from '@/components/ui/spinner';
import {
  completeModule,
  fetchCourseProgress,
  type CourseProgressDetail,
  type ModuleProgress,
} from '@/lib/courses-service';
import { faFile, faFileLines, faTrophy, faVideo } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useParams, useRouter } from 'next/navigation';
import type { ReactElement } from 'react';
import { useEffect, useState } from 'react';

function moduleTypeIcon(type: string): ReactElement {
  if (type === 'VIDEO') return <FontAwesomeIcon icon={faVideo} />;
  if (type === 'DOCUMENT') return <FontAwesomeIcon icon={faFile} />;
  return <FontAwesomeIcon icon={faFileLines} />;
}

export default function CourseProgressPage() {
  const params = useParams<{ courseId: string }>();
  const router = useRouter();
  const [detail, setDetail] = useState<CourseProgressDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [completingId, setCompletingId] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    try {
      setDetail(await fetchCourseProgress(params.courseId));
    } catch {
      setError('No se pudo cargar el progreso del curso');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void load(); }, [params.courseId]);

  async function handleComplete(mp: ModuleProgress) {
    if (mp.completed) return;
    setCompletingId(mp.courseModuleId);
    try {
      await completeModule(params.courseId, mp.courseModuleId);
      await load();
    } catch {
      setError('No se pudo marcar el módulo como completado');
    } finally {
      setCompletingId(null);
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error || !detail) {
    return (
      <p className="rounded-xl bg-red-500/15 px-4 py-3 text-sm text-red-300">
        {error ?? 'Curso no encontrado'}
      </p>
    );
  }

  const safeModules = Array.isArray(detail.modules) ? detail.modules : [];
  const sortedModules = safeModules
    .filter((mp): mp is ModuleProgress & { module: NonNullable<ModuleProgress['module']> } => Boolean(mp?.module))
    .sort((a, b) => {
      const aPos = Number.isFinite(a.module.position) ? a.module.position : Number.MAX_SAFE_INTEGER;
      const bPos = Number.isFinite(b.module.position) ? b.module.position : Number.MAX_SAFE_INTEGER;
      return aPos - bPos;
    });
  const completedCount = sortedModules.filter((m) => m.completed).length;
  const safeProgress = Number.isFinite(detail.progressPercent)
    ? Math.min(100, Math.max(0, detail.progressPercent))
    : sortedModules.length > 0
      ? (completedCount / sortedModules.length) * 100
      : 0;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <button
        type="button"
        onClick={() => router.back()}
        className="cursor-pointer text-sm text-slate-400 hover:text-white transition-colors"
      >
        ← Volver a mis cursos
      </button>

      {/* Course header */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6">
        <h1 className="text-2xl font-bold text-white">{detail.course.title}</h1>
        {detail.course.description && (
          <p className="mt-2 text-sm text-slate-400">{detail.course.description}</p>
        )}

        {/* Progress bar */}
        <div className="mt-5">
          <div className="flex justify-between text-sm mb-2">
            <span className="font-semibold text-white">Progreso general</span>
            <span className="font-bold text-cyan-400">{Math.round(safeProgress)}%</span>
          </div>
          <div className="h-3 overflow-hidden rounded-full bg-slate-700">
            <div
              className="h-3 rounded-full bg-gradient-to-r from-cyan-500 to-cyan-400 transition-all duration-500"
              style={{ width: `${safeProgress}%` }}
            />
          </div>
          <p className="mt-2 text-xs text-slate-500">
            {completedCount} de {sortedModules.length} módulos completados
          </p>
        </div>
      </div>

      {/* Module list */}
      <div>
        <h2 className="mb-3 text-base font-semibold text-white">Contenido del curso</h2>
        <div className="space-y-3">
          {sortedModules.length === 0 && (
            <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4 text-sm text-slate-400">
              Este curso todavía no tiene módulos disponibles.
            </div>
          )}
          {sortedModules.map((mp, index) => (
            <div
              key={mp.id}
              className={`rounded-xl border p-4 transition-colors ${
                mp.completed
                  ? 'border-emerald-500/30 bg-emerald-500/5'
                  : 'border-slate-800 bg-slate-900/50'
              }`}
            >
              <div className="flex items-center gap-4">
                {/* Status indicator */}
                <div
                  className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-sm ${
                    mp.completed
                      ? 'bg-emerald-500/20 text-emerald-400'
                      : 'bg-slate-800 text-slate-500'
                  }`}
                >
                  {mp.completed ? '✓' : index + 1}
                </div>

                <div className="flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-medium text-white">
                        {moduleTypeIcon(mp.module.type)} {mp.module.title}
                      </p>
                      {mp.module.description && (
                        <p className="mt-0.5 text-xs text-slate-500">{mp.module.description}</p>
                      )}
                    </div>

                    {mp.module.contentUrl && (
                      <a
                        href={mp.module.contentUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="cursor-pointer flex-shrink-0 rounded-lg bg-slate-700 px-3 py-1 text-xs font-semibold hover:bg-slate-600 transition-colors"
                      >
                        Ver contenido
                      </a>
                    )}
                  </div>

                  {mp.completed && mp.completedAt && (
                    <p className="mt-1 text-xs text-emerald-600">
                      Completado el {new Date(mp.completedAt).toLocaleDateString('es-ES', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </p>
                  )}
                </div>
              </div>

              {!mp.completed && (
                <div className="mt-3 border-t border-slate-700/50 pt-3">
                  <button
                    type="button"
                    disabled={completingId === mp.courseModuleId}
                    onClick={() => handleComplete(mp)}
                    className="cursor-pointer w-full rounded-lg bg-cyan-500/15 py-2 text-xs font-semibold text-cyan-300 hover:bg-cyan-500/25 transition-colors disabled:cursor-not-allowed"
                  >
                    {completingId === mp.courseModuleId
                      ? 'Marcando...'
                      : '✓ Marcar como completado'}
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {safeProgress === 100 && (
        <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-6 text-center">
          <p className="text-2xl mb-2"><FontAwesomeIcon icon={faTrophy} className="text-emerald-300" /></p>
          <p className="font-bold text-emerald-300">¡Curso completado!</p>
          <p className="mt-1 text-sm text-emerald-400/70">
            Has completado todos los módulos de este curso
          </p>
        </div>
      )}
    </div>
  );
}
