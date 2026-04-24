'use client';

import { Spinner } from '@/components/ui/spinner';
import { useAuth } from '@/lib/auth-context';
import { fetchMe, updateMyProfile, type UserDetail } from '@/lib/users-service';
import { useEffect, useState } from 'react';

export default function AlumnoPerfilPage() {
  const { session, applySession } = useAuth();
  const [profile, setProfile] = useState<UserDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [fullName, setFullName] = useState('');
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchMe()
      .then((p) => {
        setProfile(p);
        setFullName(p.fullName);
      })
      .finally(() => setLoading(false));
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!fullName.trim()) return;
    setSaving(true);
    setError(null);
    setSuccess(false);
    try {
      const updated = await updateMyProfile({ fullName: fullName.trim() });
      setProfile(updated);
      setFullName(updated.fullName);
      setSuccess(true);
      // Reflect the new name in the auth context so the sidebar updates
      if (session) {
        applySession({
          ...session,
          user: { ...session.user, fullName: updated.fullName },
        });
      }
    } catch {
      setError('No se pudo actualizar el perfil');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!profile) {
    return (
      <p className="rounded-xl bg-red-500/15 px-4 py-3 text-sm text-red-300">
        No se pudo cargar el perfil
      </p>
    );
  }

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Mi perfil</h1>
        <p className="mt-1 text-sm text-slate-400">
          Edita tu información personal
        </p>
      </div>

      {/* Info card */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6 space-y-3">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-cyan-500/15 text-xl font-bold text-cyan-400">
            {profile.fullName.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="font-semibold text-white">{profile.fullName}</p>
            <p className="text-sm text-slate-400">{profile.email}</p>
          </div>
        </div>
        <div className="border-t border-slate-800 pt-3 text-xs text-slate-500">
          Cuenta creada el{' '}
          {new Date(profile.createdAt).toLocaleDateString('es-ES', {
            day: '2-digit',
            month: 'long',
            year: 'numeric',
          })}
        </div>
      </div>

      {/* Edit form */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6">
        <h2 className="mb-4 text-base font-semibold text-white">
          Editar información
        </h2>

        {success && (
          <p className="mb-4 rounded-xl bg-emerald-500/15 px-4 py-3 text-sm text-emerald-300">
            Perfil actualizado correctamente
          </p>
        )}
        {error && (
          <p className="mb-4 rounded-xl bg-red-500/15 px-4 py-3 text-sm text-red-300">
            {error}
          </p>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-400">
              Nombre completo
            </label>
            <input
              className="input"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Tu nombre completo"
              maxLength={120}
              required
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-400">
              Correo electrónico
            </label>
            <input
              className="input cursor-not-allowed opacity-50"
              value={profile.email}
              disabled
              readOnly
            />
            <p className="mt-1 text-xs text-slate-500">
              El correo no se puede modificar
            </p>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={saving || fullName.trim() === profile.fullName}
              className="primary-button"
            >
              {saving ? 'Guardando...' : 'Guardar cambios'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
