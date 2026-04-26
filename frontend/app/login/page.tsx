'use client';

import { useAuth } from '@/lib/auth-context';
import { login } from '@/lib/auth-service';
import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres'),
});

type LoginForm = z.infer<typeof loginSchema>;

const ROLE_ROUTES: Record<string, string> = {
  ADMIN: '/admin',
  EMPRESA: '/empresa',
  ALUMNO: '/alumno',
};

export default function LoginPage() {
  const { user, role, isLoading, applySession } = useAuth();
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginForm>({ resolver: zodResolver(loginSchema) });

  /* Inverse auth guard — already logged in → go to dashboard */
  useEffect(() => {
    if (!isLoading && user) {
      router.replace(ROLE_ROUTES[role ?? ''] ?? '/');
    }
  }, [isLoading, user, role, router]);

  if (isLoading || user) return null;

  async function onSubmit(values: LoginForm) {
    setServerError(null);
    try {
      const session = await login(values);
      applySession(session);
      router.replace(ROLE_ROUTES[session.user.role] ?? '/');
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ?? 'Credenciales inválidas. Inténtalo de nuevo.';
      setServerError(typeof message === 'string' ? message : 'Error al iniciar sesión.');
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
          <p className="mt-2 text-sm text-slate-400">Accede a tu cuenta</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
          {/* Email */}
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

          {/* Password */}
          <div>
            <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-slate-300">
              Contraseña
            </label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              className="input"
              {...register('password')}
            />
            {errors.password && (
              <p className="mt-1 text-xs text-red-400">{errors.password.message}</p>
            )}
          </div>

          {/* Server error */}
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
            {isSubmitting ? 'Iniciando sesión…' : 'Iniciar sesión'}
          </button>
        </form>

        {/* Links */}
        <div className="mt-6 space-y-3 text-center text-sm text-slate-400">
          <p>
            <Link href="/forgot-password" className="text-cyan-400 hover:underline">
              ¿Olvidaste tu contraseña?
            </Link>
          </p>
          <p>
            ¿No tienes cuenta?{' '}
            <Link href="/register" className="font-semibold text-cyan-400 hover:underline">
              Regístrate
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
