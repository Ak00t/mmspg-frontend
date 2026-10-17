import { useNavigate } from 'react-router-dom';
import { 
  User, 
  LogOut, 
  ChevronDown, 
  Bell, 
  Search, 
  Check, 
  CheckCheck, 
  Loader2,
  Inbox
} from 'lucide-react';
import { useState, useEffect, useRef } from 'react';

// Backend Base URL matching your project's configuration
const API_BASE_URL = 'http://127.0.0.1:8004';

export interface NotificationItem {
  id: string | number;
  title: string;
  message: string;
  createdAt: string;
  isRead?: boolean;
  read?: boolean;
  status?: string; // 'READ' | 'UNREAD'
}

export default function Header() {
  const navigate = useNavigate();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);

  // Notification States
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [isLoadingNotifications, setIsLoadingNotifications] = useState(false);

  // Dropdown click-outside refs
  const notificationRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  // LocalStorage User Info
  const userName = localStorage.getItem('userName') || 'Admin User';
  const userRole = localStorage.getItem('userRole') || 'ADMIN';
  const [avatarUrl, setAvatarUrl] = useState<string | null>(
    localStorage.getItem('userAvatar')
  );

  // ----------------------------------------------------------------------
  // 1. Fetch Notifications
  // ----------------------------------------------------------------------
  const fetchNotifications = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/notifications`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        // Support array response or paginated { content: [...] } / { data: [...] }
        const items: NotificationItem[] = Array.isArray(data)
          ? data
          : (data.content || data.data || data.notifications || []);
        
        setNotifications(items);
      }
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
    }
  };

  // ----------------------------------------------------------------------
  // 2. Initial Fetch & Periodic Polling (every 30s)
  // ----------------------------------------------------------------------
  useEffect(() => {
    setIsLoadingNotifications(true);
    fetchNotifications().finally(() => setIsLoadingNotifications(false));

    // Polling interval for real-time updates
    const pollInterval = setInterval(() => {
      fetchNotifications();
    }, 30000); // 30 seconds

    return () => clearInterval(pollInterval);
  }, []);


  useEffect(() => {
    const handleRefresh = () => {
      fetchNotifications(); // Event လာတာနဲ့ ချက်ချင်း API ပြန်ခေါ်မယ်
    };

    window.addEventListener('refreshNotifications', handleRefresh);
    
    return () => {
      window.removeEventListener('refreshNotifications', handleRefresh);
    };
  }, []);


  // ----------------------------------------------------------------------
  // 3. Close Dropdowns on Click Outside
  // ----------------------------------------------------------------------
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        notificationRef.current && 
        !notificationRef.current.contains(event.target as Node)
      ) {
        setIsNotificationOpen(false);
      }
      if (
        profileRef.current && 
        !profileRef.current.contains(event.target as Node)
      ) {
        setIsProfileOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // ----------------------------------------------------------------------
  // 4. Avatar Sync
  // ----------------------------------------------------------------------
  useEffect(() => {
    const handleAvatarUpdate = () => {
      setAvatarUrl(localStorage.getItem('userAvatar'));
    };

    window.addEventListener('avatarUpdated', handleAvatarUpdate);

    const token = localStorage.getItem('token');
    if (token && !localStorage.getItem('userAvatar')) {
      fetch(`${API_BASE_URL}/api/v1/admin/staff-users/profile`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
        .then(res => res.ok ? res.json() : null)
        .then(data => {
          if (data?.profileImageUrl) {
            const fullUrl = data.profileImageUrl.startsWith('http')
              ? data.profileImageUrl
              : `${API_BASE_URL}${data.profileImageUrl}`;
            localStorage.setItem('userAvatar', fullUrl);
            setAvatarUrl(fullUrl);
          }
        })
        .catch(() => {});
    }

    return () => {
      window.removeEventListener('avatarUpdated', handleAvatarUpdate);
    };
  }, []);

  // ----------------------------------------------------------------------
  // 5. Notification Action Handlers
  // ----------------------------------------------------------------------
  const checkIsRead = (item: NotificationItem): boolean => {
    if (typeof item.isRead === 'boolean') return item.isRead;
    if (typeof item.read === 'boolean') return item.read;
    if (item.status) return item.status === 'READ';
    return false;
  };

  const handleMarkAsRead = async (id: string | number, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const token = localStorage.getItem('token');
    if (!token) return;

    // Optimistic UI update
    setNotifications(prev =>
      prev.map(n =>
        n.id === id ? { ...n, isRead: true, read: true, status: 'READ' } : n
      )
    );

    try {
      await fetch(`${API_BASE_URL}/api/v1/notifications/${id}/read`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
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

    const token = localStorage.getItem('token');
    if (!token) return;

    // Call individual mark as read in parallel
    try {
      await Promise.all(
        unreadItems.map(item =>
          fetch(`${API_BASE_URL}/api/v1/notifications/${item.id}/read`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            }
          })
        )
      );
    } catch (err) {
      console.error('Failed to mark all notifications as read:', err);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userId');
    localStorage.removeItem('userName');
    localStorage.removeItem('userRole');
    localStorage.removeItem('userAvatar');
    navigate('/login');
  };

  // Unread Count
  const unreadCount = notifications.filter(n => !checkIsRead(n)).length;

  // Relative Time Helper
  const formatTimeAgo = (dateString?: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;

    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    if (seconds < 60) return 'Just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;

    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
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
        {/* ========================================== */}
        {/* Notification Bell & Dropdown               */}
        {/* ========================================== */}
        <div className="relative" ref={notificationRef}>
          <button 
            type="button"
            onClick={() => {
              setIsNotificationOpen(!isNotificationOpen);
              setIsProfileOpen(false); // Close profile if open
            }}
            className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-colors relative focus:outline-none"
            aria-label="Notifications"
          >
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-bold text-white bg-red-500 rounded-full border-2 border-white animate-pulse">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {isNotificationOpen && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-xl shadow-xl border border-slate-200 ring-1 ring-black/5 origin-top-right transition-all z-50 overflow-hidden">
              {/* Header */}
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

              {/* List */}
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
                        onClick={() => !isRead && handleMarkAsRead(item.id)}
                        className={`p-3.5 transition-colors cursor-pointer flex items-start gap-3 ${
                          isRead
                            ? 'bg-white hover:bg-slate-50'
                            : 'bg-blue-50/40 hover:bg-blue-50/70'
                        }`}
                      >
                        {/* Unread status dot */}
                        <div className="pt-1.5 flex-shrink-0">
                          <span
                            className={`block h-2 w-2 rounded-full ${
                              isRead ? 'bg-transparent' : 'bg-blue-600'
                            }`}
                          />
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-1">
                            <p className={`text-xs ${isRead ? 'font-medium text-slate-700' : 'font-semibold text-slate-900'} truncate`}>
                              {item.title}
                            </p>
                            <span className="text-[10px] text-slate-400 whitespace-nowrap">
                              {formatTimeAgo(item.createdAt)}
                            </span>
                          </div>
                          <p className="text-xs text-slate-600 mt-0.5 line-clamp-2 leading-relaxed">
                            {item.message}
                          </p>
                        </div>

                        {/* Mark single as read button */}
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
        {/* User Profile Dropdown                      */}
        {/* ========================================== */}
        <div className="relative" ref={profileRef}>
          <button 
            onClick={() => {
              setIsProfileOpen(!isProfileOpen);
              setIsNotificationOpen(false); // Close notifications if open
            }}
            className="flex items-center space-x-3 focus:outline-none rounded-lg p-1 hover:bg-slate-50 transition-colors"
          >
            <div className="h-9 w-9 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 border border-blue-200 overflow-hidden">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt={userName}
                  className="h-full w-full object-cover"
                  onError={() => setAvatarUrl(null)}
                />
              ) : (
                <span className="font-bold">{userName.charAt(0).toUpperCase()}</span>
              )}
            </div>
            <div className="hidden md:flex items-center text-left">
              <div className="flex flex-col">
                <span className="text-sm font-medium text-slate-700 leading-none mb-1">{userName}</span>
                <span className="text-xs text-slate-500 leading-none">{userRole}</span>
              </div>
              <ChevronDown className="ml-2 h-4 w-4 text-slate-400" />
            </div>
          </button>
          
          {isProfileOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg py-1 border border-slate-200 ring-1 ring-black ring-opacity-5 origin-top-right transition-all z-50">
              <div className="px-4 py-3 border-b border-slate-100 md:hidden">
                <p className="text-sm font-medium text-slate-900">{userName}</p>
                <p className="text-xs font-medium text-slate-500 truncate">{userRole} Account</p>
              </div>

              <button
                onMouseDown={() => {
                  navigate('/admin/profile');
                  setIsProfileOpen(false);
                }}
                className="flex items-center w-full px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
              >
                <User className="mr-2 h-4 w-4" />
                Profile
              </button>

              <button
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