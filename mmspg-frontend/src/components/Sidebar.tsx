import { NavLink } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import merchantLogo from '../assets/merchant-logo.png';
import {
  LayoutDashboard,
  Users,
  Building2,
  Settings,
  CreditCard,
  UserCog,
  ChevronLeft,
  ShieldCheck
} from 'lucide-react';

type SidebarLink = {
  to: string;
  icon: typeof LayoutDashboard;
  label: string;
};

interface SidebarProps {
  isOpen?: boolean;
  onToggle?: () => void;
}

export default function Sidebar({ isOpen = true, onToggle }: SidebarProps) {
  const { t } = useTranslation();

  const [userRole, setUserRole] = useState<string>(() =>
    (localStorage.getItem('userRole') || 'ADMIN').toUpperCase()
  );

  useEffect(() => {
    const handleProfileUpdate = () => {
      const storedRole = (localStorage.getItem('userRole') || 'ADMIN').toUpperCase();
      setUserRole(storedRole);
    };
    window.addEventListener('profileUpdated', handleProfileUpdate);
    return () => {
      window.removeEventListener('profileUpdated', handleProfileUpdate);
    };
  }, []);

  const basePath = userRole === 'SUPPORT'
    ? '/support'
    : userRole === 'AUDITOR'
      ? '/auditor'
      : '/admin';

  let sidebarLinks: SidebarLink[] = [];

  if (userRole === 'MERCHANT') {
    sidebarLinks = [
      { to: '/merchant/dashboard', icon: LayoutDashboard, label: t('nav.dashboardReports') },
      { to: '/merchant/reports', icon: LayoutDashboard, label: 'Report' },
      { to: '/merchant/webhooks', icon: LayoutDashboard, label: 'Webhooks' },

    ];
  } else {
    sidebarLinks = [
      { to: `${basePath}/dashboard`, icon: LayoutDashboard, label: t('nav.dashboard') },
      { to: `${basePath}/merchant-approvals`, icon: Users, label: t('nav.merchantApprovals') },
      { to: `${basePath}/branches`, icon: Building2, label: t('nav.branchManagement') },
      { to: `${basePath}/mcc-configuration`, icon: Settings, label: t('nav.mccManagement') },
      { to: `${basePath}/terminals`, icon: CreditCard, label: t('nav.terminals') },
    ];

    if (userRole === 'ADMIN') {
      sidebarLinks.push(
        { to: `${basePath}/staff-users`, icon: UserCog, label: t('nav.staffUsers') }
      );
    }

    if (userRole === 'ADMIN' || userRole === 'AUDITOR') {
      sidebarLinks.push(
        { to: `${basePath}/audit-logs`, icon: ShieldCheck, label: t('nav.auditLogs', 'Audit Logs') }
      );
    }
  }

  const sectionTitle =
    userRole === 'SUPPORT' ? t('nav.support') :
      userRole === 'AUDITOR' ? t('nav.auditor') :
        userRole === 'MERCHANT' ? t('nav.merchant') :
          t('nav.administration');

  return (
    <aside className={`${isOpen
      ? 'w-64 opacity-100 translate-x-0'
      : 'w-0 -translate-x-full opacity-0 pointer-events-none p-0 overflow-hidden border-0'
      } bg-slate-900 dark:bg-slate-950 text-white min-h-screen flex flex-col transition-all duration-300 ease-in-out shadow-xl z-20 border-r border-slate-800 shrink-0`}>
      {/* Brand */}
      <div className="px-4 py-4 border-b border-slate-800 flex items-center justify-between gap-2.5">
        <div className="flex items-center gap-2.5 min-w-0">
          <img src={merchantLogo} alt="PaymentGateWay Logo" className="h-8 w-auto object-contain shrink-0 filter drop-shadow" />
          <h1 className="text-base font-bold text-white tracking-tight truncate">
            PaymentGateWay
          </h1>
        </div>
        {onToggle && (
          <button
            type="button"
            onClick={onToggle}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors focus:outline-none shrink-0"
            title="Collapse Sidebar"
            aria-label="Collapse Sidebar"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Nav Links */}
      <nav className="flex-1 py-6 px-3 space-y-1">
        <div className="px-3 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
          {sectionTitle}
        </div>

        {sidebarLinks.map((link) => {
          const Icon = link.icon;
          return (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                `flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${isActive
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`
              }
            >
              <Icon className="mr-3 h-5 w-5 shrink-0" />
              {link.label}
            </NavLink>
          );
        })}
      </nav>

      {/* Settings at bottom (non-merchant only) */}
      {userRole !== 'MERCHANT' && (
        <div className="px-3 pb-3 border-t border-slate-800 pt-3">
          <NavLink
            to={`${basePath}/settings`}
            className={({ isActive }) =>
              `flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${isActive
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`
            }
          >
            <Settings className="mr-3 h-5 w-5 shrink-0" />
            {t('nav.settings')}
          </NavLink>
        </div>
      )}

      <div className="p-4 border-t border-slate-800">
        <p className="px-4 text-xs text-slate-600">{t('nav.version')}</p>
      </div>
    </aside>
  );
}
