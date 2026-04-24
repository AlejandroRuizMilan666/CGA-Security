'use client';

import { Spinner } from '@/components/ui/spinner';
import { useAuth } from '@/lib/auth-context';
import { updateProfile } from '@/lib/auth-service';
import { fetchMyCompany, updateMyCompany, type CompanyDetail } from '@/lib/companies-service';
import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

const profileSchema = z.object({
  fullName: z.string().min(3, 'Introduce tu nombre completo'),
  companyName: z.string().min(2, 'Introduce el nombre fiscal'),
  taxId: z.string().min(5, 'Introduce un identificador válido'),
  phone: z.string().optional(),
  address: z.string().optional(),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

export default function EmpresaPerfilPage() {
  const { user, applySession, session } = useAuth();
  const [loading, setLoading] = useState(true);
  const [company, setCompany] = useState<CompanyDetail | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: { fullName: '', companyName: '', taxId: '', phone: '', address: '' },
  });

  useEffect(() => {
    fetchMyCompany()
      .then((comp) => {
        setCompany(comp);
        reset({
          fullName: user?.fullName ?? '',
          companyName: comp.companyName,
          taxId: comp.taxId,
          phone: comp.phone ?? '',
          address: comp.address ?? '',
        });
      })
      .catch(() => setError('No se pudieron cargar los datos de la empresa'))
      .finally(() => setLoading(false));
  }, [user?.fullName, reset]);

  async function onSubmit(values: ProfileFormValues) {
    setError(null);
    setSuccess(null);
    try {
      const [updatedUser, updatedCompany] = await Promise.all([
        updateProfile({ fullName: values.fullName }),
        updateMyCompany({
          companyName: values.companyName,
          taxId: values.taxId,
          phone: values.phone,
          address: values.address,
        }),
      ]);
      setCompany(updatedCompany);
      if (session) {
        applySession({
          ...session,
          user: {
            ...session.user,
            fullName: updatedUser.fullName,
            company: updatedCompany
              ? { id: updatedCompany.id, companyName: updatedCompany.companyName, taxId: updatedCompany.taxId, phone: updatedCompany.phone, address: updatedCompany.address }
              : null,
          },
        });
      }
      setSuccess('Perfil actualizado correctamente');
    } catch {
      setError('No se pudo actualizar el perfil');
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Perfil de empresa</h1>
        <p className="mt-1 text-sm text-slate-400">Actualiza los datos de tu empresa y tu perfil personal</p>
      </div>

      {success && (
        <p className="rounded-xl bg-emerald-500/15 px-4 py-3 text-sm text-emerald-300">{success}</p>
      )}
      {error && (
        <p className="rounded-xl bg-red-500/15 px-4 py-3 text-sm text-red-300">{error}</p>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 space-y-4">
          <h2 className="text-sm font-semibold text-white">Datos personales</h2>
          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-400">Nombre completo</label>
            <input className="input" {...register('fullName')} />
            {errors.fullName && <p className="mt-1 text-xs text-red-400">{errors.fullName.message}</p>}
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-400">Email</label>
            <input className="input" value={user?.email ?? ''} disabled />
          </div>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 space-y-4">
          <h2 className="text-sm font-semibold text-white">Datos de la empresa</h2>

          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-400">Nombre fiscal *</label>
            <input className="input" {...register('companyName')} />
            {errors.companyName && <p className="mt-1 text-xs text-red-400">{errors.companyName.message}</p>}
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-400">CIF/NIF *</label>
            <input className="input" {...register('taxId')} />
            {errors.taxId && <p className="mt-1 text-xs text-red-400">{errors.taxId.message}</p>}
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-400">Teléfono</label>
            <input className="input" {...register('phone')} placeholder="+34 600 000 000" />
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-400">Dirección</label>
            <input className="input" {...register('address')} placeholder="Calle, ciudad, país" />
          </div>
        </div>

        <div className="flex justify-end">
          <button type="submit" disabled={isSubmitting} className="primary-button">
            {isSubmitting ? 'Guardando...' : 'Guardar cambios'}
          </button>
        </div>
      </form>
    </div>
  );
}
