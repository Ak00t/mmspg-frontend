import { useState, useEffect } from 'react';
import { Search, Plus, Edit, Trash2, Power, Shield } from 'lucide-react';

// ၁။ Spring Boot မှ ပြန်ပို့မည့် JSON (camelCase) အတိုင်း Interface ကို ပြင်ဆင်ခြင်း
interface StaffUser {
  staffId: string;       // Spring Boot မှ ဤအတိုင်းလာပါမည်
  username?: string;
  fullName: string;      // full_name အစား fullName
  email: string;
  role: string;
  status: 'ACTIVE' | 'DISABLED';
  lastLoginAt: string | null; // last_login_at အစား lastLoginAt
}

export default function StaffUsers() {
  const [users, setUsers] = useState<StaffUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // ၂။ Backend Controller ၏ လမ်းကြောင်းအမှန်သို့ ချိတ်ဆက်ခြင်း
 useEffect(() => {
    // Port 8080 အစား 8004 သို့ ပြောင်းထားပါသည်
    fetch('http://127.0.0.1:8004/api/v1/admin/staff/list')
      .then((response) => response.json())
      .then((data) => {
        setUsers(data);
        setLoading(false);
      })
      .catch((error) => {
        console.error('Error fetching staff users:', error);
        setLoading(false);
      });
  }, []);
  const toggleStatus = (id: string) => {
    // ယာယီ UI အပြောင်းအလဲ
    setUsers(users.map(user => 
      user.staffId === id 
        ? { ...user, status: user.status === 'ACTIVE' ? 'DISABLED' : 'ACTIVE' } 
        : user
    ));
  };

  // ၃။ ရှာဖွေရာတွင် fullName ကို အသုံးပြုခြင်း
  const filteredUsers = users.filter(user => 
    (user.fullName && user.fullName.toLowerCase().includes(searchTerm.toLowerCase())) || 
    (user.email && user.email.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Staff Users</h1>
          <p className="text-sm text-slate-500 mt-1">Manage admin access and roles</p>
        </div>
        <button className="flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors shadow-sm">
          <Plus className="h-4 w-4 mr-2" />
          Add Staff User
        </button>
      </div>

      {/* Search Bar */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex items-center">
        <div className="relative w-full max-w-md">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-slate-400" />
          </div>
          <input
            type="text"
            className="block w-full pl-10 pr-3 py-2 border border-slate-200 rounded-lg leading-5 bg-slate-50 placeholder-slate-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent sm:text-sm transition-colors"
            placeholder="Search staff by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-8 text-center text-slate-500">Loading staff data...</div>
          ) : (
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">User</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Role</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Last Login</th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-200">
                {filteredUsers.map((user) => (
                  <tr key={user.staffId} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold uppercase">
                          {user.fullName ? user.fullName.charAt(0) : '?'}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-slate-900">{user.fullName}</div>
                          <div className="text-sm text-slate-500">{user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center text-sm text-slate-700">
                        <Shield className="h-4 w-4 text-slate-400 mr-1.5" />
                        {user.role}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        user.status === 'ACTIVE' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {user.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                      {/* Spring Boot မှလာသော နေ့စွဲပုံစံကို လိုအပ်သလို Format လုပ်နိုင်ပါသည် */}
                      {user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleString() : 'Never'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end space-x-2">
                        <button 
                          onClick={() => toggleStatus(user.staffId)}
                          className={`p-1.5 rounded-lg transition-colors ${
                            user.status === 'ACTIVE'
                              ? 'text-amber-500 hover:bg-amber-50'
                              : 'text-green-500 hover:bg-green-50'
                          }`}
                          title={user.status === 'ACTIVE' ? "Disable User" : "Enable User"}
                        >
                          <Power className="h-4 w-4" />
                        </button>
                        <button className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Edit">
                          <Edit className="h-4 w-4" />
                        </button>
                        <button className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Delete">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredUsers.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-slate-500 text-sm">
                      No staff users found matching your search.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}