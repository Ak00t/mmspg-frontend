import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  Building2, 
  Settings, 
  CreditCard, 
  UserCog 
} from 'lucide-react';

export default function Sidebar() {
  const adminLinks = [
    { to: '/admin/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/admin/merchant-approvals', icon: Users, label: 'Merchant Approvals' },
    { to: '/admin/branches', icon: Building2, label: 'Branch Management' },
    { to: '/admin/mcc-configuration', icon: Settings, label: 'Fee Management' },
    { to: '/admin/terminals', icon: CreditCard, label: 'Admin Terminals' },
    { to: '/admin/staff-users', icon: UserCog, label: 'Staff Users' },
  ];

  return (
    <aside className="w-64 bg-slate-900 text-white min-h-screen flex flex-col transition-all duration-300 shadow-xl z-20">
      <div className="p-6 border-b border-slate-800">
        <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-indigo-500 bg-clip-text text-transparent">PayGateway</h1>
      </div>
      <nav className="flex-1 py-6 px-3 space-y-1">
        <div className="px-3 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
          Administration
        </div>
        {adminLinks.map((link) => {
          const Icon = link.icon;
          return (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                `flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                  isActive 
                    ? 'bg-blue-600 text-white shadow-md' 
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`
              }
            >
              <Icon className="mr-3 h-5 w-5" />
              {link.label}
            </NavLink>
          );
        })}
      </nav>
      <div className="p-4 border-t border-slate-800">
        <div className="flex items-center px-4 py-3 text-sm font-medium text-slate-400 rounded-lg">
          <span>v1.0.0</span>
        </div>
      </div>
    </aside>
  );
}
