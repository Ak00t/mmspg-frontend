import { useNavigate, Link } from 'react-router-dom';
import { 
  User, 
  LogOut, 
  ChevronDown, 
  Bell, 
  Search, 
  Check,
  CheckCheck,
  Inbox,
  Loader2,
  Store, 
  ShieldCheck, 
  MapPin, 
  Tags, 
  Server,
  Menu
} from 'lucide-react';
import { useState, useEffect, useRef } from 'react';

const API_BASE_URL = 'http://127.0.0.1:8004';

export interface NotificationItem {
  id: string | number;
  title: string;
  message: string;
  createdAt: string;
  isRead?: boolean;
  read?: boolean;
  status?: string;
}

interface HeaderProps {
  isSidebarOpen?: boolean;
  onToggleSidebar?: () => void;
}

export default function Header({ isSidebarOpen = true, onToggleSidebar }: HeaderProps = {}) {
  const navigate = useNavigate();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);

  // Search States
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isSearchLoading, setIsSearchLoading] = useState(false);
  const [searchResults, setSearchResults] = useState({
    staff: [] as any[],
    merchants: [] as any[],
    branches: [] as any[],
    terminals: [] as any[],
    mcc: [] as any[],
  });

  // Notification States
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [isLoadingNotifications, setIsLoadingNotifications] = useState(false);

  // Dropdown click-outside refs
  const notificationRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLDivElement>(null); 

 const userName = localStorage.getItem('userName') || 'Admin User';
  const userRole = localStorage.getItem('userRole') || 'ADMIN';
  
  // 🔴 'null' သို့မဟုတ် 'undefined' စာသားများ ဝင်နေပါက အလွတ် (null) အဖြစ်သာ သတ်မှတ်မည်
  const getValidAvatar = () => {
    const avatar = localStorage.getItem('userAvatar');
    return (avatar && avatar !== 'null' && avatar !== 'undefined') ? avatar : null;
  };
  
  const [avatarUrl, setAvatarUrl] = useState<string | null>(getValidAvatar());

  useEffect(() => {
    const handleAvatarUpdate = () => {
      setAvatarUrl(getValidAvatar());
    };
    window.addEventListener('avatarUpdated', handleAvatarUpdate);
    return () => window.removeEventListener('avatarUpdated', handleAvatarUpdate);
  }, []);


  // ----------------------------------------------------------------------
  // 1. Live Search Logic (Debounced)
  // ----------------------------------------------------------------------
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults({ staff: [], merchants: [], branches: [], mcc: [], terminals: [] });
      setIsSearchOpen(false);
      return;
    }

    const delaySearch = setTimeout(async () => {
      setIsSearchLoading(true);
      setIsSearchOpen(true);
      const token = localStorage.getItem('token');
      const q = searchQuery.toLowerCase().trim();

      try {
        const headers = { 'Authorization': `Bearer ${token}` };
        const [staffRes, merchantsRes, branchesRes, mccRes, terminalsRes] = await Promise.all([
          fetch(`${API_BASE_URL}/api/v1/admin/staff-users`, { headers }).catch(() => null),
          fetch(`${API_BASE_URL}/api/v1/admin/merchants`, { headers }).catch(() => null),
          fetch(`${API_BASE_URL}/api/v1/admin/branches`, { headers }).catch(() => null),
          fetch(`${API_BASE_URL}/api/v1/admin/mcc`, { headers }).catch(() => null),
          fetch(`${API_BASE_URL}/api/v1/admin/terminals`, { headers }).catch(() => null),
        ]);

        const getArray = async (res: any) => res?.ok ? Array.isArray(await res.clone().json()) ? await res.json() : (await res.json()).content || (await res.json()).data || [] : [];

        const staffData = await getArray(staffRes);
        const merchantData = await getArray(merchantsRes);
        const branchData = await getArray(branchesRes);
        const mccData = await getArray(mccRes);
        const terminalData = await getArray(terminalsRes);

        const safeMatch = (val: any) => {
          if (!val) return false;
          return val.toString().toLowerCase().includes(q);
        };

        setSearchResults({
          staff: staffData.filter((u: any) => 
            safeMatch(u.name) || 
            safeMatch(u.fullName) || 
            safeMatch(u.email)
          ),
          merchants: merchantData.filter((m: any) => 
            safeMatch(m.merchantName) || 
            safeMatch(m.regNumber) ||
            safeMatch(m.regDate)
          ),
          branches: branchData.filter((b: any) => 
            safeMatch(b.branchCode) || 
            safeMatch(b.branchName) ||
            safeMatch(b.merchantName) ||
            safeMatch(b.city) ||
            safeMatch(b.phone)
          ),
          mcc: mccData.filter((m: any) => 
            safeMatch(m.mccCode) || 
            safeMatch(m.mccName) ||
            safeMatch(m.description)
          ),
          terminals: terminalData.filter((t: any) => 
            safeMatch(t.terminalId) || 
            safeMatch(t.terminalCode) || 
            safeMatch(t.terminalName) ||
            safeMatch(t.terminalType) ||
            safeMatch(t.merchantName) ||
            safeMatch(t.branchName)
          ),
        });

      } catch (error) {
        console.error('Search error:', error);
      } finally {
        setIsSearchLoading(false);
      }
    }, 500);

    return () => clearTimeout(delaySearch);
  }, [searchQuery]);

  // ----------------------------------------------------------------------
  // 2. Fetch Notifications & Actions
  // ----------------------------------------------------------------------
  const fetchNotifications = async (isPolling = false) => {
    const token = localStorage.getItem('token');
    if (!token) return;
    
    if (!isPolling) setIsLoadingNotifications(true); 

    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/notifications`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        const items = Array.isArray(data) ? data : (data.content || data.data || data.notifications || []);
        setNotifications(items);
      }
    } catch (err) {
      console.error('Failed to load notifications:', err);
    } finally {
      if (!isPolling) setIsLoadingNotifications(false);
    }
  };

  useEffect(() => {
    fetchNotifications(); 
    const pollInterval = setInterval(() => fetchNotifications(true), 30000);
    return () => clearInterval(pollInterval);
  }, []);

  useEffect(() => {
    const handleRefresh = () => fetchNotifications(true);
    window.addEventListener('refreshNotifications', handleRefresh);
    return () => window.removeEventListener('refreshNotifications', handleRefresh);
  }, []);

  const checkIsRead = (item: NotificationItem) => item.isRead || item.read || item.status === 'READ';

  const handleMarkAsRead = async (id: string | number, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const token = localStorage.getItem('token');
    if (!token) return;

    setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true, read: true, status: 'READ' } : n));

    try {
      await fetch(`${API_BASE_URL}/api/v1/notifications/${id}/read`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      });
    } catch (err) {
      console.error('Error marking as read:', err);
    }
  };

  const handleMarkAllAsRead = async () => {
    const unreadItems = notifications.filter(n => !checkIsRead(n));
    if (unreadItems.length === 0) return;

    setNotifications(prev => prev.map(n => ({ ...n, isRead: true, read: true, status: 'READ' })));

    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      await Promise.all(
        unreadItems.map(item =>
          fetch(`${API_BASE_URL}/api/v1/notifications/${item.id}/read`, {
            method: 'PUT',
            headers: { 'Authorization': `Bearer ${token}` }
          })
        )
      );
    } catch (err) {
      console.error('Error marking all as read:', err);
    }
  };

  // ----------------------------------------------------------------------
  // 3. Document Listeners & Helpers
  // ----------------------------------------------------------------------
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setIsNotificationOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsSearchOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  const unreadCount = notifications.filter(n => !checkIsRead(n)).length;
  const totalResults = searchResults.staff.length + searchResults.merchants.length + searchResults.branches.length + searchResults.terminals.length + searchResults.mcc.length;

  return (
    <header className="bg-white border-b border-slate-200 h-16 flex items-center justify-between px-6 shadow-sm z-[100] relative">
      <div className="flex items-center flex-1">
        {onToggleSidebar && (
          <button
            type="button"
            onClick={onToggleSidebar}
            className="mr-3 p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors focus:outline-none"
            title={isSidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
            aria-label="Toggle sidebar"
          >
            <Menu className="h-5 w-5" />
          </button>
        )}
        <h2 className="text-xl font-semibold text-slate-800 hidden sm:block">
          {userRole === 'MERCHANT' ? 'Merchant Portal' : userRole === 'SUPPORT' ? 'Support Portal' : 'Admin Portal'}
        </h2>
        
        {/* ========================================== */}
        {/* Search Bar with Dropdown                   */}
        {/* ========================================== */}
        <div className="ml-8 relative hidden lg:block max-w-md w-full" ref={searchRef}>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-slate-400" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => searchQuery.trim() && setIsSearchOpen(true)}
              className="block w-full pl-10 pr-10 py-2 border border-slate-200 rounded-lg leading-5 bg-slate-50 placeholder-slate-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent sm:text-sm transition-colors"
              placeholder="Search merchants, branches, terminals..."
            />
            {isSearchLoading && (
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
              </div>
            )}
          </div>

          {/* Search Dropdown Results */}
          {isSearchOpen && (
            <div className="absolute top-full left-0 mt-2 w-full max-h-[400px] overflow-y-auto bg-white rounded-xl shadow-2xl border border-slate-200 z-50">
              {isSearchLoading ? (
                <div className="p-4 text-center text-sm text-slate-500">Searching...</div>
              ) : totalResults === 0 ? (
                <div className="p-4 text-center text-sm text-slate-500">No results found for "{searchQuery}"</div>
              ) : (
                <div className="py-2">
                  {/* Merchants */}
                  {searchResults.merchants.length > 0 && (
                    <div className="px-3 pb-2">
                      <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 px-2">Merchants</div>
                      {searchResults.merchants.map((m: any) => (
                        <Link key={m.id || m.regNumber} to="/admin/merchant-approvals" onClick={() => setIsSearchOpen(false)} className="flex items-center gap-3 p-2 hover:bg-slate-50 rounded-lg">
                          <Store className="h-4 w-4 text-emerald-500" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-slate-800 truncate">{m.merchantName}</p>
                            <p className="text-xs text-slate-500 truncate">Reg: {m.regNumber} • {new Date(m.regDate).toLocaleDateString()}</p>
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}

                  {/* Branches */}
                  {searchResults.branches.length > 0 && (
                    <div className="px-3 pb-2 border-t border-slate-100 pt-2">
                      <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 px-2">Branches</div>
                      {searchResults.branches.map((b: any) => (
                        <Link key={b.branchId || b.branchCode} to="/admin/branches" onClick={() => setIsSearchOpen(false)} className="flex items-center gap-3 p-2 hover:bg-slate-50 rounded-lg">
                          <MapPin className="h-4 w-4 text-amber-500" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-slate-800 truncate">{b.branchName} ({b.branchCode})</p>
                            <p className="text-xs text-slate-500 truncate">{b.merchantName} • {b.city}</p>
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}

                  {/* Terminals */}
                  {searchResults.terminals.length > 0 && (
                    <div className="px-3 pb-2 border-t border-slate-100 pt-2">
                      <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 px-2">Terminals</div>
                      {searchResults.terminals.map((t: any) => (
                        <Link key={t.terminalId || t.terminalCode} to="/admin/terminals" onClick={() => setIsSearchOpen(false)} className="flex items-center gap-3 p-2 hover:bg-slate-50 rounded-lg">
                          <Server className="h-4 w-4 text-blue-500" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-slate-800 truncate">{t.terminalName} ({t.terminalCode})</p>
                            <p className="text-xs text-slate-500 truncate">{t.merchantName} • {t.terminalType}</p>
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}

                  {/* MCC */}
                  {searchResults.mcc.length > 0 && (
                    <div className="px-3 pb-2 border-t border-slate-100 pt-2">
                      <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 px-2">MCC</div>
                      {searchResults.mcc.map((m: any) => (
                        <Link key={m.id || m.mccCode} to="/admin/mcc-configuration" onClick={() => setIsSearchOpen(false)} className="flex items-center gap-3 p-2 hover:bg-slate-50 rounded-lg">
                          <Tags className="h-4 w-4 text-purple-500" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-slate-800 truncate">{m.mccCode} - {m.mccName}</p>
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}

                  {/* Staff */}
                  {searchResults.staff.length > 0 && (
                    <div className="px-3 pb-2 border-t border-slate-100 pt-2">
                      <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 px-2">Staff</div>
                      {searchResults.staff.map((s: any) => (
                        <Link key={s.id} to="/admin/staff-users" onClick={() => setIsSearchOpen(false)} className="flex items-center gap-3 p-2 hover:bg-slate-50 rounded-lg">
                          <ShieldCheck className="h-4 w-4 text-slate-500" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-slate-800 truncate">{s.name || s.fullName}</p>
                            <p className="text-xs text-slate-500 truncate">{s.email}</p>
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}

                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center space-x-4">
        {/* ========================================== */}
        {/* Notification Bell                          */}
        {/* ========================================== */}
        <div className="relative" ref={notificationRef}>
          <button 
            type="button"
            onClick={() => {
              setIsNotificationOpen(!isNotificationOpen);
              setIsProfileOpen(false);
              setIsSearchOpen(false);
            }}
            className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-colors relative"
          >
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-bold text-white bg-red-500 rounded-full animate-pulse">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {isNotificationOpen && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-xl shadow-xl border border-slate-200 ring-1 ring-black/5 origin-top-right transition-all z-50 overflow-hidden">
              <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
                <div className="flex items-center space-x-2">
                  <span className="font-semibold text-slate-800 text-sm">Notifications</span>
                  {unreadCount > 0 && (
                    <span className="bg-blue-100 text-blue-700 text-xs px-2 py-0.5 rounded-full font-medium">
                      {unreadCount} new
                    </span>
                  )}
                </div>
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllAsRead}
                    className="text-xs text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1 transition-colors"
                  >
                    <CheckCheck className="h-3.5 w-3.5" />
                    Mark all read
                  </button>
                )}
              </div>

              <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                {isLoadingNotifications ? (
                  <div className="py-10 flex flex-col items-center justify-center text-slate-400">
                    <Loader2 className="h-6 w-6 animate-spin text-blue-500 mb-2" />
                    <span className="text-xs">Loading notifications...</span>
                  </div>
                ) : notifications.length === 0 ? (
                  <div className="py-10 flex flex-col items-center justify-center text-center px-4">
                    <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center mb-2 text-slate-400">
                      <Inbox className="h-5 w-5" />
                    </div>
                    <p className="text-sm font-medium text-slate-700">No new notifications</p>
                    <p className="text-xs text-slate-400 mt-1">You are all caught up!</p>
                  </div>
                ) : (
                  notifications.map((item) => {
                    const isRead = checkIsRead(item);
                    return (
                      <div
                        key={item.id}
                        onClick={(e) => !isRead && handleMarkAsRead(item.id, e)}
                        className={`p-3.5 transition-colors cursor-pointer flex items-start gap-3 ${
                          isRead ? 'bg-white hover:bg-slate-50' : 'bg-blue-50/40 hover:bg-blue-50/70'
                        }`}
                      >
                        <div className="pt-1.5 flex-shrink-0">
                          <span className={`block h-2 w-2 rounded-full ${isRead ? 'bg-transparent' : 'bg-blue-600'}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-1">
                            <p className={`text-xs ${isRead ? 'font-medium text-slate-700' : 'font-semibold text-slate-900'} truncate`}>
                              {item.title}
                            </p>
                            <span className="text-[10px] text-slate-400 whitespace-nowrap">
                              {new Date(item.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                          <p className="text-xs text-slate-600 mt-0.5 line-clamp-2 leading-relaxed">
                            {item.message}
                          </p>
                        </div>
                        {!isRead && (
                          <button
                            title="Mark as read"
                            onClick={(e) => handleMarkAsRead(item.id, e)}
                            className="text-slate-400 hover:text-blue-600 p-1 hover:bg-white rounded transition-colors"
                          >
                            <Check className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>
        
        <div className="h-6 w-px bg-slate-200 mx-2"></div>

        {/* ========================================== */}
        {/* User Profile                               */}
        {/* ========================================== */}
        <div className="relative" ref={profileRef}>
          <button 
            onClick={() => {
              setIsProfileOpen(!isProfileOpen);
              setIsNotificationOpen(false);
              setIsSearchOpen(false);
            }}
            className="flex items-center space-x-3 rounded-lg p-1 hover:bg-slate-50"
          >
            <div className="h-9 w-9 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 overflow-hidden">
              {avatarUrl ? (
                // 🔴 Backend URL (API_BASE_URL) ကို ရှေ့ကနေ ပေါင်းထည့်ပေးလိုက်ပါသည်
                <img 
                  src={avatarUrl.startsWith('http') ? avatarUrl : `${API_BASE_URL}${avatarUrl}`} 
                  alt="Avatar" 
                  className="h-full w-full object-cover" 
                  onError={(e) => { e.currentTarget.style.display = 'none'; }} 
                />
              ) : (
                <User className="h-5 w-5" />
              )}
            </div>
            <div className="hidden md:flex flex-col text-left">
              <span className="text-sm font-medium text-slate-700 leading-none">{userName}</span>
              <span className="text-xs text-slate-500 mt-1 leading-none">{userRole}</span>
            </div>
            <ChevronDown className="h-4 w-4 text-slate-400" />
          </button>
          
          {isProfileOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg py-1 border border-slate-200 z-50">
              {/* 🔴 onClick ကို ထပ်ပေါင်းထည့်လိုက်ပါသည် */}
             {/* 🔴 Link အစား button ပြောင်းသုံးပြီး ရောက်ပြီးသားဖြစ်နေပါက Refresh လုပ်ရန် ထပ်တိုးထားသည် */}
              <button 
                onClick={() => {
                  setIsProfileOpen(false);
                  // 🔴 '/admin/profile' သို့ သွားရန် ညွှန်ကြားခြင်း
                  if (window.location.pathname === '/admin/profile') {
                    window.location.reload(); 
                  } else {
                    navigate('/admin/profile'); 
                  }
                }}
                className="flex items-center w-full px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 text-left transition-colors"
              >
                <User className="mr-2 h-4 w-4" /> Profile
              </button>
              <button 
                onClick={handleLogout} 
                className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50"
              >
                <LogOut className="mr-2 h-4 w-4" /> Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}