import { NavLink, useNavigate } from 'react-router-dom';
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
  FileText,
  Webhook,
  LogOut,
  Percent,
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
  const navigate = useNavigate();

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
      { to: '/merchant/reports', icon: FileText, label: t('nav.reports') },
      { to: '/merchant/webhooks', icon: Webhook, label: t('nav.webhooks') },
      { to: '/merchant/settings', icon: Settings, label: t('nav.settings') },
    ];
  } else {
    sidebarLinks = [
      { to: `${basePath}/dashboard`, icon: LayoutDashboard, label: t('nav.dashboard') },
      { to: `${basePath}/merchant-approvals`, icon: Users, label: t('nav.merchantApprovals') },
      { to: `${basePath}/branches`, icon: Building2, label: t('nav.branchManagement') },
      { to: `${basePath}/mcc-configuration`, icon: Settings, label: t('nav.mccManagement') },
      { to: `${basePath}/fee-configuration`, icon: Percent, label: t('nav.feeConfiguration') },
      { to: `${basePath}/terminals`, icon: CreditCard, label: t('nav.terminals') },
    ];

    if (userRole === 'ADMIN') {
      sidebarLinks.push(
        { to: `${basePath}/staff-users`, icon: UserCog, label: t('nav.staffUsers') }
      );
    }

    if (userRole === 'ADMIN') {
      sidebarLinks.push(
        { to: `${basePath}/audit-logs`, icon: ShieldCheck, label: t('nav.auditLogs', 'Audit Logs') }
      );
    }

    // Setting moved up into main navigation links for admin/support/auditor
    sidebarLinks.push(
      { to: `${basePath}/settings`, icon: Settings, label: t('nav.settings') }
    );
  }

  const sectionTitle =
    userRole === 'SUPPORT' ? t('nav.support') :
      userRole === 'AUDITOR' ? t('nav.auditor') :
        userRole === 'MERCHANT' ? t('nav.merchant') :
          t('nav.administration');

  const handleLogout = () => {
    [
      'token',
      'mmspg_token',
      'userId',
      'merchantId',
      'mmspg_merchant_id',
      'userName',
      'userRole',
      'userAvatar',
      'adminProfileImage'
    ].forEach(k => localStorage.removeItem(k));
    navigate('/login');
  };

  return (
    <aside className={`${isOpen
      ? 'w-64 opacity-100 translate-x-0'
      : 'w-0 -translate-x-full opacity-0 pointer-events-none p-0 overflow-hidden border-0'
      } bg-slate-900 dark:bg-slate-950 text-white min-h-screen flex flex-col transition-all duration-300 ease-in-out shadow-2xl z-20 border-r border-slate-800 shrink-0 select-none`}>
      {/* Brand Header with Clean Animated Logo Icon */}
      <div className="px-4 py-4 border-b border-slate-800 flex items-center justify-between gap-2.5 bg-slate-950/40">
        <div className="flex items-center gap-3 min-w-0">
          <div className="relative flex items-center justify-center shrink-0">
            <img
              src={merchantLogo}
              alt="PaymentGateWay Logo"
              className="h-10 w-auto object-contain shrink-0 animate-logo-float transition-transform duration-300 hover:scale-110 filter drop-shadow-[0_4px_12px_rgba(147,51,234,0.45)] cursor-pointer"
            />
          </div>
          <div className="flex flex-col min-w-0">
            <h1 className="text-sm font-bold text-white tracking-tight truncate leading-tight">
              PaymentGateWay
            </h1>
            <span className="text-[10px] text-purple-400 font-semibold tracking-wide uppercase">
              {userRole === 'MERCHANT' ? 'Merchant Portal' : 'Admin Portal'}
            </span>
          </div>
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
      <nav className="flex-1 py-5 px-3 space-y-1.5 overflow-y-auto">
        <div className="px-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
          {sectionTitle}
        </div>

        {sidebarLinks.map((link) => {
          const Icon = link.icon;
          return (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                `flex items-center px-3.5 py-2.5 text-sm font-medium rounded-xl transition-all duration-200 group ${isActive
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-600/30 font-semibold'
                  : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                }`
              }
            >
              <Icon className="mr-3 h-5 w-5 shrink-0 transition-transform group-hover:scale-110" />
              <span className="truncate">{link.label}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* Bottom Actions: Single Logout button at bottom of sidebar */}
      <div className="p-3 border-t border-slate-800/80 space-y-2 bg-slate-950/30">
        <button
          type="button"
          onClick={handleLogout}
          className="flex items-center w-full px-3.5 py-2.5 text-sm font-medium text-rose-400 hover:text-white hover:bg-rose-600/20 rounded-xl transition-all duration-200 group focus:outline-none cursor-pointer"
        >
          <LogOut className="mr-3 h-5 w-5 shrink-0 transition-transform group-hover:-translate-x-1" />
          <span>{t('nav.logout')}</span>
        </button>
        <div className="px-3 pt-1 pb-1 flex items-center justify-between text-[11px] text-slate-500">
          <span>{t('nav.version')}</span>
          <span className="font-mono text-[10px] bg-slate-800/90 px-1.5 py-0.5 rounded text-slate-400">v1.0.0</span>
        </div>
      </div>
    </aside>
  );
}
