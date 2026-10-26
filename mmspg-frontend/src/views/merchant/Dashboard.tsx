import { useTranslation } from 'react-i18next';
import { MerchantReportExport } from '../../features/main-merchant/components/MerchantReportExport';

export default function Dashboard() {
  const { t } = useTranslation();
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white">{t('merchantDashboard.title')}</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{t('merchantDashboard.subtitle')}</p>
        </div>
      </div>

      <MerchantReportExport />
    </div>
  );
}
