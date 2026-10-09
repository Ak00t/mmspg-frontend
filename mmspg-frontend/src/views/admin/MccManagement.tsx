import { useState, useEffect } from 'react';
import { Search, Plus, Tag, Edit, Trash2, X } from 'lucide-react';

interface MccCode {
  id: number; 
  mccCode: string;
  mccName: string;
  description: string | null;
  status: string;
  createdAt: string;
}

export default function MccConfiguration() {
  const [mccCodes, setMccCodes] = useState<MccCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Edit Modal အတွက် State များ
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingMcc, setEditingMcc] = useState<MccCode | null>(null);

  // 🔴 Add Modal အတွက် State အသစ်များ
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newMcc, setNewMcc] = useState({ mccCode: '', mccName: '', description: '' });

  useEffect(() => {
    fetchMccCodes();
  }, []);

  const fetchMccCodes = async () => {
    const token = localStorage.getItem('token'); 
    
    if (!token) {
        console.error("No token found. Please login.");
        setLoading(false);
        return; 
    }

    try {
      const response = await fetch('http://127.0.0.1:8004/api/v1/admin/mcc', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        }
      });

      if (response.status === 401 || response.status === 403) {
         console.error("Unauthorized! Please login again.");
         throw new Error('Unauthorized');
      }
      if (!response.ok) throw new Error('Network response was not ok');
      
      const data = await response.json();
      setMccCodes(data);
    } catch (error) {
      console.error('Error fetching MCC codes:', error);
    } finally {
      setLoading(false);
    }
  };

  // 🔴 ၁။ Add အသစ်လုပ်မည့် Function
  const handleAddSubmit = async () => {
    if (!newMcc.mccCode || !newMcc.mccName) {
      alert("MCC Code and Category Name are required.");
      return;
    }

    const token = localStorage.getItem('token');
    
    try {
      const response = await fetch('http://127.0.0.1:8004/api/v1/admin/mcc', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(newMcc)
      });

      if (response.ok) {
        const createdMcc = await response.json();
        // UI သို့ Data အသစ်ကို ချက်ချင်းပေါင်းထည့်မည်
        setMccCodes([...mccCodes, createdMcc]);
        // Modal ကို ပိတ်ပြီး Form ကို Reset ပြန်လုပ်မည်
        setIsAddModalOpen(false);
        setNewMcc({ mccCode: '', mccName: '', description: '' });
      } else {
        alert('Failed to add new MCC.');
      }
    } catch (error) {
      console.error('Error adding MCC:', error);
    }
  };

  const openEditModal = (mcc: MccCode) => {
    setEditingMcc({ ...mcc });
    setIsEditModalOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!editingMcc) return;
    const token = localStorage.getItem('token');

    try {
      const response = await fetch(`http://127.0.0.1:8004/api/v1/admin/mcc/${editingMcc.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          mccCode: editingMcc.mccCode,
          mccName: editingMcc.mccName,
          description: editingMcc.description
        })
      });

      if (response.ok) {
        setMccCodes(mccCodes.map(m => m.id === editingMcc.id ? editingMcc : m));
        setIsEditModalOpen(false);
        setEditingMcc(null);
      } else {
        alert('Failed to update MCC details.');
      }
    } catch (error) {
      console.error('Error updating MCC:', error);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this MCC code?')) return;
    
    const token = localStorage.getItem('token');
    
    try {
      const response = await fetch(`http://127.0.0.1:8004/api/v1/admin/mcc/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        setMccCodes(mccCodes.filter(m => m.id !== id));
      } else {
        alert('Failed to delete MCC code.');
      }
    } catch (error) {
      console.error('Error deleting MCC:', error);
    }
  };

  const filteredMccCodes = mccCodes.filter(mcc => 
    (mcc.mccCode && mcc.mccCode.toLowerCase().includes(searchTerm.toLowerCase())) || 
    (mcc.mccName && mcc.mccName.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="space-y-6 relative">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">MCC Configuration</h1>
          <p className="text-sm text-slate-500 mt-1">Manage merchant category codes here.</p>
        </div>
        {/* 🔴 ၂။ Add MCC ခလုတ်တွင် Modal ပွင့်ရန် ချိတ်ဆက်ထားပါသည် */}
        <button 
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors shadow-sm">
          <Plus className="h-4 w-4 mr-2" />
          Add MCC
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
            placeholder="Search by MCC code or name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-8 text-center text-slate-500">Loading MCC codes...</div>
          ) : (
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">MCC Code & Name</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Description</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-200">
                {filteredMccCodes.map((mcc, index) => (
                 <tr key={mcc.id || index} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
                          <Tag className="h-5 w-5" />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-bold text-slate-900">{mcc.mccCode}</div>
                          <div className="text-sm text-slate-500">{mcc.mccName}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-slate-900">{mcc.description || '-'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        mcc.status === 'ACTIVE' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {mcc.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end space-x-2">
                        <button 
                          onClick={() => openEditModal(mcc)}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Edit">
                          <Edit className="h-4 w-4" />
                        </button>
                        <button 
                          onClick={() => handleDelete(mcc.id)}
                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Delete">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredMccCodes.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-6 py-8 text-center text-slate-500 text-sm">
                      No MCC codes found matching your search.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* 🔴 ၃။ Add New MCC Modal (ပုံထဲက Design အတိုင်း) */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center">
              <h2 className="text-lg font-bold text-slate-800">Add New MCC</h2>
              <button 
                onClick={() => {
                  setIsAddModalOpen(false);
                  setNewMcc({ mccCode: '', mccName: '', description: '' });
                }} 
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">MCC Code (4 digits)</label>
                <input 
                  type="text" 
                  value={newMcc.mccCode} 
                  onChange={(e) => setNewMcc({...newMcc, mccCode: e.target.value})}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="e.g. 5814"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Category Name</label>
                <input 
                  type="text" 
                  value={newMcc.mccName} 
                  onChange={(e) => setNewMcc({...newMcc, mccName: e.target.value})}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="e.g. Fast Food Restaurants"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                <textarea 
                  rows={2}
                  value={newMcc.description} 
                  onChange={(e) => setNewMcc({...newMcc, description: e.target.value})}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="Optional details..."
                />
              </div>
            </div>

            <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex justify-end space-x-3">
              <button 
                onClick={() => {
                  setIsAddModalOpen(false);
                  setNewMcc({ mccCode: '', mccName: '', description: '' });
                }}
                className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleAddSubmit}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit MCC Modal (ယခင်အတိုင်း) */}
      {isEditModalOpen && editingMcc && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center">
              <h2 className="text-lg font-bold text-slate-800">Edit MCC</h2>
              <button onClick={() => setIsEditModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">MCC Code (4 digits)</label>
                <input 
                  type="text" 
                  value={editingMcc.mccCode} 
                  onChange={(e) => setEditingMcc({...editingMcc, mccCode: e.target.value})}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Category Name</label>
                <input 
                  type="text" 
                  value={editingMcc.mccName} 
                  onChange={(e) => setEditingMcc({...editingMcc, mccName: e.target.value})}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                <textarea 
                  rows={2}
                  value={editingMcc.description || ''} 
                  onChange={(e) => setEditingMcc({...editingMcc, description: e.target.value})}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
              </div>
            </div>

            <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex justify-end space-x-3">
              <button 
                onClick={() => setIsEditModalOpen(false)}
                className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleSaveEdit}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}