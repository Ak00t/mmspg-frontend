import { useNavigate } from 'react-router-dom';
import { User, LogOut, ChevronDown, Bell, Search } from 'lucide-react';
import { useState } from 'react';

export default function Header() {
  const navigate = useNavigate();
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  // 🔴 LocalStorage မှ Login ဝင်ထားသူ၏ အမည်နှင့် Role ကို ဆွဲထုတ်ပါမည်
  const userName = localStorage.getItem('userName') || 'Admin User';
  const userRole = localStorage.getItem('userRole') || 'ADMIN';

  const handleLogout = () => {
    // 🔴 ၁။ ထွက်ခွာသည့်အခါ Token နှင့် Data များအားလုံးကို ရှင်းလင်းမည်
    localStorage.removeItem('token');
    localStorage.removeItem('userId');
    localStorage.removeItem('userName');
    localStorage.removeItem('userRole');
    
    // 🔴 ၂။ Login စာမျက်နှာသို့ ပြန်ပို့မည်
    navigate('/login');
  };

  return (
    <header className="bg-white border-b border-slate-200 h-16 flex items-center justify-between px-6 shadow-sm z-10">
      <div className="flex items-center flex-1">
        <h2 className="text-xl font-semibold text-slate-800 hidden md:block">Admin Portal</h2>
        
        {/* Search bar placeholder */}
        <div className="ml-8 relative hidden lg:block max-w-md w-full">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-slate-400" />
          </div>
          <input
            type="text"
            className="block w-full pl-10 pr-3 py-2 border border-slate-200 rounded-lg leading-5 bg-slate-50 placeholder-slate-400 focus:outline-none focus:bg-white focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-colors"
            placeholder="Search merchants, branches, terminals..."
          />
        </div>
      </div>

      <div className="flex items-center space-x-4">
        <button className="p-2 text-slate-400 hover:text-slate-600 transition-colors relative">
          <Bell className="h-5 w-5" />
          <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-red-500 border border-white"></span>
        </button>
        
        <div className="h-6 w-px bg-slate-200 mx-2"></div>

        <div className="relative">
          <button 
            onClick={() => setIsProfileOpen(!isProfileOpen)}
            onBlur={() => setTimeout(() => setIsProfileOpen(false), 200)}
            className="flex items-center space-x-3 focus:outline-none rounded-lg p-1 hover:bg-slate-50 transition-colors"
          >
            <div className="h-9 w-9 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 border border-blue-200">
              {/* အမည်၏ ပထမဆုံး စာလုံးကို ယူ၍ Icon အဖြစ်ပြမည် */}
              <span className="font-bold">{userName.charAt(0).toUpperCase()}</span>
            </div>
            <div className="hidden md:flex items-center text-left">
              <div className="flex flex-col">
                {/* 🔴 ပုံသေအမည်အစား Data အစစ်ကို ပြသမည် */}
                <span className="text-sm font-medium text-slate-700 leading-none mb-1">{userName}</span>
                <span className="text-xs text-slate-500 leading-none">{userRole}</span>
              </div>
              <ChevronDown className="ml-2 h-4 w-4 text-slate-400" />
            </div>
          </button>
          
          {isProfileOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg py-1 border border-slate-200 ring-1 ring-black ring-opacity-5 origin-top-right transition-all">
              <div className="px-4 py-3 border-b border-slate-100 md:hidden">
                <p className="text-sm font-medium text-slate-900">{userName}</p>
                <p className="text-xs font-medium text-slate-500 truncate">{userRole} Account</p>
              </div>
              <button
                // 🔴 onClick အစား onMouseDown ဟု ပြောင်းပေးပါ
                onMouseDown={handleLogout} 
                className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
              >
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}