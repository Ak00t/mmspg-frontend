import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { 
  Store, 
  ShieldCheck, 
  Mail, 
  Lock, 
  AlertCircle, 
  ArrowRight, 
  Eye, 
  EyeOff, 
  Sun, 
  Moon, 
  Globe, 
  Ban, 
  AlertTriangle,
  PhoneCall
} from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import merchantLogo from '../../assets/merchant-logo.png';
import { api } from '../../services/api';

export default function Login() {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const { theme, toggleTheme } = useTheme();

  // Tab State: 'MERCHANT' or 'STAFF'
  const [portalType, setPortalType] = useState<'MERCHANT' | 'STAFF'>('MERCHANT');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Suspended Account Alert Modal State
  const [isSuspendedModalOpen, setIsSuspendedModalOpen] = useState(false);
  const [suspendedDetails, setSuspendedDetails] = useState('');

  const handleTabChange = (type: 'MERCHANT' | 'STAFF') => {
    setPortalType(type);
    setError('');
  };

  const toggleLanguage = () => {
    const nextLang = i18n.language === 'my' ? 'en' : 'my';
    i18n.changeLanguage(nextLang);
    localStorage.setItem('lang', nextLang);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      if (portalType === 'MERCHANT') {
        let data: any;
        try {
          const response = await api.post('/api/v1/merchant-portal/auth/login', { email: email.trim(), password });
          data = response.data;
        } catch (apiErr: any) {
          const respData = apiErr.response?.data;
          const status = apiErr.response?.status;
          if (
            status === 403 ||
            respData?.suspended ||
            (respData?.error && String(respData.error).includes('SUSPENDED')) ||
            (respData?.message && String(respData.message).toLowerCase().includes('suspend')) ||
            (respData?.message && String(respData.message).toLowerCase().includes('not active'))
          ) {
            const msg = respData?.message || (i18n.language === 'my' 
              ? 'သင့် Merchant အကောင့်ကို Administrator မှ ဆိုင်းငံ့ (Suspend) ထားပါသည်။' 
              : 'Your merchant account has been suspended by system administration.');
            setSuspendedDetails(msg);
            setIsSuspendedModalOpen(true);
            setError(msg);
            return;
          }
          throw apiErr;
        }

        // Store Merchant session data
        localStorage.setItem('token', data.token);
        localStorage.setItem('mmspg_token', data.token);
        localStorage.setItem('userId', data.merchantId);
        localStorage.setItem('merchantId', data.merchantId);
        localStorage.setItem('mmspg_merchant_id', data.merchantId);
        localStorage.setItem('userName', data.businessName);
        localStorage.setItem('userRole', 'MERCHANT');

        if (data.avatar || data.profileImage || data.image) {
          localStorage.setItem('userAvatar', data.avatar || data.profileImage || data.image);
        }

        navigate('/merchant/dashboard');
      } else {
        let data: any;
        try {
          const response = await api.post('/api/v1/login', { email: email.trim(), password });
          data = response.data;
        } catch (apiErr: any) {
          const respData = apiErr.response?.data;
          const status = apiErr.response?.status;
          if (
            status === 403 ||
            respData?.suspended ||
            (respData?.error && String(respData.error).includes('SUSPENDED')) ||
            (respData?.message && String(respData.message).toLowerCase().includes('suspend')) ||
            (respData?.message && String(respData.message).toLowerCase().includes('not active'))
          ) {
            const msg = respData?.message || (i18n.language === 'my' 
              ? 'သင့် Staff အကောင့်ကို ဆိုင်းငံ့ (Suspend) ထားပါသည်။ Administrator ထံ ဆက်သွယ်ပါ။' 
              : 'Your staff account has been suspended. Please contact your system administrator.');
            setSuspendedDetails(msg);
            setIsSuspendedModalOpen(true);
            setError(msg);
            return;
          }
          throw apiErr;
        }

        // Store Staff session data
        localStorage.setItem('token', data.token);
        localStorage.setItem('mmspg_token', data.token);
        localStorage.setItem('userId', data.staffId || data.id);
        localStorage.setItem('userName', data.fullName);
        localStorage.setItem('userRole', data.role);

        // Navigate staff based on their specific role (SUPPORT, AUDITOR, ADMIN)
        const role = (data.role || '').toUpperCase();
        if (role === 'SUPPORT') {
          navigate('/support/dashboard');
        } else if (role === 'AUDITOR') {
          navigate('/admin/dashboard');
        } else {
          navigate('/admin/dashboard');
        }
      }
    } catch (err: any) {
      if (err.message && err.message.includes('Network Error')) {
        setError(i18n.language === 'my'
          ? 'Backend Server သို့ ချိတ်ဆက်၍မရပါ။ ကျေးဇူးပြု၍ Backend Server ဖွင့်ထားခြင်း ရှိ/မရှိ စစ်ဆေးပေးပါ။'
          : 'Cannot connect to backend server. Please ensure the backend is running.');
      } else {
        const errorMsg = err.response?.data?.message || err.response?.data?.error || err.message;
        setError(errorMsg || (i18n.language === 'my' ? 'ဝင်ရောက်မှု အမှားဖြစ်ပေါ်ခဲ့ပါသည်။ ထပ်မံကြိုးစားပါ။' : 'An error occurred during login. Please try again.'));
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 relative overflow-hidden transition-colors duration-200">
      {/* Background Decorative Radial Glows */}
      <div className="absolute top-1/4 -left-20 w-96 h-96 bg-blue-600/15 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-indigo-600/15 rounded-full blur-3xl pointer-events-none"></div>

      {/* Top Header Controls (Language + Theme) */}
      <div className="absolute top-6 right-6 flex items-center gap-2 z-20">
        <button
          onClick={toggleLanguage}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/80 dark:bg-slate-800/80 backdrop-blur-md border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 shadow-sm hover:bg-white dark:hover:bg-slate-700 transition-all"
          title="Switch Language"
        >
          <Globe className="h-3.5 w-3.5 text-blue-500" />
          <span>{i18n.language === 'my' ? '🇲🇲 မြန်မာ' : '🇬🇧 English'}</span>
        </button>

        <button
          onClick={toggleTheme}
          className="p-2 rounded-full bg-white/80 dark:bg-slate-800/80 backdrop-blur-md border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 shadow-sm hover:bg-white dark:hover:bg-slate-700 transition-all"
          title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        >
          {theme === 'dark' ? <Sun className="h-4 w-4 text-amber-400" /> : <Moon className="h-4 w-4 text-slate-600" />}
        </button>
      </div>

      {/* Main Login Container */}
      <div className="max-w-md w-full bg-white/95 dark:bg-slate-800/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-slate-200/80 dark:border-slate-700/80 p-8 sm:p-9 space-y-6 relative z-10 transition-all">
        
        {/* Merchant & Payment Gateway Brand Logo */}
        <div className="text-center flex flex-col items-center">
          <div className="mb-3 flex items-center justify-center">
            <img 
              src={merchantLogo} 
              alt="PaymentGateWay Logo" 
              className="h-20 w-auto object-contain filter drop-shadow-md hover:scale-105 transition-transform duration-200"
            />
          </div>

          {/* Subtitle Badge */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/60 border border-blue-200/80 dark:border-blue-800/60 text-blue-700 dark:text-blue-300 text-[11px] font-semibold mb-2 shadow-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-ping"></span>
            <span>{t('auth.merchantTabLabel') || 'Merchant'} & Financial Portal</span>
          </div>

          {/* Single Solid Color Title */}
          <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            PaymentGateWay
          </h1>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 font-medium">
            {i18n.language === 'my' 
              ? 'လုံခြုံစိတ်ချရသော မြန်မာ့ငွေပေးချေမှု ပလက်ဖောင်း' 
              : 'Secure High-Velocity Payment Gateway Platform'}
          </p>
        </div>

        {/* Portal Role Tabs */}
        <div className="grid grid-cols-2 gap-2 rounded-2xl bg-slate-100 dark:bg-slate-750 p-1.5 border border-slate-200/60 dark:border-slate-700/60">
          <button
            type="button"
            onClick={() => handleTabChange('MERCHANT')}
            className={`flex items-center justify-center gap-2 rounded-xl py-2.5 text-xs sm:text-sm font-bold transition-all duration-200 ${
              portalType === 'MERCHANT'
                ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-md ring-1 ring-black/5 dark:ring-white/10'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Store className="h-4 w-4" />
            <span>{t('auth.merchantTabLabel')}</span>
          </button>

          <button
            type="button"
            onClick={() => handleTabChange('STAFF')}
            className={`flex items-center justify-center gap-2 rounded-xl py-2.5 text-xs sm:text-sm font-bold transition-all duration-200 ${
              portalType === 'STAFF'
                ? 'bg-slate-900 dark:bg-indigo-600 text-white shadow-md'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <ShieldCheck className="h-4 w-4" />
            <span>{t('auth.staffTabLabel')}</span>
          </button>
        </div>

        {/* Context Subtitle */}
        <div className="border-b border-slate-100 dark:border-slate-700/70 pb-3 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100">
              {portalType === 'MERCHANT' ? t('auth.merchantPortalSignIn') : t('auth.staffAdminSignIn')}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {portalType === 'MERCHANT' ? t('auth.merchantPortalDesc') : t('auth.staffPortalDesc')}
            </p>
          </div>
          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 uppercase">
            {portalType}
          </span>
        </div>

        {/* Inline Error Alert */}
        {error && (
          <div className="flex items-start gap-2.5 rounded-xl border border-rose-200 dark:border-rose-900/60 bg-rose-50 dark:bg-rose-950/40 p-3 text-xs text-rose-700 dark:text-rose-300">
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-500 mt-0.5" />
            <span className="leading-relaxed">{error}</span>
          </div>
        )}

        {/* Login Form */}
        <form className="space-y-4" onSubmit={handleLogin}>
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              {t('auth.emailAddress')} *
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-slate-300 dark:border-slate-600 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all bg-slate-50/70 dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:bg-white dark:focus:bg-slate-900"
                placeholder={portalType === 'MERCHANT' ? 'merchant@business.com' : 'staff@paymentgateway.com'}
                required
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                {t('auth.password')} *
              </label>
              <a 
                href="#" 
                onClick={(e) => {
                  e.preventDefault();
                  navigate('/forgot-password');
                }}
                className="text-xs font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
              >
                {t('auth.forgotPassword')}
              </a>
            </div>
            <div className="relative">
              <Lock className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-11 py-2.5 border border-slate-300 dark:border-slate-600 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all bg-slate-50/70 dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:bg-white dark:focus:bg-slate-900"
                placeholder="••••••••"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(prev => !prev)}
                className="absolute right-3.5 top-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors focus:outline-none"
                tabIndex={-1}
                aria-label={showPassword ? t('auth.hidePassword') : t('auth.showPassword')}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={isLoading}
              className={`w-full flex justify-center items-center gap-2 py-3 px-4 rounded-xl shadow-md text-sm font-bold text-white transition-all disabled:opacity-60 ${
                portalType === 'MERCHANT'
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-blue-500/20'
                  : 'bg-slate-900 hover:bg-slate-800 dark:bg-indigo-600 dark:hover:bg-indigo-700 shadow-slate-900/20 dark:shadow-indigo-500/20'
              }`}
            >
              <span>
                {isLoading 
                  ? t('auth.signingIn') 
                  : portalType === 'MERCHANT' 
                    ? t('auth.signInMerchant') 
                    : t('auth.signInStaff')}
              </span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </form>

        {/* Security Footer Notice */}
        <div className="border-t border-slate-100 dark:border-slate-700/70 pt-4 text-center">
          <p className="text-[11px] text-slate-400 dark:text-slate-500">
            {t('auth.securityNotice')}
          </p>
        </div>
      </div>

      {/* ─── SUSPENDED ACCOUNT ALERT MODAL ─── */}
      {isSuspendedModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl max-w-md w-full overflow-hidden border border-rose-200 dark:border-rose-900/60 p-6 sm:p-7 text-center space-y-4">
            
            {/* Warning Icon Badge */}
            <div className="mx-auto w-16 h-16 rounded-2xl bg-rose-100 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800/50 flex items-center justify-center text-rose-600 dark:text-rose-400 shadow-inner">
              <Ban className="h-8 w-8" />
            </div>

            {/* Title & Subtitle */}
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 text-xs font-bold uppercase tracking-wider mb-2">
                <AlertTriangle className="h-3.5 w-3.5" />
                <span>Account Status: Suspended</span>
              </div>
              <h3 className="text-xl font-extrabold text-slate-900 dark:text-white">
                {i18n.language === 'my' ? 'အကောင့်ဆိုင်းငံ့ခံထားရပါသည်' : 'Account Suspended'}
              </h3>
              <p className="mt-2 text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                {i18n.language === 'my'
                  ? 'သင့်အကောင့်ကို Administrator မှ ဆိုင်းငံ့ (Suspend) ထားပါသည်။ PaymentGateWay စနစ်နှင့် ပတ်သက်သည့် လုပ်ငန်းစဉ်များအားလုံးကို ယာယီကန့်သတ်ထားပါသည်။'
                  : 'Your account has been suspended by system administration. Access to payment operations and dashboard controls has been restricted.'}
              </p>
            </div>

            {/* Reason details */}
            {suspendedDetails && (
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 text-left text-xs text-slate-700 dark:text-slate-300">
                <span className="font-semibold text-rose-600 dark:text-rose-400">Notice: </span>
                {suspendedDetails}
              </div>
            )}

            {/* Support Information Box */}
            <div className="bg-rose-50/70 dark:bg-rose-950/30 border border-rose-200/60 dark:border-rose-900/40 rounded-2xl p-3.5 text-xs text-rose-800 dark:text-rose-300 text-left space-y-1.5">
              <p className="font-bold flex items-center gap-1.5 text-rose-700 dark:text-rose-300">
                <PhoneCall className="h-3.5 w-3.5" />
                {i18n.language === 'my' ? 'ဆက်သွယ်မေးမြန်းရန် အချက်အလက်များ:' : 'Support Contacts:'}
              </p>
              <p className="text-slate-600 dark:text-slate-400">• Email: support@paymentgateway.com</p>
              <p className="text-slate-600 dark:text-slate-400">• Help Desk: +95 9 123 456 789 / +95 1 234 567</p>
            </div>

            {/* Dismiss Button */}
            <button
              type="button"
              onClick={() => setIsSuspendedModalOpen(false)}
              className="w-full py-2.5 px-4 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-sm font-bold transition-colors shadow-sm"
            >
              {i18n.language === 'my' ? 'သိရှိပါပြီ' : 'I Understand'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
