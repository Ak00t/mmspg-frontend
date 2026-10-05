type MetricCardProps = {
  label: string
  value: string
  helper: string
  accent: 'indigo' | 'sky' | 'emerald' | 'amber'
}

const accentClasses = {
  indigo: 'bg-indigo-100 text-indigo-600',
  sky: 'bg-sky-100 text-sky-600',
  emerald: 'bg-emerald-100 text-emerald-600',
  amber: 'bg-amber-100 text-amber-600',
}

export function MetricCard({ label, value, helper, accent }: MetricCardProps) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <span className="text-sm text-slate-500">{label}</span>
        <span className={`grid size-9 place-items-center rounded-xl text-lg ${accentClasses[accent]}`}>↗</span>
      </div>
      <p className="mt-5 text-2xl font-bold tracking-tight">{value}</p>
      <p className="mt-1 text-xs text-slate-400">{helper}</p>
    </article>
  )
}

