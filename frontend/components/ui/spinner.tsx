export function Spinner({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const sizes = { sm: 'h-4 w-4', md: 'h-6 w-6', lg: 'h-10 w-10' };
  return (
    <span
      aria-label="Cargando"
      role="status"
      className={`inline-block animate-spin rounded-full border-2 border-slate-600 border-t-cyan-400 ${sizes[size]}`}
    />
  );
}
