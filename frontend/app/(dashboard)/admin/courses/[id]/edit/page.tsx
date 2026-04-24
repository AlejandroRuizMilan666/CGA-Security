'use client';

import { Spinner } from '@/components/ui/spinner';
import {
    fetchAllCourses,
    updateCourseApi,
    type CourseFull,
    type ModuleType,
    type UpdateCoursePayload,
} from '@/lib/courses-service';
import { zodResolver } from '@hookform/resolvers/zod';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useFieldArray, useForm } from 'react-hook-form';
import { z } from 'zod';

const moduleSchema = z.object({
  title: z.string().min(1, 'El módulo necesita un título'),
  description: z.string().optional(),
  type: z.enum(['TEXT', 'VIDEO', 'DOCUMENT']),
  contentUrl: z.string().url('Introduce una URL válida').optional().or(z.literal('')),
});

const courseSchema = z.object({
  title: z.string().min(3, 'El título debe tener al menos 3 caracteres'),
  description: z.string().optional(),
  price: z.number().min(0, 'El precio no puede ser negativo'),
  isPublished: z.boolean(),
  modules: z.array(moduleSchema),
});

type CourseFormValues = z.infer<typeof courseSchema>;

export default function EditCoursePage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const [course, setCourse] = useState<CourseFull | null>(null);
  const [loading, setLoading] = useState(true);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CourseFormValues>({
    resolver: zodResolver(courseSchema),
    defaultValues: { title: '', description: '', price: 0, isPublished: true, modules: [] },
  });

  const { fields, append, remove } = useFieldArray({ control, name: 'modules' });

  useEffect(() => {
    fetchAllCourses()
      .then((courses) => {
        const found = courses.find((c) => c.id === params.id);
        if (found) {
          setCourse(found);
          reset({
            title: found.title,
            description: found.description ?? '',
            price: found.price,
            isPublished: found.isPublished,
            modules: found.modules.map((m) => ({
              title: m.title,
              description: m.description ?? '',
              type: m.type,
              contentUrl: m.contentUrl ?? '',
            })),
          });
        }
      })
      .finally(() => setLoading(false));
  }, [params.id, reset]);

  async function onSubmit(values: CourseFormValues) {
    setServerError(null);
    try {
      const payload: UpdateCoursePayload = {
        title: values.title,
        description: values.description,
        price: values.price,
        isPublished: values.isPublished,
        modules: values.modules.map((m, i) => ({
          title: m.title,
          description: m.description,
          type: m.type as ModuleType,
          contentUrl: m.contentUrl || undefined,
          position: i + 1,
        })),
      };
      await updateCourseApi(params.id, payload);
      router.push('/admin/courses');
    } catch {
      setServerError('Error al actualizar el curso');
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
      <div>
        <h1 className="text-2xl font-bold text-white">Editar curso</h1>
        <p className="mt-1 text-sm text-slate-400">Modifica la información del curso</p>
      </div>

      {serverError && (
        <p className="rounded-xl bg-red-500/15 px-4 py-3 text-sm text-red-300">{serverError}</p>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <div>
          <label className="mb-1 block text-xs font-semibold text-slate-400">Título *</label>
          <input className="input" {...register('title')} />
          {errors.title && <p className="mt-1 text-xs text-red-400">{errors.title.message}</p>}
        </div>

        <div>
          <label className="mb-1 block text-xs font-semibold text-slate-400">Descripción</label>
          <textarea className="input min-h-[80px] resize-y" {...register('description')} />
        </div>

        <div className="flex gap-4">
          <div className="flex-1">
            <label className="mb-1 block text-xs font-semibold text-slate-400">Precio (€)</label>
            <input type="number" step="0.01" min="0" className="input" {...register('price', { valueAsNumber: true })} />
          </div>
          <div className="flex items-end pb-1">
            <label className="flex items-center gap-2 text-sm text-slate-300">
              <input type="checkbox" className="h-4 w-4" {...register('isPublished')} />
              Publicado
            </label>
          </div>
        </div>

        {/* Modules */}
        <div>
          <div className="mb-3 flex items-center justify-between">
            <label className="text-xs font-semibold text-slate-400">Módulos</label>
            <button
              type="button"
              onClick={() => append({ title: '', description: '', type: 'TEXT', contentUrl: '' })}
              className="cursor-pointer rounded-lg bg-cyan-500/15 px-3 py-1 text-xs font-semibold text-cyan-300 hover:bg-cyan-500/25 transition-colors"
            >
              + Añadir módulo
            </button>
          </div>

          <div className="space-y-3">
            {fields.map((field, index) => (
              <div
                key={field.id}
                className="rounded-xl border border-slate-700 bg-slate-800/50 p-4 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-400">Módulo {index + 1}</span>
                  <button
                    type="button"
                    onClick={() => remove(index)}
                    className="cursor-pointer text-xs text-red-400 hover:text-red-300"
                  >
                    Eliminar
                  </button>
                </div>
                <input
                  className="input"
                  placeholder="Título del módulo"
                  {...register(`modules.${index}.title`)}
                />
                <input
                  className="input"
                  placeholder="Descripción (opcional)"
                  {...register(`modules.${index}.description`)}
                />
                <div className="flex gap-3">
                  <select className="input flex-1" {...register(`modules.${index}.type`)}>
                    <option value="TEXT">Texto</option>
                    <option value="VIDEO">Vídeo</option>
                    <option value="DOCUMENT">Documento</option>
                  </select>
                  <input
                    className="input flex-[2]"
                    placeholder="URL de contenido (opcional)"
                    {...register(`modules.${index}.contentUrl`)}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-end gap-3 border-t border-slate-800 pt-5">
          <button
            type="button"
            onClick={() => router.back()}
            className="cursor-pointer rounded-xl border border-slate-700 px-5 py-2.5 text-sm font-semibold text-slate-300 hover:bg-slate-800"
          >
            Cancelar
          </button>
          <button type="submit" disabled={isSubmitting} className="primary-button">
            {isSubmitting ? 'Guardando...' : 'Guardar cambios'}
          </button>
        </div>
      </form>
    </div>
  );
}
