import { useState, useEffect } from 'react';
import { Search, Plus, Monitor, Edit, Trash2 } from 'lucide-react';

// ⚠️ အရေးကြီးသည် - ဤ Interface ရှိ နာမည်များသည် သင်၏ Java Backend မှ 
// TerminalResponseDto.java အထဲတွင် ရေးထားသော Variable အမည်များနှင့် တစ်ပုံစံတည်း တူညီရပါမည်။
interface Terminal {
  id: string; // သို့မဟုတ် terminalId (သင့် DTO ထဲကအတိုင်း ပြင်ပါ)
  terminalCode: string;
  merchantName: string;
  branchName: string | null;
  status: string; 
  createdAt: string;
}

export default function AdminTerminals() {
  const [terminals, setTerminals] = useState<Terminal[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('token'); 
    
    // 💡 အကြံပြုချက် - Token မရှိပါက API လှမ်းမခေါ်ဘဲ ချက်ချင်း ရပ်ပစ်ရန် (သို့) Login Page သို့ ပို့ရန်
    if (!token) {
        console.error("No token found. Redirecting to login...");
        setLoading(false);
        // window.location.href = '/login'; // Login Page သို့ ပို့ရန်
        return; 
    }

    console.log("Token sent:", token);

    fetch('http://127.0.0.1:8004/api/v1/admin/terminals', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}` 
      }
    })
      .then((response) => {
        // Token သက်တမ်းကုန်သွားလျှင် သို့မဟုတ် မမှန်ကန်လျှင် 401/403 Error ပြန်လာပါမည်
        if (response.status === 401 || response.status === 403) {
           console.error("Unauthorized! Please login again.");
           // လိုအပ်ပါက Login စာမျက်နှာသို့ Redirect ပြန်လုပ်ပေးနိုင်ပါသည် (ဥပမာ - window.location.href = '/login';)
           throw new Error('Unauthorized');
        }
        if (!response.ok) throw new Error('Network response was not ok');
        return response.json();
      })
      .then((data) => {
        setTerminals(data);
        setLoading(false);
      })
      .catch((error) => {
        console.error('Error fetching terminals:', error);
        setLoading(false);
      });
  }, []);

  const filteredTerminals = terminals.filter(terminal => 
    (terminal.terminalCode && terminal.terminalCode.toLowerCase().includes(searchTerm.toLowerCase())) || 
    (terminal.merchantName && terminal.merchantName.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Terminal Management</h1>
          <p className="text-sm text-slate-500 mt-1">Manage and monitor POS terminals here.</p>
        </div>
        <button className="flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors shadow-sm">
          <Plus className="h-4 w-4 mr-2" />
          Add Terminal
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
            placeholder="Search by terminal code or merchant..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-8 text-center text-slate-500">Loading terminal data...</div>
          ) : (
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Terminal Info</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Merchant / Branch</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-200">
                {filteredTerminals.map((terminal, index) => (
                  // ID မပါလာပါက index ကို key အဖြစ် ယာယီသုံးနိုင်ပါသည်
                  <tr key={terminal.id || index} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 rounded-lg bg-slate-100 flex items-center justify-center text-slate-600">
                          <Monitor className="h-5 w-5" />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-bold text-slate-900">{terminal.terminalCode}</div>
                          <div className="text-sm text-slate-500">{new Date(terminal.createdAt).toLocaleDateString()}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-slate-900">{terminal.merchantName}</div>
                      <div className="text-sm text-slate-500">{terminal.branchName || 'Head Office'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        terminal.status === 'ACTIVE' || terminal.status === 'ONLINE'
                          ? 'bg-green-100 text-green-800' 
                          : terminal.status === 'MAINTENANCE'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {terminal.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end space-x-2">
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
                {filteredTerminals.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-6 py-8 text-center text-slate-500 text-sm">
                      No terminals found matching your search.
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