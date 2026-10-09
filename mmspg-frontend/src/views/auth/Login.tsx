import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Login() {
  const navigate = useNavigate();
  
  // 🔴 Form Data နှင့် Error များကို သိမ်းဆည်းရန် State များ
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // 🔴 Login နှိပ်သည့်အခါ အလုပ်လုပ်မည့် Function
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault(); // Form ပုံမှန် Submit လုပ်ခြင်းကို တားမည်
    setError('');
    setIsLoading(true);

    try {
      // Backend သို့ Data လှမ်းပို့၍ စစ်ဆေးမည်
      const response = await fetch('http://127.0.0.1:8004/api/v1/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();

      if (!response.ok) {
        // Backend မှ Error ပြန်လာပါက (ဥပမာ - BadCredentialsException)
        throw new Error(data.message || 'Invalid email or password');
      }
// Password မှန်ကန်ပါက Token နှင့် User Data ကို LocalStorage တွင် သိမ်းမည်
      localStorage.setItem('token', data.token);
      localStorage.setItem('userId', data.staffId || data.id); 
      localStorage.setItem('userName', data.fullName);
      localStorage.setItem('userRole', data.role); 

      // 🔴 Role ပေါ်မူတည်၍ သွားရမည့် Dashboard လမ်းကြောင်းကို ခွဲခြားမည်
      if (data.role === 'ADMIN') {
        navigate('/admin/dashboard');
      } else if (data.role === 'SUPPORT') {
        navigate('/support/dashboard');
      } else if (data.role === 'AUDITOR') {
        navigate('/auditor/dashboard'); // Auditor အတွက် လမ်းကြောင်း
      } else {
        navigate('/admin/dashboard'); // မူလ Fallback လမ်းကြောင်း
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
        <div className="text-center">
          <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            Sign in to your account
          </h2>
          <p className="mt-2 text-sm text-slate-500">
            Welcome back to PayGateway
          </p>
        </div>

        {/* 🔴 Error တက်ပါက ပြသရန်နေရာ */}
        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-4 rounded">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {/* 🔴 Form တွင် onSubmit ကို handleLogin နှင့် ချိတ်ဆက်ထားသည် */}
        <form className="space-y-4" onSubmit={handleLogin}>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Email address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all bg-slate-50 focus:bg-white"
              placeholder="you@example.com"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all bg-slate-50 focus:bg-white"
              placeholder="••••••••"
              required
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <input
                id="remember-me"
                type="checkbox"
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="remember-me" className="ml-2 block text-sm text-slate-700">
                Remember me
              </label>
            </div>
            <div className="text-sm">
              <a href="#" className="font-medium text-blue-600 hover:text-blue-500 transition-colors">
                Forgot password?
              </a>
            </div>
          </div>

          <div className="pt-4">
            {/* 🔴 Button type ကို 'submit' သို့ ပြောင်းထားသည် */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center items-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors disabled:bg-blue-400"
            >
              {isLoading ? 'Signing in...' : 'Sign in as Admin'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}