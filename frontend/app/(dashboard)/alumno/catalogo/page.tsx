'use client';

import { Spinner } from '@/components/ui/spinner';
import { fetchPublishedCourses, type CourseFull } from '@/lib/courses-service';
import { faFile, faFileLines, faVideo } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import Link from 'next/link';
import type { ReactElement } from 'react';
import { useEffect, useState } from 'react';

function moduleTypeIcon(type: string): ReactElement {
  if (type === 'VIDEO') return <FontAwesomeIcon icon={faVideo} />;
  if (type === 'DOCUMENT') return <FontAwesomeIcon icon={faFile} />;
  return <FontAwesomeIcon icon={faFileLines} />;
}

export default function AlumnoCatalogoPage() {
  const [courses, setCourses] = useState<CourseFull[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchPublishedCourses()
      .then(setCourses)
      .finally(() => setLoading(false));
  }, []);

  const filtered = courses.filter((c) =>
    c.title.toLowerCase().includes(search.toLowerCase()) ||
    (c.description ?? '').toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Catálogo de cursos</h1>
          <p className="mt-1 text-sm text-slate-400">{courses.length} cursos disponibles</p>
        </div>
        <input
          className="input w-72"
          placeholder="Buscar cursos..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Spinner size="lg" /></div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((course) => (
              <Link
                key={course.id}
                href={`/alumno/catalogo/${course.slug}`}
                className="cursor-pointer flex flex-col rounded-2xl border border-slate-800 bg-slate-900/80 p-5 hover:border-cyan-500/40 hover:bg-slate-800 transition-colors"
              >
                <div className="flex-1">
                  <h2 className="font-bold text-white">{course.title}</h2>
                  {course.description && (
                    <p className="mt-2 text-sm text-slate-400 line-clamp-2">
                      {course.description}
                    </p>
                  )}
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  {course.modules.slice(0, 3).map((m) => (
                    <span
                      key={m.id}
                      className="inline-flex items-center gap-1 rounded-lg bg-slate-800 px-2 py-1 text-xs text-slate-400"
                    >
                      {moduleTypeIcon(m.type)} {m.title}
                    </span>
                  ))}
                  {course.modules.length > 3 && (
                    <span className="rounded-lg bg-slate-800 px-2 py-1 text-xs text-slate-500">
                      +{course.modules.length - 3} más
                    </span>
                  )}
                </div>

                <div className="mt-4 flex items-center justify-between border-t border-slate-800 pt-4">
                  <span className="text-sm text-slate-400">
                    {course.modules.length} módulo{course.modules.length !== 1 ? 's' : ''}
                  </span>
                  <span className="font-bold text-cyan-300">
                    {course.price === 0 ? 'Gratis' : `${course.price} €`}
                  </span>
                </div>
              </Link>
            ))}
          </div>

          {filtered.length === 0 && (
            <div className="py-16 text-center">
              <p className="text-slate-400">
                {search ? `Sin resultados para "${search}"` : 'No hay cursos disponibles todavía'}
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
