import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Sun, Moon, Globe, Bell, BellOff, Save, CheckCircle, RotateCcw, User } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';

export default function Settings() {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const { theme, setTheme } = useTheme();

  const [userName, setUserName] = useState<string>(() => localStorage.getItem('userName') || 'Portal User');
  const [userRole, setUserRole] = useState<string>(() => (localStorage.getItem('userRole') || 'ADMIN').toUpperCase());
  const [userEmail, setUserEmail] = useState<string>(() => localStorage.getItem('userEmail') || '');
  const [avatar, setAvatar] = useState<string | null>(
    () => localStorage.getItem('adminProfileImage') || localStorage.getItem('userAvatar')
  );

  useEffect(() => {
    const sync = () => {
      setUserName(localStorage.getItem('userName') || 'Portal User');
      setUserRole((localStorage.getItem('userRole') || 'ADMIN').toUpperCase());
      setUserEmail(localStorage.getItem('userEmail') || '');
      setAvatar(localStorage.getItem('adminProfileImage') || localStorage.getItem('userAvatar'));
    };
    window.addEventListener('profileUpdated', sync);
    window.addEventListener('avatarUpdated', sync);
    return () => {
      window.removeEventListener('profileUpdated', sync);
      window.removeEventListener('avatarUpdated', sync);
    };
  }, []);

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

  const handleGoToProfile = () => {
    const role = userRole.toUpperCase();
    const targetPath = role === 'MERCHANT' ? '/merchant/profile'
      : role === 'SUPPORT' ? '/support/profile'
      : role === 'AUDITOR' ? '/auditor/profile'
      : '/admin/profile';
    navigate(targetPath);
  };

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">{t('settings.title')}</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{t('settings.subtitle')}</p>
      </div>

      {/* ── Profile Account Card (Requested in Settings) ── */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5 shadow-xs flex items-center justify-between">
        <div className="flex items-center gap-4 min-w-0">
          <div className="h-12 w-12 rounded-full bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center text-blue-600 dark:text-blue-300 border border-blue-200 dark:border-blue-800 overflow-hidden shrink-0">
            {avatar ? (
              <img src={avatar} alt="Profile" className="h-full w-full object-cover" />
            ) : (
              <User className="h-6 w-6" />
            )}
          </div>
          <div className="min-w-0">
            <h2 className="text-base font-bold text-slate-900 dark:text-white truncate">{userName}</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              <span className="font-semibold text-blue-600 dark:text-blue-400">{userRole}</span> {userEmail ? `• ${userEmail}` : ''}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={handleGoToProfile}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/50 border border-blue-200 dark:border-blue-800 transition shrink-0 cursor-pointer"
        >
          <User className="h-4 w-4" />
          <span>{t('nav.profile')} →</span>
        </button>
      </div>

      {/* ── Language Card ── */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 shadow-xs">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-9 h-9 rounded-xl bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center">
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
              className={`flex items-center gap-3 px-4 py-3 rounded-xl border-2 transition-all text-sm font-medium cursor-pointer ${
                currentLang === code
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 font-semibold'
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
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 shadow-xs">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-9 h-9 rounded-xl bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center">
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
          <button
            onClick={() => setTheme('light')}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl border-2 transition-all text-sm font-medium cursor-pointer ${
              theme === 'light'
                ? 'border-amber-500 bg-amber-50/50 dark:bg-amber-950/20 text-slate-900 dark:text-white font-semibold'
                : 'border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
            }`}
          >
            <Sun className="h-5 w-5 text-amber-500" />
            <span>{t('settings.appearance.lightMode')}</span>
            {theme === 'light' && <CheckCircle className="ml-auto h-4 w-4 text-amber-500" />}
          </button>

          <button
            onClick={() => setTheme('dark')}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl border-2 transition-all text-sm font-medium cursor-pointer ${
              theme === 'dark'
                ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/30 text-slate-900 dark:text-white font-semibold'
                : 'border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
            }`}
          >
            <Moon className="h-5 w-5 text-indigo-400" />
            <span>{t('settings.appearance.darkMode')}</span>
            {theme === 'dark' && <CheckCircle className="ml-auto h-4 w-4 text-indigo-400" />}
          </button>
        </div>
      </div>

      {/* ── Notifications Card ── */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 shadow-xs">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
              notificationsEnabled
                ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400'
                : 'bg-slate-100 dark:bg-slate-700 text-slate-400'
            }`}>
              {notificationsEnabled ? <Bell className="h-5 w-5" /> : <BellOff className="h-5 w-5" />}
            </div>
            <div>
              <h2 className="text-sm font-semibold text-slate-900 dark:text-white">{t('settings.notifications.title')}</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {notificationsEnabled ? t('settings.notifications.on') : t('settings.notifications.off')}
              </p>
            </div>
          </div>
          <button
            role="switch"
            aria-checked={notificationsEnabled}
            onClick={handleToggleNotifications}
            className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors cursor-pointer ${
              notificationsEnabled ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-600'
            }`}
          >
            <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
              notificationsEnabled ? 'translate-x-6' : 'translate-x-1'
            }`} />
          </button>
        </div>

        {/* Category Toggles */}
        <div className={`space-y-4 pt-4 border-t border-slate-100 dark:border-slate-700 transition-opacity ${
          notificationsEnabled ? 'opacity-100' : 'opacity-40 pointer-events-none'
        }`}>
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            {t('settings.notifications.individualTitle')}
          </p>

          <div className="space-y-2">
            {/* 1. Merchant alerts */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-900/50">
              <div>
                <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">{t('settings.notifications.merchantAlerts')}</p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">{t('settings.notifications.merchantAlertsDesc')}</p>
              </div>
              <button
                role="switch"
                aria-checked={notifMerchant}
                onClick={() => handleToggleCategory('notif_merchant', setNotifMerchant)}
                className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors cursor-pointer ${
                  notifMerchant ? 'bg-blue-600' : 'bg-slate-300 dark:bg-slate-600'
                }`}
              >
                <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${
                  notifMerchant ? 'translate-x-4' : 'translate-x-1'
                }`} />
              </button>
            </div>

            {/* 2. Branch & Terminal Alerts */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-900/50">
              <div>
                <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">{t('settings.notifications.branchAlerts')}</p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">{t('settings.notifications.branchAlertsDesc')}</p>
              </div>
              <button
                role="switch"
                aria-checked={notifBranch}
                onClick={() => handleToggleCategory('notif_branch', setNotifBranch)}
                className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors cursor-pointer ${
                  notifBranch ? 'bg-blue-600' : 'bg-slate-300 dark:bg-slate-600'
                }`}
              >
                <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${
                  notifBranch ? 'translate-x-4' : 'translate-x-1'
                }`} />
              </button>
            </div>

            {/* 3. System & Security Alerts */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-900/50">
              <div>
                <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">{t('settings.notifications.securityAlerts')}</p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">{t('settings.notifications.securityAlertsDesc')}</p>
              </div>
              <button
                role="switch"
                aria-checked={notifSecurity}
                onClick={() => handleToggleCategory('notif_security', setNotifSecurity)}
                className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors cursor-pointer ${
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
              className="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 font-medium cursor-pointer"
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
          className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold transition-colors shadow-xs cursor-pointer"
        >
          <Save className="h-4 w-4" />
          {t('settings.saveButton')}
        </button>
        {saved && (
          <span className="flex items-center gap-1.5 text-sm text-green-600 dark:text-green-400 font-medium animate-in fade-in">
            <CheckCircle className="h-4 w-4" />
            {t('settings.savedMessage')}
          </span>
        )}
      </div>
    </div>
  );
}
