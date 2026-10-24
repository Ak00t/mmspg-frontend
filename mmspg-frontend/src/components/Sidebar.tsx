import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  Building2, 
  Settings, 
  CreditCard, 
  UserCog,
  FileSpreadsheet,
  PanelLeftClose
} from 'lucide-react';

interface SidebarProps {
  isOpen?: boolean;
  onToggle?: () => void;
}

export default function Sidebar({ isOpen = true, onToggle }: SidebarProps) {
  // LocalStorage မှ လက်ရှိ User ၏ Role ကို ယူမည်
  const userRole = localStorage.getItem('userRole') || 'ADMIN';
  
  // Role ပေါ်မူတည်၍ လမ်းကြောင်းအစ (Base Path) ကို ခွဲခြားမည်
  const basePath = userRole === 'SUPPORT' ? '/support' : '/admin';

  let sidebarLinks: { to: string; icon: any; label: string }[] = [];

  if (userRole === 'MERCHANT') {
    sidebarLinks = [
      { to: '/merchant/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
      { to: '/merchant/reports', icon: FileSpreadsheet, label: 'Reports Export' }
    ];
  } else {
    sidebarLinks = [
      { to: `${basePath}/dashboard`, icon: LayoutDashboard, label: 'Dashboard' },
      { to: `${basePath}/merchant-approvals`, icon: Users, label: 'Merchant Approvals' },
      { to: `${basePath}/branches`, icon: Building2, label: 'Branch Management' }
    ];

    if (userRole === 'ADMIN') {
      sidebarLinks.push(
        { to: `${basePath}/mcc-configuration`, icon: Settings, label: 'Mcc Management' },
        { to: `${basePath}/terminals`, icon: CreditCard, label: 'Admin Terminals' },
        { to: `${basePath}/staff-users`, icon: UserCog, label: 'Staff Users' }
      );
    }
  }

  return (
    <aside
      className={`fixed inset-y-0 left-0 z-40 md:static bg-slate-900 text-white min-h-screen flex flex-col transition-all duration-300 shadow-xl shrink-0 ${
        isOpen
          ? 'w-64 translate-x-0 opacity-100'
          : 'w-0 -translate-x-full md:w-0 md:translate-x-0 overflow-hidden opacity-0 pointer-events-none'
      }`}
    >
      <div className="p-6 border-b border-slate-800 flex items-center justify-between">
        <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-indigo-500 bg-clip-text text-transparent whitespace-nowrap">
          PayGateway
        </h1>
        {onToggle && (
          <button
            type="button"
            onClick={onToggle}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition focus:outline-none"
            title="Collapse sidebar"
            aria-label="Collapse sidebar"
          >
            <PanelLeftClose className="h-5 w-5" />
          </button>
        )}
      </div>

      <nav className="flex-1 py-6 px-3 space-y-1 overflow-y-auto">
        <div className="px-3 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
          {userRole === 'MERCHANT' ? 'Merchant Portal' : 'Administration'}
        </div>
        
        {sidebarLinks.map((link) => {
          const Icon = link.icon;
          return (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                `flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors whitespace-nowrap ${
                  isActive 
                    ? 'bg-blue-600 text-white shadow-md' 
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`
              }
            >
              <Icon className="mr-3 h-5 w-5 shrink-0" />
              <span>{link.label}</span>
            </NavLink>
          );
        })}
      </nav>

      <div className="p-4 border-t border-slate-800">
        <div className="flex items-center px-4 py-2 text-xs font-medium text-slate-400 rounded-lg">
          <span>v1.0.0 · {userRole}</span>
        </div>
      </div>
    </aside>
  );
}