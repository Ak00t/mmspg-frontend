import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  User,
  LogOut,
  ChevronDown,
  Bell,
  BellOff,
  Search,
  Check,
  CheckCheck,
  Loader2,
  Inbox,
  X,
  Trash2,
  Menu
} from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import {
  getNotifications,
  markNotificationAsRead,
  getStaffProfile
} from '../services/adminManagementApi';
import { api } from '../services/api';

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
  onToggleSidebar?: () => void;
  isSidebarOpen?: boolean;
}

export default function Header({ onToggleSidebar, isSidebarOpen = true }: HeaderProps) {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);

  const [notificationsEnabled, setNotificationsEnabled] = useState<boolean>(() => {
    const stored = localStorage.getItem('notificationsEnabled');
    return stored === null ? true : stored === 'true';
  });

  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [isLoadingNotifications, setIsLoadingNotifications] = useState(false);

  const notificationRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  const [userName, setUserName] = useState<string>(() => localStorage.getItem('userName') || 'Admin User');
  const [userRole, setUserRole] = useState<string>(() => localStorage.getItem('userRole') || 'ADMIN');
  const [avatar, setAvatar] = useState<string | null>(
    () => localStorage.getItem('adminProfileImage') || localStorage.getItem('userAvatar')
  );

  // ── Avatar sync ────────────────────────────────────────────────────────
  useEffect(() => {
    const sync = () => {
      const stored = localStorage.getItem('adminProfileImage') || localStorage.getItem('userAvatar');
      setAvatar(stored);
    };
    window.addEventListener('profileUpdated', sync);
    window.addEventListener('avatarUpdated', sync);
    return () => {
      window.removeEventListener('profileUpdated', sync);
      window.removeEventListener('avatarUpdated', sync);
    };
  }, []);

  // ── Fetch notifications ────────────────────────────────────────────────
  const fetchNotifications = async () => {
    if (localStorage.getItem('notificationsEnabled') === 'false') {
      setNotifications([]);
      return;
    }
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
      const data = await getNotifications();
      const rawItems: any[] = Array.isArray(data)
        ? data
        : (data.content || data.data || data.notifications || []);

      // 1. Individually dismissed items
      const dismissed = JSON.parse(localStorage.getItem('dismissedNotifications') || '[]');
      const dismissedSet = new Set(dismissed.map(String));

      // 2. Individual Category Settings toggles from localStorage
      const notifMerchant = localStorage.getItem('notif_merchant') !== 'false';
      const notifBranch   = localStorage.getItem('notif_branch') !== 'false';
      const notifSecurity = localStorage.getItem('notif_security') !== 'false';

      const filtered = rawItems.filter(item => {
        // If closed via X button
        if (dismissedSet.has(String(item.id))) return false;

        const itemType = (item.type || '').toUpperCase();
        const itemText = ((item.title || '') + ' ' + (item.message || '')).toLowerCase();

        // Merchant alerts category toggle
        if (!notifMerchant && (itemType === 'MERCHANT' || itemText.includes('merchant'))) {
          return false;
        }
        // Branch & Terminal alerts category toggle
        if (!notifBranch && (itemType === 'BRANCH' || itemType === 'TERMINAL' || itemText.includes('branch') || itemText.includes('terminal'))) {
          return false;
        }
        // System & Security alerts category toggle
        if (!notifSecurity && (itemType === 'SECURITY' || itemText.includes('security') || itemText.includes('password') || itemText.includes('login'))) {
          return false;
        }

        return true;
      });

      setNotifications(filtered);
    } catch (err) {
      console.error('Failed to load notifications:', err);
    } finally {
      setIsLoadingNotifications(false);
    }
  };

  const handleDismissNotification = async (id: string | number, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();

    setNotifications(prev => prev.filter(n => String(n.id) !== String(id)));

    const dismissed = JSON.parse(localStorage.getItem('dismissedNotifications') || '[]');
    if (!dismissed.includes(String(id))) {
      dismissed.push(String(id));
      localStorage.setItem('dismissedNotifications', JSON.stringify(dismissed));
    }

    try {
      await api.delete(`/api/v1/notifications/${id}`);
    } catch { /* ignore */ }
  };

  const handleClearAllNotifications = async (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();

    const currentIds = notifications.map(n => String(n.id));
    setNotifications([]);

    const dismissed = JSON.parse(localStorage.getItem('dismissedNotifications') || '[]');
    currentIds.forEach(id => {
      if (!dismissed.includes(id)) dismissed.push(id);
    });
    localStorage.setItem('dismissedNotifications', JSON.stringify(dismissed));

    try {
      await api.delete('/api/v1/notifications/clear-all');
    } catch { /* ignore */ }
  };

  // ── Polling — only when enabled ────────────────────────────────────────
  useEffect(() => {
    if (!notificationsEnabled) {
      setNotifications([]);
      setIsNotificationOpen(false);
      return;
    }
    setIsLoadingNotifications(true);
    fetchNotifications().finally(() => setIsLoadingNotifications(false));
    const poll = setInterval(fetchNotifications, 30000);
    return () => clearInterval(poll);
  }, [notificationsEnabled]);

  // ── Sync from Settings (same-tab custom event + cross-tab storage) ─────
  useEffect(() => {
    const sync = () => {
      const stored = localStorage.getItem('notificationsEnabled');
      const isEnabled = stored === null ? true : stored === 'true';
      setNotificationsEnabled(isEnabled);
      if (!isEnabled) {
        setNotifications([]);
        setIsNotificationOpen(false);
      } else {
        fetchNotifications();
      }
    };
    window.addEventListener('storage', sync);
    window.addEventListener('settingsChanged', sync);
    return () => {
      window.removeEventListener('storage', sync);
      window.removeEventListener('settingsChanged', sync);
    };
  }, []);

  // ── Click outside to close dropdowns ──────────────────────────────────
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (notificationRef.current && !notificationRef.current.contains(e.target as Node))
        setIsNotificationOpen(false);
      if (profileRef.current && !profileRef.current.contains(e.target as Node))
        setIsProfileOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // ── Profile fetch ──────────────────────────────────────────────────────
  const convertUrlToBase64AndSave = async (imageUrl: string) => {
    if (!imageUrl || imageUrl.startsWith('data:')) return;
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(imageUrl, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
      if (res.ok) {
        const blob = await res.blob();
        const reader = new FileReader();
        reader.onloadend = () => {
          const b64 = reader.result as string;
          if (b64?.startsWith('data:')) {
            localStorage.setItem('adminProfileImage', b64);
            localStorage.setItem('userAvatar', b64);
            setAvatar(b64);
          }
        };
        reader.readAsDataURL(blob);
      }
    } catch { /* ignore */ }
  };

  const fetchUserProfile = async () => {
    try {
      const data = await getStaffProfile();
      if (data) {
        if (data?.fullName) { localStorage.setItem('userName', data.fullName); setUserName(data.fullName); }
        if (data?.role) { localStorage.setItem('userRole', data.role); setUserRole(data.role); }
        const local = localStorage.getItem('adminProfileImage') || localStorage.getItem('userAvatar');
        if (data?.profileImageUrl?.trim()) {
          const apiBase = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8004';
          const url = data.profileImageUrl.startsWith('http') || data.profileImageUrl.startsWith('data:')
            ? data.profileImageUrl
            : `${apiBase}${data.profileImageUrl.startsWith('/') ? '' : '/'}${data.profileImageUrl}`;
          if (local?.startsWith('data:')) {
            setAvatar(local);
          } else {
            localStorage.setItem('adminProfileImage', url);
            localStorage.setItem('userAvatar', url);
            setAvatar(url);
            convertUrlToBase64AndSave(url);
          }
        } else if (local) {
          setAvatar(local);
          if (!local.startsWith('data:') && local.startsWith('http')) convertUrlToBase64AndSave(local);
        }
      }
    } catch (err) {
      console.error('Profile fetch failed:', err);
      const fb = localStorage.getItem('adminProfileImage') || localStorage.getItem('userAvatar');
      if (fb) setAvatar(fb);
    }
  };

  useEffect(() => {
    const syncProfile = () => {
      const a = localStorage.getItem('adminProfileImage') || localStorage.getItem('userAvatar');
      if (a) setAvatar(a);
      const n = localStorage.getItem('userName'); if (n) setUserName(n);
      const r = localStorage.getItem('userRole'); if (r) setUserRole(r);
      fetchUserProfile();
    };
    const syncNotif = () => {
      if (localStorage.getItem('notificationsEnabled') !== 'false') {
        fetchNotifications();
      }
    };
    window.addEventListener('profileUpdated', syncProfile);
    window.addEventListener('avatarUpdated', syncProfile);
    window.addEventListener('refreshNotifications', syncNotif);
    fetchUserProfile();
    return () => {
      window.removeEventListener('profileUpdated', syncProfile);
      window.removeEventListener('avatarUpdated', syncProfile);
      window.removeEventListener('refreshNotifications', syncNotif);
    };
  }, []);

  // ----------------------------------------------------------------------
  // Notification Action Handlers
  // ----------------------------------------------------------------------
  const checkIsRead = (item: NotificationItem): boolean => {
    if (typeof item.isRead === 'boolean') return item.isRead;
    if (typeof item.read === 'boolean') return item.read;
    if (item.status) return item.status === 'READ';
    return false;
  };

  const handleMarkAsRead = async (id: string | number, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();

    // Optimistic UI update
    setNotifications(prev =>
      prev.map(n =>
        n.id === id ? { ...n, isRead: true, read: true, status: 'READ' } : n
      )
    );

    try {
      await markNotificationAsRead(id);
    } catch (err) {
      console.error(`Failed to mark notification ${id} as read:`, err);
    }
  };

  const handleMarkAllAsRead = async () => {
    const unreadItems = notifications.filter(n => !checkIsRead(n));
    if (unreadItems.length === 0) return;

    // Optimistically mark all as read locally
    setNotifications(prev =>
      prev.map(n => ({ ...n, isRead: true, read: true, status: 'READ' }))
    );

    try {
      await Promise.all(unreadItems.map(item => markNotificationAsRead(item.id)));
    } catch (err) {
      console.error('Failed to mark all notifications as read:', err);
    }
  };

  const handleLogout = () => {
    ['token', 'mmspg_token', 'userId', 'merchantId', 'mmspg_merchant_id', 'userName', 'userRole', 'userAvatar', 'adminProfileImage']
      .forEach(k => localStorage.removeItem(k));
    navigate('/login');
  };

  const unreadCount = notifications.filter(n => !checkIsRead(n)).length;

  const formatTimeAgo = (dateString?: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
    if (seconds < 60) return 'Just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return days < 7 ? `${days}d ago` : date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  };

  const portalTitle =
    userRole === 'MERCHANT' ? t('header.merchantPortal') :
      userRole === 'SUPPORT' ? t('header.supportPortal') :
        userRole === 'AUDITOR' ? t('header.auditorPortal') :
          t('header.adminPortal');

  return (
    <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 h-16 flex items-center justify-between px-6 shadow-sm z-10 transition-colors duration-200">
      {/* Left: Sidebar Toggle + Title + Search */}
      <div className="flex items-center flex-1">
        {onToggleSidebar && (
          <button
            type="button"
            onClick={onToggleSidebar}
            className="mr-3 p-2 rounded-lg text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors focus:outline-none"
            title={isSidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
            aria-label="Toggle Sidebar"
          >
            <Menu className="h-5 w-5" />
          </button>
        )}
        <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-100 hidden md:block">
          {portalTitle}
        </h2>
        <div className="ml-8 relative hidden lg:block max-w-md w-full">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-slate-400" />
          </div>
          <input
            type="text"
            className="block w-full pl-10 pr-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500 sm:text-sm transition-colors"
            placeholder={t('header.searchPlaceholder')}
          />
        </div>
      </div>

      {/* Right: Bell + Divider + Avatar */}
      <div className="flex items-center space-x-4">

        {/* ─── Notification Bell ─── */}
        <div className="relative" ref={notificationRef}>
          <button
            type="button"
            onClick={() => {
              if (!notificationsEnabled) return;
              setIsNotificationOpen(v => !v);
              setIsProfileOpen(false);
            }}
            className={`p-2 rounded-full transition-colors relative focus:outline-none ${notificationsEnabled
                ? 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-700'
                : 'text-slate-300 dark:text-slate-600 cursor-not-allowed'
              }`}
            title={notificationsEnabled ? t('notifications.title') : t('notifications.disabled')}
          >
            {notificationsEnabled ? <Bell className="h-5 w-5" /> : <BellOff className="h-5 w-5" />}
            {notificationsEnabled && unreadCount > 0 && (
              <span className="absolute top-1 right-1 flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-bold text-white bg-red-500 rounded-full border-2 border-white dark:border-slate-900 animate-pulse">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {isNotificationOpen && notificationsEnabled && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 z-50 overflow-hidden">
              {/* Dropdown header */}
              <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between bg-slate-50/70 dark:bg-slate-800/80">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-slate-800 dark:text-slate-100 text-sm">{t('notifications.title')}</span>
                  {unreadCount > 0 && (
                    <span className="bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 text-xs px-2 py-0.5 rounded-full font-medium">
                      {t('notifications.newBadge', { count: unreadCount })}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  {unreadCount > 0 && (
                    <button onClick={handleMarkAllAsRead} className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800 font-medium flex items-center gap-1">
                      <CheckCheck className="h-3.5 w-3.5" />
                      {t('notifications.markAllRead')}
                    </button>
                  )}
                  {notifications.length > 0 && (
                    <button onClick={handleClearAllNotifications} className="text-xs text-slate-400 hover:text-rose-600 font-medium flex items-center gap-1" title="Clear all">
                      <Trash2 className="h-3.5 w-3.5" />
                      {t('common.clear') || 'Clear'}
                    </button>
                  )}
                </div>
              </div>

              {/* List */}
              <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-700">
                {isLoadingNotifications ? (
                  <div className="py-10 flex flex-col items-center text-slate-400">
                    <Loader2 className="h-6 w-6 animate-spin text-blue-500 mb-2" />
                    <span className="text-xs">{t('notifications.loading')}</span>
                  </div>
                ) : notifications.length === 0 ? (
                  <div className="py-10 flex flex-col items-center text-center px-4">
                    <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center mb-2 text-slate-400">
                      <Inbox className="h-5 w-5" />
                    </div>
                    <p className="text-sm font-medium text-slate-700 dark:text-slate-200">{t('notifications.noNotifications')}</p>
                    <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">{t('notifications.allCaughtUp')}</p>
                  </div>
                ) : (
                  notifications.map((item) => {
                    const isRead = checkIsRead(item);
                    return (
                      <div
                        key={item.id}
                        onClick={() => !isRead && handleMarkAsRead(item.id)}
                        className={`p-3.5 cursor-pointer flex items-start gap-3 transition-colors ${isRead
                            ? 'bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700'
                            : 'bg-blue-50/40 dark:bg-blue-900/10 hover:bg-blue-50 dark:hover:bg-blue-900/20'
                          }`}
                      >
                        <div className="pt-1.5 shrink-0">
                          <span className={`block h-2 w-2 rounded-full ${isRead ? 'bg-transparent' : 'bg-blue-600'}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-1">
                            <p className={`text-xs truncate ${isRead ? 'font-medium text-slate-700 dark:text-slate-300' : 'font-semibold text-slate-900 dark:text-slate-100'}`}>
                              {item.title}
                            </p>
                            <span className="text-[10px] text-slate-400 whitespace-nowrap">{formatTimeAgo(item.createdAt)}</span>
                          </div>
                          <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5 line-clamp-2">{item.message}</p>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          {!isRead && (
                            <button
                              title={t('notifications.markAsRead')}
                              onClick={(e) => handleMarkAsRead(item.id, e)}
                              className="text-slate-400 hover:text-blue-600 p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded transition-colors"
                            >
                              <Check className="h-3.5 w-3.5" />
                            </button>
                          )}
                          <button
                            title={t('notifications.dismiss')}
                            onClick={(e) => handleDismissNotification(item.id, e)}
                            className="text-slate-400 hover:text-rose-600 p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded transition-colors"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>

        <div className="h-6 w-px bg-slate-200 dark:bg-slate-700 mx-2" />

        {/* ─── Profile Dropdown ─── */}
        <div className="relative" ref={profileRef}>
          <button
            onClick={() => { setIsProfileOpen(v => !v); setIsNotificationOpen(false); }}
            className="flex items-center space-x-3 focus:outline-none rounded-lg p-1 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          >
            <div className="h-9 w-9 rounded-full bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center text-blue-600 dark:text-blue-300 border border-blue-200 dark:border-blue-800 overflow-hidden">
              {avatar ? (
                <img src={avatar} alt="Profile" className="h-full w-full rounded-full object-cover"
                  onError={() => { if (avatar?.startsWith('http')) convertUrlToBase64AndSave(avatar); setAvatar(null); }} />
              ) : (
                <span className="font-bold text-sm">{userName.charAt(0).toUpperCase()}</span>
              )}
            </div>
            <div className="hidden md:flex items-center text-left">
              <div className="flex flex-col">
                <span className="text-sm font-medium text-slate-700 dark:text-slate-200 leading-none mb-1">{userName}</span>
                <span className="text-xs text-slate-500 dark:text-slate-400 leading-none">{userRole}</span>
              </div>
              <ChevronDown className="ml-2 h-4 w-4 text-slate-400" />
            </div>
            
          </button>

          {isProfileOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-slate-800 rounded-lg shadow-lg py-1 border border-slate-200 dark:border-slate-700 z-50">
              <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-700 md:hidden">
                <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{userName}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{t('profile.account', { role: userRole })}</p>
              </div>
              <button
                onMouseDown={() => {
                  const role = (userRole || localStorage.getItem('userRole') || 'ADMIN').toUpperCase();
                  const base = role === 'SUPPORT' ? '/support' : role === 'AUDITOR' ? '/auditor' : '/admin';
                  navigate(`${base}/profile`);
                  setIsProfileOpen(false);
                  // 🔴 '/admin/profile' သို့ သွားရန် ညွှန်ကြားခြင်း
                  if (window.location.pathname === '/admin/profile') {
                    window.location.reload();
                  } else {
                    navigate('/admin/profile');
                  }
                }}
                className="flex items-center w-full px-4 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
              >
                <User className="mr-2 h-4 w-4" />
                {t('nav.profile')}
              </button>
              <button
                onMouseDown={handleLogout}
                className="flex items-center w-full px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
              >
                <LogOut className="mr-2 h-4 w-4" />
                {t('nav.logout')}
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
