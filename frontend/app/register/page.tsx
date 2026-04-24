'use client';

import { useAuth } from '@/lib/auth-context';
import { registerCompany, registerStudent } from '@/lib/auth-service';
import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

/* ─── Schemas ─────────────────────────────────────────────────────────── */

const baseSchema = z
  .object({
    fullName: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
    email: z.string().email('Email inválido'),
    password: z.string().min(8, 'Mínimo 8 caracteres'),
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: 'Las contraseñas no coinciden',
    path: ['confirmPassword'],
  });

const alumnoSchema = baseSchema;

const empresaSchema = z
  .object({
    fullName: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
    email: z.string().email('Email inválido'),
    password: z.string().min(8, 'Mínimo 8 caracteres'),
    confirmPassword: z.string(),
    companyName: z.string().min(2, 'Nombre de empresa requerido'),
    taxId: z.string().min(5, 'CIF/NIF inválido'),
    phone: z.string().optional(),
    address: z.string().optional(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: 'Las contraseñas no coinciden',
    path: ['confirmPassword'],
  });

type AlumnoForm = z.infer<typeof alumnoSchema>;
type EmpresaForm = z.infer<typeof empresaSchema>;
type Tab = 'alumno' | 'empresa';

const ROLE_ROUTES: Record<string, string> = {
  ADMIN: '/admin',
  EMPRESA: '/empresa',
  ALUMNO: '/alumno',
};

/* ─── Page ────────────────────────────────────────────────────────────── */

export default function RegisterPage() {
  const { user, role, isLoading, applySession } = useAuth();
  const router = useRouter();
  const [tab, setTab] = useState<Tab>('alumno');
  const [serverError, setServerError] = useState<string | null>(null);

  /* Inverse auth guard */
  useEffect(() => {
    if (!isLoading && user) {
      router.replace(ROLE_ROUTES[role ?? ''] ?? '/');
    }
  }, [isLoading, user, role, router]);

  if (isLoading || user) return null;

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4 py-10">
      <div className="relative w-full max-w-lg rounded-2xl border border-slate-800 bg-slate-900 p-8 shadow-xl">
        <Link
          href="/"
          className="absolute right-4 top-4 flex h-7 w-7 items-center justify-center rounded-full text-slate-400 transition-colors hover:bg-slate-700 hover:text-white"
          aria-label="Volver a la página principal"
        >
          ✕
        </Link>
        {/* Header */}
        <div className="mb-6 text-center">
          <span className="text-2xl font-bold text-cyan-400">CGA</span>
          <span className="text-2xl font-bold text-white"> Security</span>
          <p className="mt-2 text-sm text-slate-400">Crea tu cuenta</p>
        </div>

        {/* Tabs */}
        <div className="mb-6 flex rounded-xl border border-slate-700 p-1">
          <button
            onClick={() => { setTab('alumno'); setServerError(null); }}
            className={`flex-1 rounded-lg py-2 text-sm font-semibold transition-colors ${
              tab === 'alumno'
                ? 'bg-cyan-500 text-slate-950'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Alumno
          </button>
          <button
            onClick={() => { setTab('empresa'); setServerError(null); }}
            className={`flex-1 rounded-lg py-2 text-sm font-semibold transition-colors ${
              tab === 'empresa'
                ? 'bg-cyan-500 text-slate-950'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Empresa
          </button>
        </div>

        {/* Forms */}
        {tab === 'alumno' ? (
          <AlumnoForm
            serverError={serverError}
            setServerError={setServerError}
            applySession={applySession}
            router={router}
          />
        ) : (
          <EmpresaFormComponent
            serverError={serverError}
            setServerError={setServerError}
            applySession={applySession}
            router={router}
          />
        )}

        {/* Footer link */}
        <p className="mt-6 text-center text-sm text-slate-400">
          ¿Ya tienes cuenta?{' '}
          <Link href="/login" className="font-semibold text-cyan-400 hover:underline">
            Inicia sesión
          </Link>
        </p>
      </div>
    </div>
  );
}

/* ─── Alumno form ─────────────────────────────────────────────────────── */

function AlumnoForm({
  serverError,
  setServerError,
  applySession,
  router,
}: {
  serverError: string | null;
  setServerError: (e: string | null) => void;
  applySession: (s: Parameters<ReturnType<typeof useAuth>['applySession']>[0]) => void;
  router: ReturnType<typeof useRouter>;
}) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<AlumnoForm>({ resolver: zodResolver(alumnoSchema) });

  async function onSubmit(values: AlumnoForm) {
    setServerError(null);
    try {
      const session = await registerStudent({
        email: values.email,
        password: values.password,
        fullName: values.fullName,
      });
      applySession(session);
      router.replace('/alumno');
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ?? 'Error al registrarse. Inténtalo de nuevo.';
      setServerError(typeof message === 'string' ? message : 'Error al registrarse.');
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
      <Field label="Nombre completo" id="fullName" error={errors.fullName?.message}>
        <input id="fullName" type="text" autoComplete="name" className="input" {...register('fullName')} />
      </Field>
      <Field label="Email" id="email" error={errors.email?.message}>
        <input id="email" type="email" autoComplete="email" className="input" {...register('email')} />
      </Field>
      <Field label="Contraseña" id="password" error={errors.password?.message}>
        <input id="password" type="password" autoComplete="new-password" className="input" {...register('password')} />
      </Field>
      <Field label="Confirmar contraseña" id="confirmPassword" error={errors.confirmPassword?.message}>
        <input id="confirmPassword" type="password" autoComplete="new-password" className="input" {...register('confirmPassword')} />
      </Field>
      {serverError && (
        <p className="rounded-lg bg-red-500/10 px-4 py-2.5 text-sm text-red-400">{serverError}</p>
      )}
      <button type="submit" disabled={isSubmitting} className="primary-button w-full disabled:opacity-60">
        {isSubmitting ? 'Registrando…' : 'Crear cuenta de alumno'}
      </button>
    </form>
  );
}

/* ─── Empresa form ────────────────────────────────────────────────────── */

function EmpresaFormComponent({
  serverError,
  setServerError,
  applySession,
  router,
}: {
  serverError: string | null;
  setServerError: (e: string | null) => void;
  applySession: (s: Parameters<ReturnType<typeof useAuth>['applySession']>[0]) => void;
  router: ReturnType<typeof useRouter>;
}) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<EmpresaForm>({ resolver: zodResolver(empresaSchema) });

  async function onSubmit(values: EmpresaForm) {
    setServerError(null);
    try {
      const session = await registerCompany({
        email: values.email,
        password: values.password,
        fullName: values.fullName,
        companyName: values.companyName,
        taxId: values.taxId,
        phone: values.phone || undefined,
        address: values.address || undefined,
      });
      applySession(session);
      router.replace('/empresa');
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ?? 'Error al registrarse. Inténtalo de nuevo.';
      setServerError(typeof message === 'string' ? message : 'Error al registrarse.');
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
      <Field label="Nombre del responsable" id="e-fullName" error={errors.fullName?.message}>
        <input id="e-fullName" type="text" autoComplete="name" className="input" {...register('fullName')} />
      </Field>
      <Field label="Email" id="e-email" error={errors.email?.message}>
        <input id="e-email" type="email" autoComplete="email" className="input" {...register('email')} />
      </Field>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Contraseña" id="e-password" error={errors.password?.message}>
          <input id="e-password" type="password" autoComplete="new-password" className="input" {...register('password')} />
        </Field>
        <Field label="Confirmar contraseña" id="e-confirmPassword" error={errors.confirmPassword?.message}>
          <input id="e-confirmPassword" type="password" autoComplete="new-password" className="input" {...register('confirmPassword')} />
        </Field>
      </div>
      <div className="border-t border-slate-700 pt-4">
        <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-500">Datos de empresa</p>
        <div className="space-y-4">
          <Field label="Nombre de empresa" id="companyName" error={errors.companyName?.message}>
            <input id="companyName" type="text" className="input" {...register('companyName')} />
          </Field>
          <Field label="CIF / NIF" id="taxId" error={errors.taxId?.message}>
            <input id="taxId" type="text" className="input" {...register('taxId')} />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Teléfono (opcional)" id="phone" error={errors.phone?.message}>
              <input id="phone" type="tel" className="input" {...register('phone')} />
            </Field>
            <Field label="Dirección (opcional)" id="address" error={errors.address?.message}>
              <input id="address" type="text" className="input" {...register('address')} />
            </Field>
          </div>
        </div>
      </div>
      {serverError && (
        <p className="rounded-lg bg-red-500/10 px-4 py-2.5 text-sm text-red-400">{serverError}</p>
      )}
      <button type="submit" disabled={isSubmitting} className="primary-button w-full disabled:opacity-60">
        {isSubmitting ? 'Registrando…' : 'Crear cuenta de empresa'}
      </button>
    </form>
  );
}

/* ─── Shared field wrapper ────────────────────────────────────────────── */

function Field({
  label,
  id,
  error,
  children,
}: {
  label: string;
  id: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-slate-300">
        {label}
      </label>
      {children}
      {error && <p className="mt-1 text-xs text-red-400">{error}</p>}
    </div>
  );
}
