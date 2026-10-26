import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import ProfilePictureUpload from "../../components/ProfilePictureUpload";
import {
  Shield,
  Key,
  Clock,
  Monitor,
  Mail,
  Lock,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  Smartphone,
  Globe,
  Calendar,
  ShieldCheck,
} from 'lucide-react';

interface LoginActivity {
  id: string;
  timestamp: string;
  ipAddress: string;
  device: string;
  browser: string;
  location: string;
  status: 'SUCCESS' | 'FAILED';
}

export default function StaffProfile() {
  const { t } = useTranslation();
  const [userName, setUserName] = useState<string>('Alex Morgan');
  const [userRole, setUserRole] = useState<string>('SYSTEM ADMIN');
  const [userEmail, setUserEmail] = useState<string>('alex.morgan@fintechpay.com');
  const [profileImageUrl, setProfileImageUrl] = useState<string | null>(null);
  const [userStatus, setUserStatus] = useState<string>('ACTIVE');
  const [loginActivities, setLoginActivities] = useState<LoginActivity[]>([]);

  // Password Update States
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [passwordStatus, setPasswordStatus] = useState<{
    type: 'success' | 'error' | null;
    message: string;
  }>({ type: null, message: '' });

  useEffect(() => {
    const storedName = localStorage.getItem('userName');
    const storedRole = localStorage.getItem('userRole');
    const storedEmail = localStorage.getItem('userEmail');
    const storedAvatar = localStorage.getItem('adminProfileImage') || localStorage.getItem('userAvatar');

    if (storedName) setUserName(storedName);
    if (storedRole) setUserRole(storedRole);
    if (storedEmail) setUserEmail(storedEmail);
    if (storedAvatar) setProfileImageUrl(storedAvatar);

    const token = localStorage.getItem('token');
    if (token) {
      fetch('http://127.0.0.1:8004/api/v1/admin/staff-users/profile', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
        .then(res => res.ok ? res.json() : null)
        .then(data => {
          if (data) {
            if (data.fullName) setUserName(data.fullName);
            if (data.email) setUserEmail(data.email);
            if (data.role) setUserRole(data.role);
            if (data.status) setUserStatus(data.status);

            const localSaved = localStorage.getItem('adminProfileImage') || localStorage.getItem('userAvatar');
            if (data.profileImageUrl && typeof data.profileImageUrl === 'string' && data.profileImageUrl.trim()) {
              const fullUrl = data.profileImageUrl.startsWith('http') || data.profileImageUrl.startsWith('data:')
                ? data.profileImageUrl
                : `http://127.0.0.1:8004${data.profileImageUrl.startsWith('/') ? '' : '/'}${data.profileImageUrl}`;

              if (localSaved && localSaved.startsWith('data:')) {
                setProfileImageUrl(localSaved);
              } else {
                setProfileImageUrl(fullUrl);
                localStorage.setItem('adminProfileImage', fullUrl);
                localStorage.setItem('userAvatar', fullUrl);
                window.dispatchEvent(new Event('profileUpdated'));
                window.dispatchEvent(new Event('avatarUpdated'));
              }
            }
          }
        })
        .catch(() => {});

      // Fetch login activities
      fetch('http://127.0.0.1:8004/api/v1/admin/staff-users/login-history', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
        .then(res => res.ok ? res.json() : [])
        .then(data => {
          if (Array.isArray(data)) {
            setLoginActivities(data);
          }
        })
        .catch(() => {});
    }
  }, []);

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordStatus({ type: null, message: '' });

    if (newPassword !== confirmPassword) {
      setPasswordStatus({
        type: 'error',
        message: 'New password and confirm password do not match.',
      });
      return;
    }

    if (newPassword.length < 8) {
      setPasswordStatus({
        type: 'error',
        message: 'Password must be at least 8 characters long.',
      });
      return;
    }

    setIsUpdatingPassword(true);
    const token = localStorage.getItem('token');

    fetch('http://127.0.0.1:8004/api/v1/admin/staff-users/change-password', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        currentPassword,
        newPassword,
      }),
    })
      .then(async res => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to update password');
        return data;
      })
      .then(() => {
        setIsUpdatingPassword(false);
        setPasswordStatus({
          type: 'success',
          message: t('staffProfile.passwordUpdated'),
        });
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      })
      .catch(err => {
        setIsUpdatingPassword(false);
        setPasswordStatus({
          type: 'error',
          message: err.message || 'Something went wrong.',
        });
      });
  };

  const handleProfileImageUploaded = (newUrl: string) => {
    const fullUrl =
      newUrl.startsWith('http') || newUrl.startsWith('blob:') || newUrl.startsWith('data:')
        ? newUrl
        : `http://127.0.0.1:8004${newUrl.startsWith('/') ? '' : '/'}${newUrl}`;
    setProfileImageUrl(fullUrl);
    localStorage.setItem('adminProfileImage', fullUrl);
    localStorage.setItem('userAvatar', fullUrl);
    window.dispatchEvent(new Event('profileUpdated'));
    window.dispatchEvent(new Event('avatarUpdated'));
    window.dispatchEvent(new Event('refreshNotifications'));
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Page Header */}
      <div className="border-b border-slate-200 dark:border-slate-700 pb-5">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">{t('staffProfile.title')}</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          {t('staffProfile.subtitle')}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: User Profile Overview Card */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">
              <div className="shrink-0">
                <ProfilePictureUpload
                  currentImageUrl={profileImageUrl}
                  onUploadSuccess={handleProfileImageUploaded}
                />
              </div>

              <div className="flex-1 min-w-0 text-center sm:text-left space-y-2">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                  <ShieldCheck className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
                  <span className="truncate">{userRole}</span>
                </div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white truncate">{userName}</h2>
                <div className="flex items-center justify-center sm:justify-start gap-1.5 text-sm text-slate-500 dark:text-slate-400">
                  <Mail className="w-4 h-4 text-slate-400 shrink-0" />
                  <span className="truncate block">{userEmail}</span>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-6 border-t border-slate-100 dark:border-slate-700 grid grid-cols-1 gap-4">
              <div className="p-3 bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-slate-100 dark:border-slate-700">
                <span className="text-xs font-medium text-slate-400 uppercase tracking-wider block">
                  {t('common.status')}
                </span>
                <div className="mt-1 flex items-center gap-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                  <span className={`w-2 h-2 rounded-full ${userStatus === 'ACTIVE' ? 'bg-emerald-500' : 'bg-red-500'}`}></span>
                  <span>
                    {userStatus === 'ACTIVE' ? t('common.active') : userStatus}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Security Card */}
          <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-xl shadow-sm p-6 border border-slate-800">
            <div className="flex items-center gap-2 mb-3">
              <div className="p-1.5 bg-blue-500/20 text-blue-400 rounded-lg border border-blue-500/30">
                <Shield className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-semibold text-white tracking-wide">Security Enforcement</h3>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              As an authorized admin portal staff member, ensure your password uses a minimum of 8 characters, combining uppercase, lowercase, numbers, and symbols. Never share your credentials.
            </p>
          </div>
        </div>

        {/* Right Column: Security (Change Password) & Recent Activity */}
        <div className="lg:col-span-7 space-y-6">
          {/* Change Password Card */}
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-900/50 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-blue-50 dark:bg-blue-900/40 rounded-lg text-blue-600 dark:text-blue-400">
                  <Key className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-slate-900 dark:text-white">{t('staffProfile.changePassword')}</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Update your access password regularly</p>
                </div>
              </div>
            </div>

            <div className="p-6">
              {passwordStatus.type && (
                <div
                  className={`mb-5 p-3.5 rounded-lg flex items-start gap-2.5 text-xs font-medium border ${
                    passwordStatus.type === 'success'
                      ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                      : 'bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-300 border-red-200 dark:border-red-800'
                  }`}
                >
                  {passwordStatus.type === 'success' ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                  )}
                  <span>{passwordStatus.message}</span>
                </div>
              )}

              <form onSubmit={handlePasswordSubmit} className="space-y-4">
                {/* Current Password */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                    {t('staffProfile.currentPassword')}
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      type={showCurrentPassword ? 'text' : 'password'}
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="Enter your current password"
                      className="w-full pl-10 pr-10 py-2.5 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 outline-none transition"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 focus:outline-none"
                    >
                      {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* New Password & Confirm Password */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                      {t('staffProfile.newPassword')}
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                        <Key className="w-4 h-4" />
                      </div>
                      <input
                        type={showNewPassword ? 'text' : 'password'}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Min. 8 characters"
                        className="w-full pl-10 pr-10 py-2.5 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 outline-none transition"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 focus:outline-none"
                      >
                        {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                      {t('staffProfile.confirmPassword')}
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                        <Key className="w-4 h-4" />
                      </div>
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Repeat new password"
                        className="w-full pl-10 pr-10 py-2.5 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 outline-none transition"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 focus:outline-none"
                      >
                        {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    type="submit"
                    disabled={isUpdatingPassword}
                    className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 shadow-sm transition disabled:opacity-50"
                  >
                    {isUpdatingPassword ? (
                      <>
                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                        <span>Updating...</span>
                      </>
                    ) : (
                      <>
                        <Shield className="w-4 h-4" />
                        <span>{t('staffProfile.updatePassword')}</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* Recent Activity Section */}
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-900/50 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-slate-100 dark:bg-slate-700 rounded-lg text-slate-600 dark:text-slate-300">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-slate-900 dark:text-white">Recent Login Activity</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Audit trail of recent device access and sessions</p>
                </div>
              </div>
            </div>

            <div className="divide-y divide-slate-100 dark:divide-slate-700">
              {loginActivities.length === 0 ? (
                <div className="p-6 text-center text-sm text-slate-400">
                  No recent login activity found.
                </div>
              ) : (
                loginActivities.map((activity) => (
                  <div
                    key={activity.id}
                    className="p-4 sm:px-6 hover:bg-slate-50/60 dark:hover:bg-slate-750 transition flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
                  >
                    <div className="flex items-start sm:items-center gap-3.5">
                      <div className="p-2.5 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-lg shrink-0 mt-0.5 sm:mt-0">
                        {activity.device.toLowerCase().includes('iphone') ||
                        activity.device.toLowerCase().includes('mobile') ? (
                          <Smartphone className="w-4 h-4" />
                        ) : (
                          <Monitor className="w-4 h-4" />
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">{activity.device}</span>
                          <span className="text-xs text-slate-500 font-mono bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-600">
                            {activity.ipAddress}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{activity.browser}</p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end sm:text-right gap-4 text-xs text-slate-500 dark:text-slate-400">
                      <div className="flex items-center gap-1">
                        <Globe className="w-3.5 h-3.5 text-slate-400" />
                        <span>{activity.location}</span>
                      </div>
                      <div className="flex items-center gap-1 font-medium text-slate-600 dark:text-slate-300">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        <span>{activity.timestamp}</span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
