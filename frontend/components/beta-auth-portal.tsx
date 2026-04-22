'use client';

import {
    clearStoredSession,
    createCourse,
    enrollInCourse,
    fetchAdminCourses,
    fetchCourses,
    getStoredSession,
    login,
    persistSession,
    registerCompany,
    registerStudent,
    type AuthResponse,
    type CourseSummary,
    type CreateCoursePayload,
} from '@/lib/auth-service';
import { zodResolver } from '@hookform/resolvers/zod';
import { AxiosError } from 'axios';
import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

const loginSchema = z.object({
  email: z.string().email('Introduce un email valido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
});

const studentSchema = z.object({
  fullName: z.string().min(3, 'Introduce tu nombre completo'),
  email: z.string().email('Introduce un email valido'),
  password: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres'),
});

const companySchema = z.object({
  fullName: z.string().min(3, 'Introduce tu nombre completo'),
  email: z.string().email('Introduce un email valido'),
  password: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres'),
  companyName: z.string().min(2, 'Indica el nombre fiscal'),
  taxId: z.string().min(5, 'Indica un identificador valido'),
  phone: z.string().optional(),
  address: z.string().optional(),
});

const createCourseSchema = z.object({
  title: z.string().min(3, 'El título debe tener al menos 3 caracteres'),
  description: z.string().optional(),
  price: z.number().min(0, 'El precio no puede ser negativo'),
  isPublished: z.boolean().optional(),
  moduleTitle: z.string().optional(),
  moduleDescription: z.string().optional(),
});

type AuthMode = 'login' | 'student' | 'company';
type AppView = 'home' | 'courses' | 'admin-courses';

type LoginValues = z.infer<typeof loginSchema>;
type StudentValues = z.infer<typeof studentSchema>;
type CompanyValues = z.infer<typeof companySchema>;
type CreateCourseValues = z.infer<typeof createCourseSchema>;

function getErrorMessage(error: unknown) {
  if (error instanceof AxiosError) {
    const message = error.response?.data?.message;

    if (Array.isArray(message)) {
      return message.join(' · ');
    }

    if (typeof message === 'string') {
      return message;
    }
  }

  return 'No se pudo completar la operación';
}

export function BetaAuthPortal() {
  const [mode, setMode] = useState<AuthMode>('login');
  const [view, setView] = useState<AppView>('home');
  const [session, setSession] = useState<AuthResponse | null>(null);
  const [courses, setCourses] = useState<CourseSummary[]>([]);
  const [adminCourses, setAdminCourses] = useState<CourseSummary[]>([]);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [loadingCourses, setLoadingCourses] = useState(true);
  const [loadingAdminCourses, setLoadingAdminCourses] = useState(false);

  const loginForm = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const studentForm = useForm<StudentValues>({
    resolver: zodResolver(studentSchema),
    defaultValues: { fullName: '', email: '', password: '' },
  });

  const companyForm = useForm<CompanyValues>({
    resolver: zodResolver(companySchema),
    defaultValues: {
      fullName: '',
      email: '',
      password: '',
      companyName: '',
      taxId: '',
      phone: '',
      address: '',
    },
  });

  const createCourseForm = useForm<CreateCourseValues>({
    resolver: zodResolver(createCourseSchema),
    defaultValues: {
      title: '',
      description: '',
      price: 0,
      isPublished: true,
      moduleTitle: '',
      moduleDescription: '',
    },
  });

  const loadCourses = useCallback(async () => {
    try {
      setLoadingCourses(true);
      const result = await fetchCourses();
      setCourses(result);
    } catch {
      setStatusMessage('No se pudo cargar el catálogo todavía');
    } finally {
      setLoadingCourses(false);
    }
  }, []);

  const loadAdminCourses = useCallback(
    async (force = false) => {
      if (!force && session?.user.role !== 'ADMIN') {
        return;
      }

      try {
        setLoadingAdminCourses(true);
        const result = await fetchAdminCourses();
        setAdminCourses(result);
      } catch (error) {
        setStatusMessage(getErrorMessage(error));
      } finally {
        setLoadingAdminCourses(false);
      }
    },
    [session?.user.role],
  );

  useEffect(() => {
    const activeSession = getStoredSession();

    if (activeSession) {
      setSession(activeSession);
      if (activeSession.user.role === 'ADMIN') {
        void loadAdminCourses(true);
      }
    }

    void loadCourses();
  }, [loadAdminCourses, loadCourses]);

  function applySession(nextSession: AuthResponse, message: string) {
    persistSession(nextSession);
    setSession(nextSession);
    setView('home');
    setStatusMessage(message);
    void loadCourses();
    void loadAdminCourses(nextSession.user.role === 'ADMIN');
  }

  async function handleLogin(values: LoginValues) {
    try {
      const result = await login(values);
      applySession(result, 'Sesión iniciada correctamente');
      loginForm.reset();
    } catch (error) {
      setStatusMessage(getErrorMessage(error));
    }
  }

  async function handleStudentRegister(values: StudentValues) {
    try {
      const result = await registerStudent(values);
      applySession(result, 'Cuenta de alumno creada correctamente');
      studentForm.reset();
    } catch (error) {
      setStatusMessage(getErrorMessage(error));
    }
  }

  async function handleCompanyRegister(values: CompanyValues) {
    try {
      const result = await registerCompany(values);
      applySession(result, 'Cuenta de empresa creada correctamente');
      companyForm.reset();
    } catch (error) {
      setStatusMessage(getErrorMessage(error));
    }
  }

  async function handleCreateCourse(values: CreateCourseValues) {
    try {
      const payload: CreateCoursePayload = {
        title: values.title,
        description: values.description,
        price: values.price,
        isPublished: values.isPublished,
        modules: values.moduleTitle
          ? [
              {
                title: values.moduleTitle,
                description: values.moduleDescription,
                type: 'TEXT',
                position: 1,
              },
            ]
          : [],
      };

      const createdCourse = await createCourse(payload);
      createCourseForm.reset({
        title: '',
        description: '',
        price: 0,
        isPublished: true,
        moduleTitle: '',
        moduleDescription: '',
      });
      setStatusMessage(`Curso creado correctamente: ${createdCourse.title}`);
      await loadCourses();
      await loadAdminCourses(true);
      setView('admin-courses');
    } catch (error) {
      setStatusMessage(getErrorMessage(error));
    }
  }

  async function handleEnroll(courseId: string) {
    try {
      await enrollInCourse(courseId);
      setStatusMessage('Inscripción simulada completada');
    } catch (error) {
      setStatusMessage(getErrorMessage(error));
    }
  }

  function handleLogout() {
    clearStoredSession();
    setSession(null);
    setView('home');
    setStatusMessage('Sesión cerrada');
  }

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-6 text-slate-100">
      <div className="mx-auto flex max-w-6xl flex-col gap-6">
        <section className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6 shadow-2xl shadow-slate-950/30">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-cyan-400">
                PEC 3 · Semana 2
              </p>
              <h1 className="mt-2 text-3xl font-bold text-white">
                Beta funcional con navegación y gestión de cursos
              </h1>
              <p className="mt-3 max-w-2xl text-sm text-slate-300">
                La aplicación ya permite moverse entre vistas y, si el usuario es admin,
                crear cursos directamente desde el frontend.
              </p>
            </div>

            {session ? (
              <div className="flex flex-wrap items-center gap-3">
                <span className="rounded-full bg-cyan-500/15 px-3 py-1 text-xs font-semibold text-cyan-300">
                  {session.user.role}
                </span>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="rounded-xl border border-slate-700 px-4 py-2 text-sm font-semibold text-slate-100 hover:bg-slate-800"
                >
                  Cerrar sesión
                </button>
              </div>
            ) : null}
          </div>

          {session ? (
            <nav className="mt-5 flex flex-wrap gap-2 border-t border-slate-800 pt-4">
              <NavButton
                active={view === 'home'}
                label="Inicio"
                onClick={() => setView('home')}
              />
              <NavButton
                active={view === 'courses'}
                label="Cursos"
                onClick={() => setView('courses')}
              />
              {session.user.role === 'ADMIN' ? (
                <NavButton
                  active={view === 'admin-courses'}
                  label="Gestión de cursos"
                  onClick={() => {
                    setView('admin-courses');
                    void loadAdminCourses(true);
                  }}
                />
              ) : null}
            </nav>
          ) : null}

          {statusMessage ? (
            <div className="mt-4 rounded-xl border border-cyan-500/30 bg-cyan-500/10 px-4 py-3 text-sm text-cyan-100">
              {statusMessage}
            </div>
          ) : null}
        </section>

        {!session ? (
          <section className="grid gap-6 lg:grid-cols-[1fr_1.1fr]">
            <div className="rounded-3xl border border-slate-800 bg-slate-900 p-6">
              <h2 className="text-2xl font-semibold text-white">Acceso a la plataforma</h2>
              <p className="mt-3 text-sm text-slate-300">
                Inicia sesión o crea una cuenta para acceder a las vistas beta y probar los flujos
                de alumnos, empresas y administrador.
              </p>
            </div>

            <div className="rounded-3xl border border-slate-800 bg-slate-900 p-6">
              <div className="mb-4 flex flex-wrap gap-2">
                {[
                  { key: 'login', label: 'Login' },
                  { key: 'student', label: 'Registro alumno' },
                  { key: 'company', label: 'Registro empresa' },
                ].map((item) => (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => setMode(item.key as AuthMode)}
                    className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
                      mode === item.key
                        ? 'bg-cyan-500 text-slate-950'
                        : 'border border-slate-700 bg-slate-950 text-slate-200 hover:bg-slate-800'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>

              {mode === 'login' ? (
                <form className="space-y-4" onSubmit={loginForm.handleSubmit(handleLogin)}>
                  <Field label="Email" error={loginForm.formState.errors.email?.message}>
                    <input className="input" type="email" {...loginForm.register('email')} />
                  </Field>
                  <Field label="Contraseña" error={loginForm.formState.errors.password?.message}>
                    <input className="input" type="password" {...loginForm.register('password')} />
                  </Field>
                  <button className="primary-button" type="submit" disabled={loginForm.formState.isSubmitting}>
                    Entrar en la beta
                  </button>
                </form>
              ) : null}

              {mode === 'student' ? (
                <form className="space-y-4" onSubmit={studentForm.handleSubmit(handleStudentRegister)}>
                  <Field label="Nombre completo" error={studentForm.formState.errors.fullName?.message}>
                    <input className="input" {...studentForm.register('fullName')} />
                  </Field>
                  <Field label="Email" error={studentForm.formState.errors.email?.message}>
                    <input className="input" type="email" {...studentForm.register('email')} />
                  </Field>
                  <Field label="Contraseña" error={studentForm.formState.errors.password?.message}>
                    <input className="input" type="password" {...studentForm.register('password')} />
                  </Field>
                  <button className="primary-button" type="submit" disabled={studentForm.formState.isSubmitting}>
                    Crear cuenta de alumno
                  </button>
                </form>
              ) : null}

              {mode === 'company' ? (
                <form className="space-y-4" onSubmit={companyForm.handleSubmit(handleCompanyRegister)}>
                  <Field label="Responsable" error={companyForm.formState.errors.fullName?.message}>
                    <input className="input" {...companyForm.register('fullName')} />
                  </Field>
                  <Field label="Email" error={companyForm.formState.errors.email?.message}>
                    <input className="input" type="email" {...companyForm.register('email')} />
                  </Field>
                  <Field label="Contraseña" error={companyForm.formState.errors.password?.message}>
                    <input className="input" type="password" {...companyForm.register('password')} />
                  </Field>
                  <Field label="Empresa" error={companyForm.formState.errors.companyName?.message}>
                    <input className="input" {...companyForm.register('companyName')} />
                  </Field>
                  <Field label="Tax ID" error={companyForm.formState.errors.taxId?.message}>
                    <input className="input" {...companyForm.register('taxId')} />
                  </Field>
                  <Field label="Teléfono">
                    <input className="input" {...companyForm.register('phone')} />
                  </Field>
                  <Field label="Dirección">
                    <input className="input" {...companyForm.register('address')} />
                  </Field>
                  <button className="primary-button" type="submit" disabled={companyForm.formState.isSubmitting}>
                    Registrar empresa
                  </button>
                </form>
              ) : null}
            </div>
          </section>
        ) : null}

        {session && view === 'home' ? (
          <section className="grid gap-6 lg:grid-cols-[1fr_1fr]">
            <div className="rounded-3xl border border-slate-800 bg-slate-900 p-6">
              <h2 className="text-2xl font-semibold">Bienvenido, {session.user.fullName}</h2>
              <p className="mt-2 text-sm text-slate-300">
                Ya puedes navegar por las vistas disponibles desde la barra superior.
              </p>

              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <InfoCard label="Email" value={session.user.email} />
                <InfoCard label="Rol" value={session.user.role} />
              </div>

              {session.user.company ? (
                <div className="mt-4 rounded-2xl border border-slate-800 bg-slate-950/60 p-4 text-sm text-slate-200">
                  <p className="font-semibold text-white">Empresa asociada</p>
                  <p className="mt-2">{session.user.company.companyName}</p>
                  <p>NIF / CIF: {session.user.company.taxId}</p>
                </div>
              ) : null}
            </div>

            <div className="rounded-3xl border border-slate-800 bg-slate-900 p-6">
              <h2 className="text-xl font-semibold text-white">Acciones disponibles</h2>
              <div className="mt-4 grid gap-3">
                <ActionCard
                  title="Ver catálogo"
                  description="Consulta los cursos publicados desde la vista de cursos."
                  onClick={() => setView('courses')}
                />
                {session.user.role === 'ADMIN' ? (
                  <ActionCard
                    title="Crear cursos"
                    description="Accede a la vista de gestión para crear cursos desde la aplicación."
                    onClick={() => {
                      setView('admin-courses');
                      void loadAdminCourses(true);
                    }}
                  />
                ) : null}
              </div>
            </div>
          </section>
        ) : null}

        {session && view === 'courses' ? (
          <section className="rounded-3xl border border-slate-800 bg-slate-900 p-6">
            <h2 className="text-xl font-semibold text-white">Catálogo de cursos</h2>
            <p className="mt-2 text-sm text-slate-300">
              Cursos publicados disponibles desde el backend de NestJS.
            </p>

            <div className="mt-4 grid gap-3 lg:grid-cols-2">
              {loadingCourses ? (
                <p className="text-sm text-slate-400">Cargando cursos…</p>
              ) : courses.length === 0 ? (
                <p className="text-sm text-slate-400">
                  Aún no hay cursos publicados. Si eres admin, puedes crearlos desde Gestión de cursos.
                </p>
              ) : (
                courses.map((course) => (
                  <CourseCard
                    key={course.id}
                    course={course}
                    showEnroll={session.user.role === 'ALUMNO'}
                    onEnroll={() => handleEnroll(course.id)}
                  />
                ))
              )}
            </div>
          </section>
        ) : null}

        {session && session.user.role === 'ADMIN' && view === 'admin-courses' ? (
          <section className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
            <div className="rounded-3xl border border-slate-800 bg-slate-900 p-6">
              <h2 className="text-xl font-semibold text-white">Crear curso</h2>
              <p className="mt-2 text-sm text-slate-300">
                Formulario beta para crear cursos directamente desde la aplicación.
              </p>

              <form className="mt-4 space-y-4" onSubmit={createCourseForm.handleSubmit(handleCreateCourse)}>
                <Field label="Título" error={createCourseForm.formState.errors.title?.message}>
                  <input className="input" {...createCourseForm.register('title')} />
                </Field>
                <Field label="Descripción">
                  <textarea className="input min-h-24" {...createCourseForm.register('description')} />
                </Field>
                <Field label="Precio" error={createCourseForm.formState.errors.price?.message}>
                  <input
                    className="input"
                    type="number"
                    step="0.01"
                    min="0"
                    {...createCourseForm.register('price', { valueAsNumber: true })}
                  />
                </Field>
                <Field label="Título del primer módulo opcional">
                  <input className="input" {...createCourseForm.register('moduleTitle')} />
                </Field>
                <Field label="Descripción del módulo">
                  <textarea className="input min-h-24" {...createCourseForm.register('moduleDescription')} />
                </Field>

                <label className="flex items-center gap-3 text-sm text-slate-200">
                  <input type="checkbox" {...createCourseForm.register('isPublished')} />
                  Publicar el curso al crearlo
                </label>

                <button
                  className="primary-button"
                  type="submit"
                  disabled={createCourseForm.formState.isSubmitting}
                >
                  Crear curso
                </button>
              </form>
            </div>

            <aside className="rounded-3xl border border-slate-800 bg-slate-900 p-6">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-xl font-semibold text-white">Cursos creados</h2>
                  <p className="mt-1 text-sm text-slate-300">
                    Vista administrativa con cursos publicados y borradores.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => void loadAdminCourses(true)}
                  className="rounded-xl border border-slate-700 px-3 py-2 text-sm font-semibold text-slate-100 hover:bg-slate-800"
                >
                  Recargar
                </button>
              </div>

              <div className="mt-4 space-y-3">
                {loadingAdminCourses ? (
                  <p className="text-sm text-slate-400">Cargando cursos del administrador…</p>
                ) : adminCourses.length === 0 ? (
                  <p className="text-sm text-slate-400">
                    Todavía no se han creado cursos en esta instalación.
                  </p>
                ) : (
                  adminCourses.map((course) => (
                    <div key={course.id} className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h3 className="font-semibold text-white">{course.title}</h3>
                          <p className="mt-1 text-sm text-slate-300">
                            {course.description || 'Sin descripción todavía'}
                          </p>
                        </div>
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold ${
                            course.isPublished
                              ? 'bg-emerald-500/15 text-emerald-300'
                              : 'bg-amber-500/15 text-amber-300'
                          }`}
                        >
                          {course.isPublished ? 'Publicado' : 'Borrador'}
                        </span>
                      </div>
                      <p className="mt-3 text-xs text-slate-400">
                        {course.modules.length} módulos · {course.enrollmentCount} inscripciones
                      </p>
                    </div>
                  ))
                )}
              </div>
            </aside>
          </section>
        ) : null}
      </div>
    </main>
  );
}

function NavButton({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
        active
          ? 'bg-cyan-500 text-slate-950'
          : 'border border-slate-700 bg-slate-950 text-slate-200 hover:bg-slate-800'
      }`}
    >
      {label}
    </button>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <label className="block space-y-2 text-sm">
      <span className="font-medium text-slate-200">{label}</span>
      {children}
      {error ? <span className="text-xs text-rose-300">{error}</span> : null}
    </label>
  );
}

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
      <p className="text-xs uppercase tracking-[0.2em] text-slate-400">{label}</p>
      <p className="mt-2 font-medium text-white">{value}</p>
    </div>
  );
}

function ActionCard({
  title,
  description,
  onClick,
}: {
  title: string;
  description: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4 text-left hover:bg-slate-950"
    >
      <p className="font-semibold text-white">{title}</p>
      <p className="mt-2 text-sm text-slate-300">{description}</p>
    </button>
  );
}

function CourseCard({
  course,
  showEnroll,
  onEnroll,
}: {
  course: CourseSummary;
  showEnroll: boolean;
  onEnroll: () => void;
}) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-semibold text-white">{course.title}</h3>
          <p className="mt-1 text-sm text-slate-300">{course.description || 'Sin descripción todavía'}</p>
        </div>
        <span className="rounded-full bg-cyan-500/15 px-3 py-1 text-xs font-semibold text-cyan-300">
          {course.price} €
        </span>
      </div>
      <p className="mt-3 text-xs text-slate-400">
        {course.modules.length} módulos · {course.enrollmentCount} inscripciones
      </p>

      {showEnroll ? (
        <button
          type="button"
          onClick={onEnroll}
          className="mt-3 rounded-xl bg-emerald-500 px-3 py-2 text-sm font-semibold text-slate-950 hover:bg-emerald-400"
        >
          Inscribirme
        </button>
      ) : null}
    </div>
  );
}
