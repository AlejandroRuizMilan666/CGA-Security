'use client';

import { Spinner } from '@/components/ui/spinner';
import { fetchCompanies, type CompanyDetail } from '@/lib/companies-service';
import { faLocationDot, faPhone } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import Link from 'next/link';
import { useEffect, useState } from 'react';

export default function AdminCompaniesPage() {
  const [companies, setCompanies] = useState<CompanyDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchCompanies()
      .then(setCompanies)
      .catch(() => setError('No se pudieron cargar las empresas'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Empresas registradas</h1>
        <p className="mt-1 text-sm text-slate-400">{companies.length} empresas en la plataforma</p>
      </div>

      {error && (
        <p className="rounded-xl bg-red-500/15 px-4 py-3 text-sm text-red-300">{error}</p>
      )}

      {loading ? (
        <div className="flex justify-center py-16"><Spinner size="lg" /></div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {companies.map((company) => (
            <div
              key={company.id}
              className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 space-y-3"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="font-bold text-white">{company.companyName}</h2>
                  <p className="text-xs text-slate-500 mt-0.5">CIF/NIF: {company.taxId}</p>
                </div>
                <span className="rounded-full bg-purple-500/15 px-2.5 py-0.5 text-xs font-semibold text-purple-300 ring-1 ring-inset ring-purple-500/30">
                  Empresa
                </span>
              </div>

              {company.user && (
                <div className="text-sm text-slate-400 space-y-0.5">
                  <p>{company.user.fullName}</p>
                  <p className="text-xs text-slate-500">{company.user.email}</p>
                </div>
              )}

              {(company.phone || company.address) && (
                <div className="text-xs text-slate-500 space-y-0.5 border-t border-slate-800 pt-3">
                  {company.phone && <p><FontAwesomeIcon icon={faPhone} className="mr-1" />{company.phone}</p>}
                  {company.address && <p><FontAwesomeIcon icon={faLocationDot} className="mr-1" />{company.address}</p>}
                </div>
              )}

              <div className="border-t border-slate-800 pt-3">
                <Link
                  href={`/admin/documents/${company.id}`}
                  className="cursor-pointer text-sm font-semibold text-cyan-400 hover:text-cyan-300 transition-colors"
                >
                  Ver documentos →
                </Link>
              </div>
            </div>
          ))}

          {companies.length === 0 && (
            <p className="col-span-3 py-10 text-center text-sm text-slate-500">
              No hay empresas registradas todavía
            </p>
          )}
        </div>
      )}
    </div>
  );
}
