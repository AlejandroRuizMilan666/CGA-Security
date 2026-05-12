'use client';

import { forgotPassword } from '@/lib/auth-service';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEnvelopeCircleCheck } from '@fortawesome/free-solid-svg-icons';
import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

const forgotSchema = z.object({
  email: z.string().email('Email inválido'),
});

type ForgotForm = z.infer<typeof forgotSchema>;

export default function ForgotPasswordPage() {
  const [submitted, setSubmitted] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotForm>({ resolver: zodResolver(forgotSchema) });

  async function onSubmit(values: ForgotForm) {
    setServerError(null);
    try {
      await forgotPassword(values.email);
      setSubmitted(true);
    } catch {
      setServerError('Ocurrió un error. Inténtalo de nuevo más tarde.');
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4">
      <div className="relative w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-8 shadow-xl">
        <Link
          href="/"
          className="absolute right-4 top-4 flex h-7 w-7 items-center justify-center rounded-full text-slate-400 transition-colors hover:bg-slate-700 hover:text-white"
          aria-label="Volver a la página principal"
        >
          ✕
        </Link>
        {/* Header */}
        <div className="mb-8 text-center">
          <span className="text-2xl font-bold text-cyan-400">CGA</span>
          <span className="text-2xl font-bold text-white"> Security</span>
          <p className="mt-2 text-sm text-slate-400">Recuperación de contraseña</p>
        </div>

        {submitted ? (
          <div className="space-y-5 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-cyan-500/15 text-cyan-300">
              <FontAwesomeIcon icon={faEnvelopeCircleCheck} className="h-7 w-7" />
            </div>
            <p className="text-sm text-slate-300">
              Enlace enviado para restablecer tu contraseña correctamente. Revisa también tu carpeta de spam.
            </p>
            <Link
              href="/login"
              className="block text-sm font-semibold text-cyan-400 hover:underline"
            >
              ← Volver al inicio de sesión
            </Link>
          </div>
        ) : (
          <>
            <p className="mb-6 text-sm text-slate-400">
              Introduce tu dirección de email y te enviaremos un enlace para restablecer tu
              contraseña.
            </p>
            <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
              <div>
                <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-slate-300">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  className="input"
                  {...register('email')}
                />
                {errors.email && (
                  <p className="mt-1 text-xs text-red-400">{errors.email.message}</p>
                )}
              </div>

              {serverError && (
                <p className="rounded-lg bg-red-500/10 px-4 py-2.5 text-sm text-red-400">
                  {serverError}
                </p>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="primary-button w-full disabled:opacity-60"
              >
                {isSubmitting ? 'Enviando…' : 'Enviar enlace de recuperación'}
              </button>
            </form>

            <p className="mt-6 text-center text-sm text-slate-400">
              <Link href="/login" className="text-cyan-400 hover:underline">
                ← Volver al inicio de sesión
              </Link>
            </p>
          </>
        )}
      </div>
    </div>
  );
}
