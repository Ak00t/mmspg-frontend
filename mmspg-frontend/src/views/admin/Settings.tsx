import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Sun, Moon, Globe, Bell, BellOff, Save, CheckCircle, RotateCcw } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';

export default function Settings() {
  const { t, i18n } = useTranslation();
  const { theme, setTheme } = useTheme();

  const [notificationsEnabled, setNotificationsEnabled] = useState<boolean>(() => {
    const stored = localStorage.getItem('notificationsEnabled');
    return stored === null ? true : stored === 'true';
  });

  const [notifMerchant, setNotifMerchant] = useState<boolean>(() => {
    const s = localStorage.getItem('notif_merchant');
    return s === null ? true : s === 'true';
  });

  const [notifBranch, setNotifBranch] = useState<boolean>(() => {
    const s = localStorage.getItem('notif_branch');
    return s === null ? true : s === 'true';
  });

  const [notifSecurity, setNotifSecurity] = useState<boolean>(() => {
    const s = localStorage.getItem('notif_security');
    return s === null ? true : s === 'true';
  });

  const [saved, setSaved] = useState(false);
  const [restored, setRestored] = useState(false);

  const currentLang = i18n.language; // 'en' | 'my'

  const handleLangChange = (lang: string) => {
    i18n.changeLanguage(lang);
    localStorage.setItem('lang', lang);
  };

  const handleToggleNotifications = () => {
    setNotificationsEnabled(prev => {
      const next = !prev;
      localStorage.setItem('notificationsEnabled', String(next));
      window.dispatchEvent(new Event('settingsChanged'));
      return next;
    });
  };

  const handleToggleCategory = (key: 'notif_merchant' | 'notif_branch' | 'notif_security', setter: React.Dispatch<React.SetStateAction<boolean>>) => {
    setter(prev => {
      const next = !prev;
      localStorage.setItem(key, String(next));
      window.dispatchEvent(new Event('settingsChanged'));
      return next;
    });
  };

  const handleResetDismissed = () => {
    localStorage.removeItem('dismissedNotifications');
    window.dispatchEvent(new Event('refreshNotifications'));
    setRestored(true);
    setTimeout(() => setRestored(false), 3000);
  };

  const handleSave = () => {
    localStorage.setItem('notificationsEnabled', String(notificationsEnabled));
    localStorage.setItem('notif_merchant', String(notifMerchant));
    localStorage.setItem('notif_branch', String(notifBranch));
    localStorage.setItem('notif_security', String(notifSecurity));
    window.dispatchEvent(new Event('settingsChanged'));
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{t('settings.title')}</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{t('settings.subtitle')}</p>
      </div>

      {/* ── Language Card ── */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-9 h-9 rounded-lg bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center">
            <Globe className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-slate-900 dark:text-white">{t('settings.language.title')}</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">{t('settings.language.description')}</p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {[
            { code: 'en', flag: '🇬🇧', label: t('settings.language.english') },
            { code: 'my', flag: '🇲🇲', label: t('settings.language.myanmar') },
          ].map(({ code, flag, label }) => (
            <button
              key={code}
              onClick={() => handleLangChange(code)}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg border-2 transition-all text-sm font-medium ${
                currentLang === code
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                  : 'border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-500 hover:bg-slate-50 dark:hover:bg-slate-700'
              }`}
            >
              <span className="text-xl">{flag}</span>
              <span>{label}</span>
              {currentLang === code && (
                <CheckCircle className="ml-auto h-4 w-4 text-blue-500" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* ── Appearance Card ── */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-9 h-9 rounded-lg bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center">
            {theme === 'dark'
              ? <Moon className="h-5 w-5 text-amber-400" />
              : <Sun className="h-5 w-5 text-amber-600" />
            }
          </div>
          <div>
            <h2 className="text-sm font-semibold text-slate-900 dark:text-white">{t('settings.appearance.title')}</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">{t('settings.appearance.description')}</p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {[
            { value: 'light' as const, Icon: Sun,  label: t('settings.appearance.lightMode') },
            { value: 'dark'  as const, Icon: Moon, label: t('settings.appearance.darkMode') },
          ].map(({ value, Icon, label }) => (
            <button
              key={value}
              onClick={() => setTheme(value)}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg border-2 transition-all text-sm font-medium ${
                theme === value
                  ? 'border-amber-500 bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300'
                  : 'border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-500 hover:bg-slate-50 dark:hover:bg-slate-700'
              }`}
            >
              <Icon className="h-4 w-4" />
              {label}
              {theme === value && (
                <CheckCircle className="ml-auto h-4 w-4 text-amber-500" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* ── Master Notifications Card ── */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center transition-colors ${
              notificationsEnabled ? 'bg-green-100 dark:bg-green-900/40' : 'bg-slate-100 dark:bg-slate-700'
            }`}>
              {notificationsEnabled
                ? <Bell className="h-5 w-5 text-green-600 dark:text-green-400" />
                : <BellOff className="h-5 w-5 text-slate-400" />
              }
            </div>
            <div>
              <h2 className="text-sm font-semibold text-slate-900 dark:text-white">{t('settings.notifications.title')}</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">{t('settings.notifications.description')}</p>
            </div>
          </div>
          {/* Toggle switch */}
          <button
            role="switch"
            aria-checked={notificationsEnabled}
            onClick={handleToggleNotifications}
            className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${
              notificationsEnabled ? 'bg-green-500' : 'bg-slate-300 dark:bg-slate-600'
            }`}
          >
            <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-md transition-transform ${
              notificationsEnabled ? 'translate-x-6' : 'translate-x-1'
            }`} />
          </button>
        </div>
        <p className={`mt-3 text-xs font-medium ${
          notificationsEnabled ? 'text-green-600 dark:text-green-400' : 'text-slate-400 dark:text-slate-500'
        }`}>
          {notificationsEnabled ? t('settings.notifications.on') : t('settings.notifications.off')}
        </p>

        {/* ── Individual Notification Toggles ── */}
        <div className="mt-6 pt-5 border-t border-slate-100 dark:border-slate-700 space-y-4">
          <div>
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">{t('settings.notifications.individualTitle')}</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{t('settings.notifications.individualDesc')}</p>
          </div>

          <div className="space-y-3">
            {/* 1. Merchant Alerts */}
            <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-900/50">
              <div>
                <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">{t('settings.notifications.merchantAlerts')}</p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">{t('settings.notifications.merchantAlertsDesc')}</p>
              </div>
              <button
                role="switch"
                aria-checked={notifMerchant}
                onClick={() => handleToggleCategory('notif_merchant', setNotifMerchant)}
                className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors ${
                  notifMerchant ? 'bg-blue-600' : 'bg-slate-300 dark:bg-slate-600'
                }`}
              >
                <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${
                  notifMerchant ? 'translate-x-4' : 'translate-x-1'
                }`} />
              </button>
            </div>

            {/* 2. Branch & Terminal Alerts */}
            <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-900/50">
              <div>
                <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">{t('settings.notifications.branchAlerts')}</p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">{t('settings.notifications.branchAlertsDesc')}</p>
              </div>
              <button
                role="switch"
                aria-checked={notifBranch}
                onClick={() => handleToggleCategory('notif_branch', setNotifBranch)}
                className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors ${
                  notifBranch ? 'bg-blue-600' : 'bg-slate-300 dark:bg-slate-600'
                }`}
              >
                <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${
                  notifBranch ? 'translate-x-4' : 'translate-x-1'
                }`} />
              </button>
            </div>

            {/* 3. System & Security Alerts */}
            <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-900/50">
              <div>
                <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">{t('settings.notifications.securityAlerts')}</p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">{t('settings.notifications.securityAlertsDesc')}</p>
              </div>
              <button
                role="switch"
                aria-checked={notifSecurity}
                onClick={() => handleToggleCategory('notif_security', setNotifSecurity)}
                className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors ${
                  notifSecurity ? 'bg-blue-600' : 'bg-slate-300 dark:bg-slate-600'
                }`}
              >
                <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${
                  notifSecurity ? 'translate-x-4' : 'translate-x-1'
                }`} />
              </button>
            </div>
          </div>

          {/* Reset Dismissed */}
          <div className="pt-2 flex items-center justify-between">
            <span className="text-xs text-slate-500 dark:text-slate-400">
              Restore previously closed/dismissed notifications:
            </span>
            <button
              onClick={handleResetDismissed}
              className="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 font-medium"
            >
              <RotateCcw className="h-3 w-3" />
              {restored ? 'Restored!' : 'Restore Closed Alerts'}
            </button>
          </div>
        </div>
      </div>

      {/* ── Save Button ── */}
      <div className="flex items-center gap-4">
        <button
          onClick={handleSave}
          className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-semibold transition-colors shadow-sm"
        >
          <Save className="h-4 w-4" />
          {t('settings.saveButton')}
        </button>
        {saved && (
          <span className="flex items-center gap-1.5 text-sm text-green-600 dark:text-green-400 font-medium">
            <CheckCircle className="h-4 w-4" />
            {t('settings.savedMessage')}
          </span>
        )}
      </div>
    </div>
  );
}
