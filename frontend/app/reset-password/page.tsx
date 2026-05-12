'use client';

import { Spinner } from '@/components/ui/spinner';
import { resetPassword } from '@/lib/auth-service';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheckCircle } from '@fortawesome/free-solid-svg-icons';
import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

const resetSchema = z
  .object({
    newPassword: z.string().min(8, 'Mínimo 8 caracteres'),
    confirmPassword: z.string(),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: 'Las contraseñas no coinciden',
    path: ['confirmPassword'],
  });

type ResetForm = z.infer<typeof resetSchema>;

/* ─── Inner component (needs useSearchParams → must be inside Suspense) ── */

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token');

  const [success, setSuccess] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetForm>({ resolver: zodResolver(resetSchema) });

  /* Redirect to /login after success */
  useEffect(() => {
    if (!success) return;
    const t = setTimeout(() => router.replace('/login'), 3000);
    return () => clearTimeout(t);
  }, [success, router]);

  if (!token) {
    return (
      <div className="space-y-5 text-center">
        <p className="text-sm text-red-400">
          El enlace de recuperación no es válido o ha caducado.
        </p>
        <Link href="/forgot-password" className="block text-sm font-semibold text-cyan-400 hover:underline">
          Solicitar un nuevo enlace
        </Link>
      </div>
    );
  }

  async function onSubmit(values: ResetForm) {
    setServerError(null);
    try {
      await resetPassword(token as string, values.newPassword);
      setSuccess(true);
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ?? 'El token no es válido o ha caducado.';
      setServerError(typeof message === 'string' ? message : 'Error al restablecer la contraseña.');
    }
  }

  if (success) {
    return (
      <div className="space-y-5 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-cyan-500/15 text-cyan-300">
          <FontAwesomeIcon icon={faCheckCircle} className="h-7 w-7" />
        </div>
        <p className="text-sm text-slate-300">
          Contraseña actualizada correctamente. Redirigiendo al inicio de sesión…
        </p>
        <Link href="/login" className="block text-sm font-semibold text-cyan-400 hover:underline">
          Ir al inicio de sesión ahora
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
      <div>
        <label htmlFor="newPassword" className="mb-1.5 block text-sm font-medium text-slate-300">
          Nueva contraseña
        </label>
        <input
          id="newPassword"
          type="password"
          autoComplete="new-password"
          className="input"
          {...register('newPassword')}
        />
        {errors.newPassword && (
          <p className="mt-1 text-xs text-red-400">{errors.newPassword.message}</p>
        )}
      </div>

      <div>
        <label htmlFor="confirmPassword" className="mb-1.5 block text-sm font-medium text-slate-300">
          Confirmar contraseña
        </label>
        <input
          id="confirmPassword"
          type="password"
          autoComplete="new-password"
          className="input"
          {...register('confirmPassword')}
        />
        {errors.confirmPassword && (
          <p className="mt-1 text-xs text-red-400">{errors.confirmPassword.message}</p>
        )}
      </div>

      {serverError && (
        <p className="rounded-lg bg-red-500/10 px-4 py-2.5 text-sm text-red-400">{serverError}</p>
      )}

      <button
        type="submit"
        disabled={isSubmitting}
        className="primary-button w-full disabled:opacity-60"
      >
        {isSubmitting ? 'Guardando…' : 'Establecer nueva contraseña'}
      </button>
    </form>
  );
}

/* ─── Page wrapper with Suspense (required for useSearchParams) ──────── */

export default function ResetPasswordPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4">
      <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-8 shadow-xl">
        {/* Header */}
        <div className="mb-8 text-center">
          <span className="text-2xl font-bold text-cyan-400">CGA</span>
          <span className="text-2xl font-bold text-white"> Security</span>
          <p className="mt-2 text-sm text-slate-400">Establece tu nueva contraseña</p>
        </div>

        <Suspense
          fallback={
            <div className="flex justify-center py-8">
              <Spinner size="lg" />
            </div>
          }
        >
          <ResetPasswordForm />
        </Suspense>
      </div>
    </div>
  );
}
