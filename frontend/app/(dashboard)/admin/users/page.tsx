'use client';

import { Spinner } from '@/components/ui/spinner';
import type { AppRole } from '@/lib/auth-service';
import { adminUpdateUser, fetchUsers, type AdminUpdateUserPayload, type UserDetail } from '@/lib/users-service';
import { useEffect, useState } from 'react';

type EditState = { id: string; fullName: string; isActive: boolean; role: AppRole } | null;

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<AppRole | 'ALL'>('ALL');
  const [editing, setEditing] = useState<EditState>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    try {
      const data = await fetchUsers();
      setUsers(data);
    } catch {
      setError('No se pudieron cargar los usuarios');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void load(); }, []);

  const filtered = filter === 'ALL' ? users : users.filter((u) => u.role === filter);

  async function handleSave() {
    if (!editing) return;
    setSaving(true);
    try {
      const payload: AdminUpdateUserPayload = {
        fullName: editing.fullName,
        isActive: editing.isActive,
        role: editing.role,
      };
      await adminUpdateUser(editing.id, payload);
      setEditing(null);
      await load();
    } catch {
      setError('No se pudo actualizar el usuario');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Gestión de usuarios</h1>
          <p className="mt-1 text-sm text-slate-400">{users.length} usuarios registrados</p>
        </div>

        {/* Role filter */}
        <div className="flex gap-2">
          {(['ALL', 'ADMIN', 'EMPRESA', 'ALUMNO'] as const).map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setFilter(r)}
              className={`cursor-pointer rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                filter === r
                  ? 'bg-cyan-500/20 text-cyan-300'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              {r === 'ALL' ? 'Todos' : r}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <p className="rounded-xl bg-red-500/15 px-4 py-3 text-sm text-red-300">{error}</p>
      )}

      {loading ? (
        <div className="flex justify-center py-16"><Spinner size="lg" /></div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-slate-800">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-900/60">
                <th className="px-4 py-3 text-left font-semibold text-slate-400">Nombre</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-400">Email</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-400">Estado</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-400">Empresa</th>
                <th className="px-4 py-3 text-right font-semibold text-slate-400">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((user) => (
                <tr key={user.id} className="border-b border-slate-800/50 hover:bg-slate-800/30">
                  <td className="px-4 py-3 font-medium text-white">{user.fullName}</td>
                  <td className="px-4 py-3 text-slate-300">{user.email}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-semibold ring-1 ring-inset ${user.isActive ? 'bg-emerald-500/15 text-emerald-300 ring-emerald-500/30' : 'bg-red-500/15 text-red-300 ring-red-500/30'}`}>
                      {user.isActive ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-400">{user.company?.companyName ?? '—'}</td>
                  <td className="px-4 py-3 text-right">
                    <button
                      type="button"
                      onClick={() =>
                        setEditing({
                          id: user.id,
                          fullName: user.fullName,
                          isActive: user.isActive,
                          role: user.role,
                        })
                      }
                      className="cursor-pointer rounded-lg bg-slate-700 px-3 py-1 text-xs font-semibold hover:bg-slate-600 transition-colors"
                    >
                      Editar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <p className="py-10 text-center text-sm text-slate-500">No hay usuarios con este filtro</p>
          )}
        </div>
      )}

      {/* Edit modal */}
      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
          <div className="w-full max-w-md rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl">
            <h2 className="mb-5 text-lg font-bold text-white">Editar usuario</h2>

            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-400">Nombre completo</label>
                <input
                  className="input"
                  value={editing.fullName}
                  onChange={(e) => setEditing({ ...editing, fullName: e.target.value })}
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-400">Rol</label>
                <select
                  className="input"
                  value={editing.role}
                  onChange={(e) => setEditing({ ...editing, role: e.target.value as AppRole })}
                >
                  <option value="ADMIN">ADMIN</option>
                  <option value="EMPRESA">EMPRESA</option>
                  <option value="ALUMNO">ALUMNO</option>
                </select>
              </div>

              <div className="flex items-center gap-3">
                <input
                  id="isActive"
                  type="checkbox"
                  checked={editing.isActive}
                  onChange={(e) => setEditing({ ...editing, isActive: e.target.checked })}
                  className="h-4 w-4 rounded border-slate-600 bg-slate-800 text-cyan-500"
                />
                <label htmlFor="isActive" className="text-sm text-slate-300">
                  Usuario activo
                </label>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setEditing(null)}
                className="cursor-pointer rounded-xl border border-slate-700 px-4 py-2 text-sm font-semibold text-slate-300 hover:bg-slate-800"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="primary-button"
              >
                {saving ? 'Guardando...' : 'Guardar cambios'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
