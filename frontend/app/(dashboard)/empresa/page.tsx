'use client';

import { Spinner } from '@/components/ui/spinner';
import { StatCard } from '@/components/ui/stat-card';
import { useAuth } from '@/lib/auth-context';
import { fetchMyDocuments, type DocumentRecord } from '@/lib/documents-service';
import { faFile, faFileExport, faFileImport, faGear } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import Link from 'next/link';
import { useEffect, useState } from 'react';

export default function EmpresaDashboard() {
  const { user } = useAuth();
  const [documents, setDocuments] = useState<DocumentRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMyDocuments()
      .then(setDocuments)
      .finally(() => setLoading(false));
  }, []);

  const incoming = documents.filter((d) => d.direction === 'INCOMING').length;
  const outgoing = documents.filter((d) => d.direction === 'OUTGOING').length;

  return (
    <div className="space-y-8">
      <div>
        <p className="text-sm font-semibold uppercase tracking-widest text-cyan-400">
          Panel empresarial
        </p>
        <h1 className="mt-1 text-2xl font-bold text-white">
          Bienvenido, {user?.company?.companyName ?? user?.fullName}
        </h1>
        <p className="mt-1 text-sm text-slate-400">
          Gestiona tus auditorías y documentos de seguridad
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Spinner size="lg" /></div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <StatCard
              title="Total documentos"
              value={documents.length}
              icon={<FontAwesomeIcon icon={faFile} className="text-lg" />}
            />
            <StatCard
              title="Recibidos"
              value={incoming}
              icon={<FontAwesomeIcon icon={faFileImport} className="text-lg" />}
              sub="Documentos de CGA Security"
            />
            <StatCard
              title="Enviados"
              value={outgoing}
              icon={<FontAwesomeIcon icon={faFileExport} className="text-lg" />}
              sub="Documentos que has subido"
            />
          </div>

          <div>
            <h2 className="mb-4 text-lg font-semibold text-white">Acceso rápido</h2>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Link
                href="/empresa/documentos"
                className="cursor-pointer rounded-2xl border border-slate-800 bg-slate-900/80 p-5 hover:border-cyan-500/40 hover:bg-slate-800 transition-colors"
              >
                <span className="text-2xl"><FontAwesomeIcon icon={faFile} /></span>
                <p className="mt-3 font-semibold text-white">Mis documentos</p>
                <p className="mt-1 text-xs text-slate-400">Ver, subir y descargar ficheros de auditoría</p>
              </Link>
              <Link
                href="/empresa/perfil"
                className="cursor-pointer rounded-2xl border border-slate-800 bg-slate-900/80 p-5 hover:border-cyan-500/40 hover:bg-slate-800 transition-colors"
              >
                <span className="text-2xl"><FontAwesomeIcon icon={faGear} /></span>
                <p className="mt-3 font-semibold text-white">Perfil empresa</p>
                <p className="mt-1 text-xs text-slate-400">Actualiza los datos de tu empresa</p>
              </Link>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
