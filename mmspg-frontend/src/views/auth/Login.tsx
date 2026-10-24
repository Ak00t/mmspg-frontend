import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Store, ShieldCheck, Mail, Lock, AlertCircle, ArrowRight } from 'lucide-react';

export default function Login() {
  const navigate = useNavigate();

  // Tab State: 'MERCHANT' or 'STAFF'
  const [portalType, setPortalType] = useState<'MERCHANT' | 'STAFF'>('MERCHANT');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleTabChange = (type: 'MERCHANT' | 'STAFF') => {
    setPortalType(type);
    setError('');
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      if (portalType === 'MERCHANT') {
        // 🏪 Merchant Login Endpoint
        const response = await fetch('http://127.0.0.1:8004/api/v1/merchant-portal/auth/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email, password }),
        });

        const data = await response.json();
if (!response.ok) {
          throw new Error(data.message || 'Invalid merchant credentials');
        }

        // Store Merchant session data
        localStorage.setItem('token', data.token);
        localStorage.setItem('mmspg_token', data.token);
        localStorage.setItem('userId', data.merchantId);
        localStorage.setItem('merchantId', data.merchantId);
        localStorage.setItem('mmspg_merchant_id', data.merchantId);
        localStorage.setItem('userName', data.businessName);
        localStorage.setItem('userRole', 'MERCHANT');

        // 🔴 ဤနေရာတွင် Profile ပုံကိုပါ သိမ်းမည့်ကုဒ် ထပ်ထည့်ပါ
        // (Backend က ပို့ပေးမည့် ပုံ၏ variable အမည်ပေါ်မူတည်၍ data.avatar သို့မဟုတ် data.profileImage စသဖြင့် ပြင်ရေးနိုင်ပါသည်)
        if (data.avatar || data.profileImage || data.image) {
          localStorage.setItem('userAvatar', data.avatar || data.profileImage || data.image);
        }

        navigate('/merchant/dashboard');
      } else {
        
        // 🛡️ Staff / Admin Login Endpoint
        const response = await fetch('http://127.0.0.1:8004/api/v1/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email, password }),
        });

        const data = await response.json();
        console.log("Login Response Data: ", data);

        if (!response.ok) {
          throw new Error(data.message || 'Invalid staff credentials');
        }

        // Store Staff session data
        localStorage.setItem('token', data.token);
        localStorage.setItem('mmspg_token', data.token);
        localStorage.setItem('userId', data.staffId || data.id);
        localStorage.setItem('userName', data.fullName);
        localStorage.setItem('userRole', data.role);


        if (data.profileImage || data.avatar || data.image) {
          localStorage.setItem('userAvatar', data.profileImage || data.avatar || data.image);
        } else {
          localStorage.removeItem('userAvatar');
        }


        if (data.role === 'ADMIN') {
          navigate('/admin/dashboard');
        } else if (data.role === 'SUPPORT') {
          navigate('/support/dashboard');
        } else if (data.role === 'AUDITOR') {
          navigate('/auditor/dashboard');
        } else {
          navigate('/admin/dashboard');
        }
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred during login. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-slate-100 p-8 space-y-6">
        {/* Brand Header */}
        <div className="text-center">
          <h1 className="text-2xl font-black bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent tracking-tight">
            PayGateway
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Secure Payment Gateway Portal
          </p>
        </div>

        {/* Portal Role Tabs */}
        <div className="grid grid-cols-2 gap-2 rounded-xl bg-slate-100 p-1">
          <button
            type="button"
            onClick={() => handleTabChange('MERCHANT')}
            className={`flex items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-semibold transition-all ${
              portalType === 'MERCHANT'
                ? 'bg-white text-indigo-700 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Store className="h-4 w-4" />
            <span>Merchant</span>
          </button>

          <button
            type="button"
            onClick={() => handleTabChange('STAFF')}
            className={`flex items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-semibold transition-all ${
              portalType === 'STAFF'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ShieldCheck className="h-4 w-4" />
            <span>Staff / Admin</span>
          </button>
        </div>

        {/* Dynamic Context Header */}
        <div className="border-b border-slate-100 pb-3">
          <h2 className="text-lg font-bold text-slate-900">
            {portalType === 'MERCHANT' ? 'Merchant Portal Sign In' : 'Staff & Admin Sign In'}
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {portalType === 'MERCHANT'
              ? 'Access transaction reports, settlements, and payment tools'
              : 'Authorized bank & gateway operators only'}
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-500" />
            <span>{error}</span>
          </div>
        )}

        {/* Login Form */}
        <form className="space-y-4" onSubmit={handleLogin}>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all bg-slate-50/50 focus:bg-white"
                placeholder={portalType === 'MERCHANT' ? 'merchant@business.com' : 'staff@gateway.com'}
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all bg-slate-50/50 focus:bg-white"
                placeholder="••••••••"
                required
              />
            </div>
          </div>

          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 cursor-pointer text-slate-600">
              <input
                id="remember-me"
                type="checkbox"
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              />
              <label htmlFor="remember-me" className="ml-2 block text-sm text-slate-700">
                Remember me
              </label>
            </div>
            <div className="text-sm">
              {/* 🔴 href အစား onClick ဖြင့် navigate ကို အသုံးပြုထားပါသည် */}
              <a 
                href="#" 
                onClick={(e) => {
                  e.preventDefault(); // # ကြောင့် စာမျက်နှာခုန်ခြင်းကို တားပေးသည်
                  navigate('/forgot-password');
                }}
                className="font-medium text-blue-600 hover:text-blue-500 transition-colors cursor-pointer"
              >
                Forgot password?
              </a>
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={isLoading}
              className={`w-full flex justify-center items-center gap-2 py-2.5 px-4 rounded-xl shadow-sm text-sm font-semibold text-white transition-all disabled:opacity-60 ${
                portalType === 'MERCHANT'
                  ? 'bg-indigo-600 hover:bg-indigo-700'
                  : 'bg-slate-900 hover:bg-slate-800'
              }`}
            >
              <span>{isLoading ? 'Signing in...' : portalType === 'MERCHANT' ? 'Sign in to Merchant Portal' : 'Sign in as Staff'}</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </form>

        {/* Merchant Register Link */}
        {portalType === 'MERCHANT' ? (
          <div className="border-t border-slate-100 pt-4 text-center">
            <p className="text-xs text-slate-500">
              New merchant?{' '}
              <Link to="/register" className="font-semibold text-indigo-600 hover:underline">
                Apply for Merchant Account
              </Link>
            </p>
          </div>
        ) : (
          <div className="border-t border-slate-100 pt-4 text-center">
            <p className="text-xs text-slate-400">
              Internal system. Unauthorized access attempts are logged and monitored.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}