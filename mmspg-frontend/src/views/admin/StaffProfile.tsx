import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import ProfilePictureUpload from "../../components/ProfilePictureUpload";
import {
  Shield,
  Key,
  Mail,
  Lock,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  CreditCard,
  Phone,
  FileText,
  X
} from 'lucide-react';
import {
  getStaffProfile,
  updateStaffPassword
} from '../../services/adminManagementApi';
import { getMerchantProfile } from '../../features/main-merchant/api/merchantDashboardApi';
import { api } from '../../services/api';

export default function StaffProfile() {
  const { t } = useTranslation();
  const [userRole, setUserRole] = useState<string>(() => (localStorage.getItem('userRole') || 'ADMIN').toUpperCase());
  const [userName, setUserName] = useState<string>('Portal User');
  const [userEmail, setUserEmail] = useState<string>('');
  const [profileImageUrl, setProfileImageUrl] = useState<string | null>(null);
  const [userStatus, setUserStatus] = useState<string>('ACTIVE');

  // Merchant-specific details
  const [merchantCode, setMerchantCode] = useState<string>('');
  const [settlementAccountNo, setSettlementAccountNo] = useState<string>('');
  const [contactName, setContactName] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [mccCode, setMccCode] = useState<string>('');

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

  // Photo Preview Modal
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);

  useEffect(() => {
    const role = (localStorage.getItem('userRole') || 'ADMIN').toUpperCase();
    setUserRole(role);

    const storedName = localStorage.getItem('userName');
    const storedEmail = localStorage.getItem('userEmail');
    const storedAvatar = localStorage.getItem('adminProfileImage') || localStorage.getItem('userAvatar');

    if (storedName) setUserName(storedName);
    if (storedEmail) setUserEmail(storedEmail);
    if (storedAvatar) setProfileImageUrl(storedAvatar);

    if (role === 'MERCHANT') {
      getMerchantProfile()
        .then(data => {
          if (data) {
            const name = data.businessName || data.contactName || 'Merchant Portal';
            setUserName(name);
            localStorage.setItem('userName', name);
            if (data.email) { setUserEmail(data.email); localStorage.setItem('userEmail', data.email); }
            if (data.status) setUserStatus(data.status);
            if (data.merchantCode) setMerchantCode(data.merchantCode);
            if (data.settlementAccountNo) setSettlementAccountNo(data.settlementAccountNo);
            if (data.contactName) setContactName(data.contactName);
            if (data.phone) setPhone(data.phone);
            if (data.mccCode) setMccCode(data.mccCode);

            const localSaved = localStorage.getItem('adminProfileImage') || localStorage.getItem('userAvatar');
            if (data.profileImageUrl && typeof data.profileImageUrl === 'string' && data.profileImageUrl.trim()) {
              const apiBase = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8004';
              const fullUrl = data.profileImageUrl.startsWith('http') || data.profileImageUrl.startsWith('data:')
                ? data.profileImageUrl
                : `${apiBase}${data.profileImageUrl.startsWith('/') ? '' : '/'}${data.profileImageUrl}`;

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
        .catch(err => console.error('Failed to load merchant profile:', err));
    } else {
      getStaffProfile()
        .then(data => {
          if (data) {
            if (data.fullName) { setUserName(data.fullName); localStorage.setItem('userName', data.fullName); }
            if (data.email) { setUserEmail(data.email); localStorage.setItem('userEmail', data.email); }
            if (data.role) setUserRole(data.role);
            if (data.status) setUserStatus(data.status);

            const localSaved = localStorage.getItem('adminProfileImage') || localStorage.getItem('userAvatar');
            if (data.profileImageUrl && typeof data.profileImageUrl === 'string' && data.profileImageUrl.trim()) {
              const apiBase = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8004';
              const fullUrl = data.profileImageUrl.startsWith('http') || data.profileImageUrl.startsWith('data:')
                ? data.profileImageUrl
                : `${apiBase}${data.profileImageUrl.startsWith('/') ? '' : '/'}${data.profileImageUrl}`;

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
        .catch(err => console.error('Failed to load staff profile:', err));
    }
  }, []);

  const handlePasswordSubmit = async (e: React.FormEvent) => {
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
    try {
      if (userRole === 'MERCHANT') {
        await api.put('/api/v1/merchant/dashboard/profile/password', { currentPassword, newPassword });
      } else {
        await updateStaffPassword({ currentPassword, newPassword });
      }

      setPasswordStatus({
        type: 'success',
        message: t('staffProfile.passwordUpdated') || 'Your password has been successfully updated.',
      });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setPasswordStatus({
        type: 'error',
        message: err.response?.data?.error || err.response?.data?.message || err.message || 'Failed to update password. Please check your current password.',
      });
    } finally {
      setIsUpdatingPassword(false);
    }
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

  const pageTitle = userRole === 'MERCHANT'
    ? (t('staffProfile.merchantTitle') || 'Merchant Profile')
    : (t('staffProfile.title') || 'Staff Profile');

  const pageSubtitle = userRole === 'MERCHANT'
    ? (t('staffProfile.merchantSubtitle') || 'View and manage your merchant business profile and account credentials')
    : (t('staffProfile.subtitle') || 'View and manage your account details and security settings');

  return (
    <div className="space-y-6 pb-12">
      {/* Page Header */}
      <div className="border-b border-slate-200 dark:border-slate-800 pb-5">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">{pageTitle}</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{pageSubtitle}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Left Column: User Profile Overview Card */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xs border border-slate-200 dark:border-slate-700 p-6">
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">
              <div className="shrink-0 relative group">
                <ProfilePictureUpload
                  currentImageUrl={profileImageUrl}
                  onUploadSuccess={handleProfileImageUploaded}
                  apiEndpoint={userRole === 'MERCHANT' ? '/api/v1/merchant/dashboard/profile-picture' : '/api/v1/admin/staff-users/profile-picture'}
                />
                {profileImageUrl && (
                  <button
                    type="button"
                    onClick={() => setIsPreviewModalOpen(true)}
                    className="mt-2 text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center justify-center w-full gap-1 cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>View photo</span>
                  </button>
                )}
              </div>

              <div className="flex-1 min-w-0 text-center sm:text-left space-y-2">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                  <ShieldCheck className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
                  <span className="truncate">{userRole}</span>
                </div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white truncate">{userName}</h2>
                <div className="flex items-center justify-center sm:justify-start gap-1.5 text-sm text-slate-500 dark:text-slate-400">
                  <Mail className="w-4 h-4 text-slate-400 shrink-0" />
                  <span className="truncate block">{userEmail || 'No email registered'}</span>
                </div>
              </div>
            </div>

            {/* Profile Meta Details */}
            <div className="mt-6 pt-6 border-t border-slate-100 dark:border-slate-700 space-y-3">
              <div className="p-3 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-100 dark:border-slate-700 flex items-center justify-between">
                <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">
                  {t('common.status')}
                </span>
                <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                  <span className={`w-2 h-2 rounded-full ${userStatus === 'ACTIVE' ? 'bg-emerald-500' : 'bg-red-500'}`}></span>
                  <span>{userStatus === 'ACTIVE' ? t('common.active') : userStatus}</span>
                </div>
              </div>

              {userRole === 'MERCHANT' && (
                <>
                  {merchantCode && (
                    <div className="p-3 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-100 dark:border-slate-700 flex items-center justify-between">
                      <span className="text-xs font-medium text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                        <FileText className="w-3.5 h-3.5" />
                        {t('staffProfile.merchantCode') || 'Merchant Code'}
                      </span>
                      <span className="font-mono text-xs font-semibold text-slate-800 dark:text-slate-200">{merchantCode}</span>
                    </div>
                  )}

                  {settlementAccountNo && (
                    <div className="p-3 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-100 dark:border-slate-700 flex items-center justify-between">
                      <span className="text-xs font-medium text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                        <CreditCard className="w-3.5 h-3.5" />
                        {t('staffProfile.settlementAccount') || 'Settlement A/C'}
                      </span>
                      <span className="font-mono text-xs font-semibold text-slate-800 dark:text-slate-200">{settlementAccountNo}</span>
                    </div>
                  )}

                  {contactName && (
                    <div className="p-3 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-100 dark:border-slate-700 flex items-center justify-between">
                      <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">
                        {t('staffProfile.contactPerson') || 'Contact Person'}
                      </span>
                      <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">{contactName}</span>
                    </div>
                  )}

                  {phone && (
                    <div className="p-3 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-100 dark:border-slate-700 flex items-center justify-between">
                      <span className="text-xs font-medium text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                        <Phone className="w-3.5 h-3.5" />
                        {t('staffProfile.phone') || 'Phone'}
                      </span>
                      <span className="font-mono text-xs font-semibold text-slate-800 dark:text-slate-200">{phone}</span>
                    </div>
                  )}

                  {mccCode && (
                    <div className="p-3 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-100 dark:border-slate-700 flex items-center justify-between">
                      <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">
                        {t('staffProfile.mccCode') || 'MCC Code'}
                      </span>
                      <span className="font-mono text-xs font-semibold text-slate-800 dark:text-slate-200">{mccCode}</span>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Security Card */}
          <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-2xl shadow-xs p-6 border border-slate-800 flex-1 flex flex-col justify-center">
            <div className="flex items-center gap-2 mb-3">
              <div className="p-1.5 bg-blue-500/20 text-blue-400 rounded-lg border border-blue-500/30">
                <Shield className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-semibold text-white tracking-wide">Security Enforcement</h3>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              {userRole === 'MERCHANT'
                ? 'Keep your merchant login credentials and settlement information protected. Regularly update your password to maintain the highest level of payment account security.'
                : 'As an authorized portal staff member, ensure your password uses a minimum of 8 characters, combining uppercase, lowercase, numbers, and symbols. Never share your credentials.'}
            </p>
          </div>
        </div>

        {/* Right Column: Change Password Card */}
        <div className="lg:col-span-7 flex flex-col">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xs border border-slate-200 dark:border-slate-700 overflow-hidden h-full flex flex-col">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-900/50 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-blue-50 dark:bg-blue-900/40 rounded-xl text-blue-600 dark:text-blue-400">
                  <Key className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-slate-900 dark:text-white">{t('staffProfile.changePassword')}</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Update your access password regularly</p>
                </div>
              </div>
            </div>

            <div className="p-6 flex-1 flex flex-col">
              {passwordStatus.type && (
                <div
                  className={`mb-5 p-3.5 rounded-xl flex items-start gap-2.5 text-xs font-medium border ${
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

              <form onSubmit={handlePasswordSubmit} className="flex-1 flex flex-col justify-between space-y-5">
                <div className="space-y-5">
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
                        placeholder="••••••••"
                        required
                        className="block w-full pl-10 pr-10 py-2.5 text-sm border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50/50 dark:bg-slate-900/50 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white dark:focus:bg-slate-900 transition-colors"
                      />
                      <button
                        type="button"
                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                      >
                        {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* New Password */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                      {t('staffProfile.newPassword')}
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                        <Lock className="w-4 h-4" />
                      </div>
                      <input
                        type={showNewPassword ? 'text' : 'password'}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="••••••••"
                        required
                        minLength={8}
                        className="block w-full pl-10 pr-10 py-2.5 text-sm border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50/50 dark:bg-slate-900/50 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white dark:focus:bg-slate-900 transition-colors"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                      >
                        {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Confirm Password */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                      {t('staffProfile.confirmPassword')}
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                        <Lock className="w-4 h-4" />
                      </div>
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="••••••••"
                        required
                        minLength={8}
                        className="block w-full pl-10 pr-10 py-2.5 text-sm border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50/50 dark:bg-slate-900/50 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white dark:focus:bg-slate-900 transition-colors"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                      >
                        {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100 dark:border-slate-700 flex justify-end">
                  <button
                    type="submit"
                    disabled={isUpdatingPassword}
                    className="inline-flex items-center px-5 py-2.5 border border-transparent rounded-xl shadow-xs text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 transition cursor-pointer"
                  >
                    {isUpdatingPassword ? t('common.loading') : (t('staffProfile.updatePassword') || 'Update Password')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>

      {/* Enlarged Photo Modal */}
      {isPreviewModalOpen && profileImageUrl && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 animate-in fade-in"
          onClick={() => setIsPreviewModalOpen(false)}
        >
          <div
            className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-700 max-w-sm w-full p-6 relative flex flex-col items-center"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setIsPreviewModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
            <h4 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-4">
              Profile Photo
            </h4>
            <div className="w-56 h-56 rounded-full overflow-hidden border-4 border-blue-500/30 shadow-xl mb-4">
              <img src={profileImageUrl} alt="Full profile" className="w-full h-full object-cover" />
            </div>
            <p className="font-bold text-slate-900 dark:text-white text-base">{userName}</p>
            <p className="text-xs text-slate-400">{userRole}</p>
          </div>
        </div>
      )}
    </div>
  );
}
