export default function AdminDashboard() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-800">Admin Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <h3 className="text-lg font-medium text-slate-700">Total Merchants</h3>
          <p className="text-3xl font-bold text-blue-600 mt-2">1,248</p>
        </div>
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <h3 className="text-lg font-medium text-slate-700">Active Terminals</h3>
          <p className="text-3xl font-bold text-green-600 mt-2">5,892</p>
        </div>
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <h3 className="text-lg font-medium text-slate-700">Pending Approvals</h3>
          <p className="text-3xl font-bold text-amber-500 mt-2">24</p>
        </div>
      </div>
    </div>
  );
}
