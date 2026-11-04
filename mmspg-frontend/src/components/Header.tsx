import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
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
import { getMerchantProfile } from '../features/main-merchant/api/merchantDashboardApi';
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

export interface HeaderProps {
  isSidebarOpen?: boolean;
  onToggleSidebar?: () => void;
}

export default function Header({ isSidebarOpen = true, onToggleSidebar }: HeaderProps) {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);

  const [notificationsEnabled, setNotificationsEnabled] = useState<boolean>(() => {
    const stored = localStorage.getItem('notificationsEnabled');
    return stored === null ? true : stored === 'true';
  });

  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [isLoadingNotifications, setIsLoadingNotifications] = useState(false);

  const notificationRef = useRef<HTMLDivElement>(null);

  const [userName, setUserName] = useState<string>(() => localStorage.getItem('userName') || 'Portal User');
  const [userRole, setUserRole] = useState<string>(() => (localStorage.getItem('userRole') || 'ADMIN').toUpperCase());
  const [avatar, setAvatar] = useState<string | null>(
    () => localStorage.getItem('adminProfileImage') || localStorage.getItem('userAvatar')
  );

  // ── Avatar sync ────────────────────────────────────────────────────────
  useEffect(() => {
    const sync = () => {
      const stored = localStorage.getItem('adminProfileImage') || localStorage.getItem('userAvatar');
      setAvatar(stored);
      const storedRole = (localStorage.getItem('userRole') || 'ADMIN').toUpperCase();
      setUserRole(storedRole);
      const storedName = localStorage.getItem('userName');
      if (storedName) setUserName(storedName);
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

      const dismissed = JSON.parse(localStorage.getItem('dismissedNotifications') || '[]');
      const dismissedSet = new Set(dismissed.map(String));

      const notifMerchant = localStorage.getItem('notif_merchant') !== 'false';
      const notifBranch   = localStorage.getItem('notif_branch') !== 'false';
      const notifSecurity = localStorage.getItem('notif_security') !== 'false';

      const filtered = rawItems.filter(item => {
        if (dismissedSet.has(String(item.id))) return false;

        const itemType = (item.type || '').toUpperCase();
        const itemText = ((item.title || '') + ' ' + (item.message || '')).toLowerCase();

        if (!notifMerchant && (itemType === 'MERCHANT' || itemText.includes('merchant'))) {
          return false;
        }
        if (!notifBranch && (itemType === 'BRANCH' || itemType === 'TERMINAL' || itemText.includes('branch') || itemText.includes('terminal'))) {
          return false;
        }
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

  // ── Sync from Settings ────────────────────────────────────────────────
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
      if (notificationRef.current && !notificationRef.current.contains(e.target as Node)) {
        setIsNotificationOpen(false);
      }
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
    const role = (localStorage.getItem('userRole') || userRole || 'ADMIN').toUpperCase();
    try {
      if (role === 'MERCHANT') {
        const data = await getMerchantProfile();
        if (data) {
          const name = data.businessName || data.contactName || 'Merchant Portal';
          localStorage.setItem('userName', name);
          setUserName(name);
          setUserRole('MERCHANT');
          const local = localStorage.getItem('adminProfileImage') || localStorage.getItem('userAvatar');
          if (data.profileImageUrl && typeof data.profileImageUrl === 'string' && data.profileImageUrl.trim()) {
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
          }
        }
      } else {
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
      }
    } catch (err) {
      console.error('Profile fetch failed:', err);
      const fb = localStorage.getItem('adminProfileImage') || localStorage.getItem('userAvatar');
      if (fb) setAvatar(fb);
    }
  };

  useEffect(() => {
    fetchUserProfile();
  }, []);

  const checkIsRead = (item: NotificationItem): boolean => {
    if (typeof item.isRead === 'boolean') return item.isRead;
    if (typeof item.read === 'boolean') return item.read;
    if (item.status) return item.status === 'READ';
    return false;
  };

  const handleMarkAsRead = async (id: string | number, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
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

    setNotifications(prev =>
      prev.map(n => ({ ...n, isRead: true, read: true, status: 'READ' }))
    );

    try {
      await Promise.all(unreadItems.map(item => markNotificationAsRead(item.id)));
    } catch (err) {
      console.error('Failed to mark all notifications as read:', err);
    }
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

  const handleNavigateToProfile = () => {
    const currentRole = (userRole || localStorage.getItem('userRole') || 'ADMIN').toUpperCase();
    const targetPath = currentRole === 'MERCHANT' ? '/merchant/profile'
      : currentRole === 'SUPPORT' ? '/support/profile'
      : currentRole === 'AUDITOR' ? '/auditor/profile'
      : '/admin/profile';
    navigate(targetPath);
  };

  return (
    <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 h-16 flex items-center justify-between px-6 shadow-xs z-10 transition-colors duration-200">
      {/* Left: Sidebar Toggle Button + Portal Title + Search */}
      <div className="flex items-center flex-1">
        {onToggleSidebar && (
          <button
            type="button"
            onClick={onToggleSidebar}
            className="mr-3.5 p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-all focus:outline-none flex items-center justify-center cursor-pointer border border-slate-200 dark:border-slate-700 shadow-xs active:scale-95"
            title={isSidebarOpen ? "Collapse Sidebar" : "Open Sidebar"}
            aria-label="Toggle Sidebar"
          >
            <Menu className="h-5 w-5" />
          </button>
        )}

        <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 hidden md:block tracking-tight">
          {portalTitle}
        </h2>
        <div className="ml-8 relative hidden lg:block max-w-md w-full">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-slate-400" />
          </div>
          <input
            type="text"
            className="block w-full pl-10 pr-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 sm:text-sm transition-colors"
            placeholder={t('header.searchPlaceholder')}
          />
        </div>
      </div>

      {/* Right: Bell + Divider + Single Profile Click */}
      <div className="flex items-center space-x-4">
        {/* ─── Notification Bell ─── */}
        <div className="relative" ref={notificationRef}>
          <button
            type="button"
            onClick={() => {
              if (!notificationsEnabled) return;
              setIsNotificationOpen(v => !v);
            }}
            className={`p-2 rounded-full transition-colors relative focus:outline-none ${notificationsEnabled
                ? 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800'
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
            <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 z-50 overflow-hidden">
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
                    <button onClick={handleMarkAllAsRead} className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800 font-medium flex items-center gap-1 cursor-pointer">
                      <CheckCheck className="h-3.5 w-3.5" />
                      {t('notifications.markAllRead')}
                    </button>
                  )}
                  {notifications.length > 0 && (
                    <button onClick={handleClearAllNotifications} className="text-xs text-slate-400 hover:text-rose-600 font-medium flex items-center gap-1 cursor-pointer" title="Clear all">
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

        <div className="h-6 w-px bg-slate-200 dark:border-slate-800 mx-1" />

        {/* ─── Profile Chip: Direct click opens Profile page, Avatar click opens full photo ─── */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={handleNavigateToProfile}
            className="flex items-center space-x-3 focus:outline-none rounded-xl p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors group cursor-pointer"
            title={t('nav.profile')}
          >
            <div
              onClick={(e) => {
                if (avatar) {
                  e.stopPropagation();
                  setIsImageModalOpen(true);
                }
              }}
              className="h-9 w-9 rounded-full bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center text-blue-600 dark:text-blue-300 border border-blue-200 dark:border-blue-800 overflow-hidden shrink-0 group-hover:ring-2 group-hover:ring-blue-400 transition"
              title="Click photo to enlarge"
            >
              {avatar ? (
                <img
                  src={avatar}
                  alt={userName}
                  className="h-full w-full rounded-full object-cover"
                  onError={() => { if (avatar?.startsWith('http')) convertUrlToBase64AndSave(avatar); setAvatar(null); }}
                />
              ) : (
                <span className="font-bold text-sm">{userName.charAt(0).toUpperCase()}</span>
              )}
            </div>
            <div className="hidden md:flex flex-col text-left">
              <span className="text-sm font-semibold text-slate-700 dark:text-slate-200 leading-tight group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                {userName}
              </span>
              <span className="text-[11px] text-slate-400 dark:text-slate-500 font-medium leading-none mt-0.5">
                {userRole}
              </span>
            </div>
          </button>
        </div>
      </div>

      {/* ─── Full Profile Picture Preview Modal ─── */}
      {isImageModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 animate-in fade-in duration-200"
          onClick={() => setIsImageModalOpen(false)}
        >
          <div
            className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-700 max-w-sm w-full overflow-hidden p-6 relative flex flex-col items-center"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setIsImageModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition cursor-pointer"
              title="Close"
            >
              <X className="h-5 w-5" />
            </button>

            <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-5">
              {t('nav.profile')}
            </h3>

            <div className="w-52 h-52 rounded-full overflow-hidden border-4 border-blue-500/30 shadow-xl flex items-center justify-center bg-slate-100 dark:bg-slate-900 mb-5">
              {avatar ? (
                <img
                  src={avatar}
                  alt={userName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-6xl font-bold text-slate-400">
                  {userName.charAt(0).toUpperCase()}
                </span>
              )}
            </div>

            <div className="text-center w-full">
              <h4 className="text-lg font-bold text-slate-900 dark:text-white truncate">{userName}</h4>
              <span className="inline-block mt-1 px-3 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                {userRole}
              </span>
              <div className="mt-5">
                <button
                  type="button"
                  onClick={() => {
                    setIsImageModalOpen(false);
                    handleNavigateToProfile();
                  }}
                  className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm transition shadow-sm cursor-pointer"
                >
                  Edit Profile & Photo →
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
