'use client';

import { Badge } from '@/components/ui/badge';
import { Spinner } from '@/components/ui/spinner';
import { fetchCompanyById } from '@/lib/companies-service';
import {
  deleteDocument,
  fetchCompanyDocuments,
  getDownloadUrl,
  uploadDocument,
  type DocumentRecord,
} from '@/lib/documents-service';
import { useParams } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1048576).toFixed(1)} MB`;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('es-ES', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export default function AdminCompanyDocumentsPage() {
  const params = useParams<{ companyId: string }>();
  const [documents, setDocuments] = useState<DocumentRecord[]>([]);
  const [companyName, setCompanyName] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [notes, setNotes] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const [docs, company] = await Promise.all([
        fetchCompanyDocuments(params.companyId),
        fetchCompanyById(params.companyId),
      ]);
      setDocuments(docs);
      setCompanyName(company.companyName);
    } catch {
      setError('No se pudieron cargar los documentos');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void load(); }, [params.companyId]);

  async function handleUpload() {
    const file = fileRef.current?.files?.[0];
    if (!file) { setError('Selecciona un archivo'); return; }
    setUploading(true);
    setError(null);
    try {
      await uploadDocument({ file, direction: 'INCOMING', notes: notes || undefined, companyId: params.companyId });
      if (fileRef.current) fileRef.current.value = '';
      setNotes('');
      await load();
    } catch {
      setError('Error al subir el documento. Verifica el tipo y tamaño (máx. 10 MB).');
    } finally {
      setUploading(false);
    }
  }

  async function handleDownload(doc: DocumentRecord) {
    try {
      const { url } = await getDownloadUrl(doc.id);
      window.open(url, '_blank', 'noopener,noreferrer');
    } catch {
      setError('No se pudo generar el enlace de descarga');
    }
  }

  async function handleDelete(doc: DocumentRecord) {
    if (!confirm(`¿Eliminar "${doc.originalName}"?`)) return;
    setDeletingId(doc.id);
    try {
      await deleteDocument(doc.id);
      await load();
    } catch {
      setError('No se pudo eliminar el documento');
    } finally {
      setDeletingId(null);
    }
  }

  const incoming = documents.filter((d) => d.direction === 'INCOMING');
  const outgoing = documents.filter((d) => d.direction === 'OUTGOING');

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white">Documentos de {companyName || '...'}</h1>
        <p className="mt-1 text-sm text-slate-400">
          Documentos de auditoría de ciberseguridad
        </p>
      </div>

      {error && (
        <p className="rounded-xl bg-red-500/15 px-4 py-3 text-sm text-red-300">{error}</p>
      )}

      {/* Upload */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5">
        <h2 className="mb-4 text-sm font-semibold text-white">Enviar documento a la empresa</h2>
        <div className="flex flex-wrap gap-3">
          <input
            ref={fileRef}
            type="file"
            accept=".pdf,.png,.jpg,.jpeg,.txt,.docx,.xlsx"
            className="flex-1 rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-300 file:mr-3 file:rounded-lg file:border-0 file:bg-cyan-500/20 file:px-3 file:py-1 file:text-xs file:font-semibold file:text-cyan-300"
          />
          <input
            className="input flex-[2]"
            placeholder="Notas o comentarios (opcional)"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
          <button
            type="button"
            onClick={handleUpload}
            disabled={uploading}
            className="primary-button whitespace-nowrap"
          >
            {uploading ? 'Enviando...' : 'Enviar'}
          </button>
        </div>
        <p className="mt-2 text-xs text-slate-500">
          Formatos admitidos: PDF, Word, Excel, imágenes, TXT · Máximo 10 MB
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Spinner size="lg" /></div>
      ) : (
        <div className="space-y-6">
          {/* Sent to company */}
          <div>
            <h2 className="mb-3 text-base font-semibold text-white">
              Enviados a la empresa
              <span className="ml-2 text-sm font-normal text-slate-500">({incoming.length})</span>
            </h2>
            <DocumentTable
              documents={incoming}
              onDownload={handleDownload}
              onDelete={handleDelete}
              deletingId={deletingId}
              emptyText="No has enviado documentos a esta empresa todavía"
            />
          </div>

          {/* Received from company */}
          <div>
            <h2 className="mb-3 text-base font-semibold text-white">
              Recibidos de la empresa
              <span className="ml-2 text-sm font-normal text-slate-500">({outgoing.length})</span>
            </h2>
            <DocumentTable
              documents={outgoing}
              onDownload={handleDownload}
              onDelete={handleDelete}
              deletingId={deletingId}
              emptyText="La empresa no ha enviado documentos todavía"
            />
          </div>
        </div>
      )}
    </div>
  );
}

function DocumentTable({
  documents,
  onDownload,
  onDelete,
  deletingId,
  emptyText,
}: {
  documents: DocumentRecord[];
  onDownload: (doc: DocumentRecord) => void;
  onDelete: (doc: DocumentRecord) => void;
  deletingId: string | null;
  emptyText: string;
}) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-slate-800">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-800 bg-slate-900/60">
            <th className="px-4 py-3 text-left font-semibold text-slate-400">Archivo</th>
            <th className="px-4 py-3 text-left font-semibold text-slate-400">Dirección</th>
            <th className="px-4 py-3 text-left font-semibold text-slate-400">Tamaño</th>
            <th className="px-4 py-3 text-left font-semibold text-slate-400">Fecha</th>
            <th className="px-4 py-3 text-right font-semibold text-slate-400">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {documents.map((doc) => (
            <tr key={doc.id} className="border-b border-slate-800/50 hover:bg-slate-800/30">
              <td className="px-4 py-3">
                <p className="font-medium text-white">{doc.originalName}</p>
                {doc.notes && <p className="text-xs text-slate-500 mt-0.5">{doc.notes}</p>}
              </td>
              <td className="px-4 py-3">
                <Badge
                  label={doc.direction === 'INCOMING' ? 'Enviado' : 'Recibido'}
                  variant={doc.direction === 'INCOMING' ? 'cyan' : 'purple'}
                />
              </td>
              <td className="px-4 py-3 text-slate-400">{formatBytes(doc.sizeBytes)}</td>
              <td className="px-4 py-3 text-slate-400">{formatDate(doc.createdAt)}</td>
              <td className="px-4 py-3">
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => onDownload(doc)}
                    className="cursor-pointer rounded-lg bg-cyan-500/15 px-3 py-1 text-xs font-semibold text-cyan-300 hover:bg-cyan-500/25 transition-colors"
                  >
                    Descargar
                  </button>
                  <button
                    type="button"
                    disabled={deletingId === doc.id}
                    onClick={() => onDelete(doc)}
                    className="cursor-pointer rounded-lg bg-red-500/15 px-3 py-1 text-xs font-semibold text-red-300 hover:bg-red-500/25 transition-colors disabled:cursor-not-allowed"
                  >
                    {deletingId === doc.id ? '...' : 'Eliminar'}
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {documents.length === 0 && (
        <p className="py-8 text-center text-sm text-slate-500">{emptyText}</p>
      )}
    </div>
  );
}
