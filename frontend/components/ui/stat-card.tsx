import type { ReactNode } from 'react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: ReactNode;
  sub?: string;
}

export function StatCard({ title, value, icon, sub }: StatCardProps) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5">
      <div className="flex items-start justify-between">
        <p className="text-sm font-medium text-slate-400">{title}</p>
        <span className="rounded-xl bg-slate-800 p-2 text-cyan-400">{icon}</span>
      </div>
      <p className="mt-3 text-3xl font-bold text-white">{value}</p>
      {sub && <p className="mt-1 text-xs text-slate-500">{sub}</p>}
    </div>
  );
}
