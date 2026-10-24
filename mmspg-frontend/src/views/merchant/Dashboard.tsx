import { MerchantReportExport } from '../../features/main-merchant/components/MerchantReportExport';

export default function Dashboard() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Merchant Dashboard</h1>
          <p className="mt-1 text-sm text-slate-500">Welcome to your merchant portal.</p>
        </div>
      </div>

      <MerchantReportExport />
    </div>
  );
}

