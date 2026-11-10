export default function Loading({ label = 'Loading...' }) {
  return (
    <div className="flex min-h-[200px] items-center justify-center gap-3 text-slate-500">
      <span className="h-5 w-5 animate-spin rounded-full border-2 border-slate-300 border-t-[#1e3a5f]" />
      <span>{label}</span>
    </div>
  );
}
