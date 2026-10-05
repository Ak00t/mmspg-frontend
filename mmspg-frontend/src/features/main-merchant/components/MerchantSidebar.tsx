export function MerchantSidebar() {
  return (
    <aside className="hidden w-64 shrink-0 border-r border-slate-200 bg-white px-5 py-7 lg:block">
      <div className="mb-12 flex items-center gap-3 px-2">
        <div className="grid size-10 place-items-center rounded-xl bg-indigo-600 text-lg font-bold text-white">M</div>
        <div>
          <p className="text-sm font-semibold tracking-tight">MMSPG</p>
          <p className="text-xs text-slate-400">Merchant portal</p>
        </div>
      </div>
      <nav className="space-y-1">
        <a className="flex items-center gap-3 rounded-xl bg-indigo-50 px-3 py-3 text-sm font-semibold text-indigo-700" href="#dashboard">▦ Dashboard</a>
        <a className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm text-slate-500 hover:bg-slate-50" href="#transactions">↗ Transactions</a>
        <a className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm text-slate-500 hover:bg-slate-50" href="#settlements">◈ Settlements</a>
        <a className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm text-slate-500 hover:bg-slate-50" href="#reports">▤ Reports</a>
      </nav>
      <div className="pt-24">
        <div className="rounded-2xl bg-slate-900 p-4 text-white">
          <p className="text-xs font-medium text-slate-400">Need help?</p>
          <p className="mt-2 text-sm leading-5">Contact your MMSPG support team.</p>
          <button className="mt-4 text-xs font-semibold text-indigo-300">Open support →</button>
        </div>
      </div>
    </aside>
  )
}

