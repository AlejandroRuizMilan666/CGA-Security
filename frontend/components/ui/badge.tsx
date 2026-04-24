type BadgeVariant = 'cyan' | 'green' | 'yellow' | 'red' | 'slate' | 'purple';

const variantMap: Record<BadgeVariant, string> = {
  cyan: 'bg-cyan-500/15 text-cyan-300 ring-cyan-500/30',
  green: 'bg-emerald-500/15 text-emerald-300 ring-emerald-500/30',
  yellow: 'bg-yellow-500/15 text-yellow-300 ring-yellow-500/30',
  red: 'bg-red-500/15 text-red-300 ring-red-500/30',
  slate: 'bg-slate-500/15 text-slate-300 ring-slate-500/30',
  purple: 'bg-purple-500/15 text-purple-300 ring-purple-500/30',
};

interface BadgeProps {
  label: string;
  variant?: BadgeVariant;
}

export function Badge({ label, variant = 'slate' }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset ${variantMap[variant]}`}
    >
      {label}
    </span>
  );
}

export function roleBadge(role: string) {
  const map: Record<string, BadgeVariant> = {
    ADMIN: 'red',
    EMPRESA: 'purple',
    ALUMNO: 'cyan',
  };
  return <Badge label={role} variant={map[role] ?? 'slate'} />;
}
