import { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Search, Plus, Edit, Trash2, Power, Shield, X, AlertCircle } from 'lucide-react';
import {
  getStaffUsers,
  createStaffUser,
  updateStaffUser,
  deleteStaffUser,
  updateStaffUserStatus
} from '../../services/adminManagementApi';

interface StaffUser {
  id: string;            
  username?: string;
  name: string;
  email: string;
  role: string;
  status: 'ACTIVE' | 'DISABLED';
  lastLoginAt: string | null; 
  createdAt?: string;
}

export default function StaffUsers() {
  const { t } = useTranslation();
  const userRole = (localStorage.getItem('userRole') || '').toUpperCase();

  if (userRole !== 'ADMIN') {
    const target = userRole === 'SUPPORT' 
      ? '/support/dashboard' 
      : userRole === 'AUDITOR' 
      ? '/auditor/dashboard' 
      : '/admin/dashboard';
    return <Navigate to={target} replace />;
  }

  const [users, setUsers] = useState<StaffUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<StaffUser | null>(null);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string>('');
  
  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    role: 'SUPPORT',
    password: '' 
  });

  const fetchUsers = async () => {
    try {
      const data = await getStaffUsers();
      const items = Array.isArray(data) ? data : (data.content || data.data || []);
      const sortedUsers = [...items].sort((a: any, b: any) => {
        const dateA = new Date(a.createdAt || 0).getTime();
        const dateB = new Date(b.createdAt || 0).getTime();
        return dateB - dateA;
      });
      setUsers(sortedUsers);
    } catch (error) {
      console.error('Error fetching staff users:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const validateAddStaff = () => {
    const errors: Record<string, string> = {};

    if (!newUser.name.trim()) {
      errors.name = 'Full name is required';
    } else if (newUser.name.trim().length < 2) {
      errors.name = 'Full name must be at least 2 characters';
    } else if (newUser.name.trim().length > 100) {
      errors.name = 'Full name must not exceed 100 characters';
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!newUser.email.trim()) {
      errors.email = 'Email is required';
    } else if (!emailRegex.test(newUser.email.trim())) {
      errors.email = 'Please enter a valid email address';
    }

    if (!newUser.password) {
      errors.password = 'Password is required';
    } else if (newUser.password.length < 6) {
      errors.password = 'Password must be at least 6 characters long';
    }

    if (!newUser.role) {
      errors.role = 'Role is required';
    } else if (!['SUPPORT', 'AUDITOR', 'ADMIN'].includes(newUser.role)) {
      errors.role = 'Invalid role selected';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleAddSubmit = async () => {
    setFormError('');
    if (!validateAddStaff()) {
      setFormError('Please resolve all validation errors before proceeding.');
      return;
    }

    try {
      await createStaffUser({
        name: newUser.name.trim(),
        email: newUser.email.trim(),
        role: newUser.role,
        password: newUser.password
      });
      setIsAddModalOpen(false);
      setNewUser({ name: '', email: '', role: 'SUPPORT', password: '' });
      setFieldErrors({});
      setFormError('');
      fetchUsers(); 

      window.dispatchEvent(new Event('refreshNotifications'));
      alert("Staff user added successfully!");
    } catch (error: any) {
      console.error('Error creating user:', error);
      const errMsg = error.response?.data?.error || error.response?.data?.message || error.message || 'Unknown error';
      if (errMsg.toLowerCase().includes('email') || errMsg.toLowerCase().includes('already exists')) {
        setFieldErrors(prev => ({ ...prev, email: errMsg }));
      }
      setFormError(`Failed to create user: ${errMsg}`);
    }
  };

  const openAddModal = () => {
    setNewUser({ name: '', email: '', role: 'SUPPORT', password: '' });
    setFieldErrors({});
    setFormError('');
    setIsAddModalOpen(true);
  };

  const closeAddModal = () => {
    setIsAddModalOpen(false);
    setFieldErrors({});
    setFormError('');
  };

  const openEditModal = (user: StaffUser) => {
    setEditingUser({ ...user });
    setIsEditModalOpen(true);
  };

  const handleEditSubmit = async () => {
    if (!editingUser) return;

    if (!editingUser.name.trim()) {
      alert("Full name is required.");
      return;
    }

    try {
      await updateStaffUser(editingUser.id, {
        fullName: editingUser.name.trim(), 
        email: editingUser.email.trim(),
        role: editingUser.role
      });

      setUsers(users.map(u => u.id === editingUser.id ? editingUser : u));
      setIsEditModalOpen(false);
      setEditingUser(null);
      window.dispatchEvent(new Event('refreshNotifications'));
      alert("User updated successfully!");
    } catch (error: any) {
      console.error('Error updating user:', error);
      alert(`Failed to update user: ${error.response?.data?.error || error.message || 'Unknown error'}`);
    }
  };

  const handleDeleteClick = async (id: string) => {
    if (!window.confirm("Are you sure you want to permanently delete this user?")) return;
    
    try {
      await deleteStaffUser(id);
      setUsers(users.filter(u => u.id !== id));
      window.dispatchEvent(new Event('refreshNotifications'));
      alert("User deleted successfully!");
    } catch (error) {
      console.error('Error deleting user:', error);
      alert("Failed to delete staff user. Please try again.");
    }
  };

  const toggleStatus = async (id: string) => {
    if (!window.confirm("Are you sure you want to change this user's status?")) return;

    try {
      await updateStaffUserStatus(id);
      setUsers(users.map(user => 
        user.id === id 
          ? { ...user, status: user.status === 'ACTIVE' ? 'DISABLED' : 'ACTIVE' } 
          : user
      ));
      window.dispatchEvent(new Event('refreshNotifications'));
      alert("User status updated successfully!");
    } catch (error) {
      console.error('Error toggling status:', error);
      alert("Failed to toggle status.");
    }
  };

  const filteredUsers = users.filter(user => 
    (user.name && user.name.toLowerCase().includes(searchTerm.toLowerCase())) || 
    (user.email && user.email.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="space-y-6 relative">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white">{t('staff.title')}</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{t('staff.subtitle')}</p>
        </div>
        <button 
          onClick={openAddModal}
          className="flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors shadow-sm"
        >
          <Plus className="h-4 w-4 mr-2" />
          {t('staff.addStaff')}
        </button>
      </div>

      <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 flex items-center">
        <div className="relative w-full max-w-md">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-slate-400" />
          </div>
          <input
            type="text"
            className="block w-full pl-10 pr-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 sm:text-sm transition-colors"
            placeholder={t('staff.searchPlaceholder')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-8 text-center text-slate-500 dark:text-slate-400">{t('staff.loading')}</div>
          ) : (
            <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
              <thead className="bg-slate-50 dark:bg-slate-900">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{t('staff.colStaff')}</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{t('staff.colRole')}</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{t('common.status')}</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Last Login</th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{t('common.actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-slate-50 dark:hover:bg-slate-750 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center text-blue-600 dark:text-blue-300 font-bold uppercase">
                          {user.name ? user.name.charAt(0) : '?'}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-slate-900 dark:text-white">{user.name}</div>
                          <div className="text-sm text-slate-500 dark:text-slate-400">{user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center text-sm text-slate-700 dark:text-slate-300">
                        <Shield className="h-4 w-4 text-slate-400 mr-1.5" />
                        {user.role}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        user.status === 'ACTIVE' 
                          ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300' 
                          : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300'
                      }`}>
                        {user.status === 'ACTIVE' ? t('common.active') : t('common.inactive')}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400">
                      {user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleString() : 'Never'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end space-x-2">
                        <button 
                          onClick={() => toggleStatus(user.id)}
                          className={`p-1.5 rounded-lg transition-colors ${
                            user.status === 'ACTIVE'
                              ? 'text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-900/30'
                              : 'text-green-500 hover:bg-green-50 dark:hover:bg-green-900/30'
                          }`}
                          title={user.status === 'ACTIVE' ? "Disable User" : "Enable User"}
                        >
                          <Power className="h-4 w-4" />
                        </button>
                        <button onClick={() => openEditModal(user)} className="p-1.5 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors" title={t('common.edit')}>
                          <Edit className="h-4 w-4" />
                        </button>
                        <button onClick={() => handleDeleteClick(user.id)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors" title={t('common.delete')}>
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredUsers.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-slate-500 dark:text-slate-400 text-sm">
                      {t('staff.noStaff')}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Add Staff Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl w-full max-w-md overflow-hidden border border-slate-200 dark:border-slate-700">
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
              <h2 className="text-lg font-bold text-slate-800 dark:text-white">{t('staff.modalAddTitle')}</h2>
              <button onClick={closeAddModal} className="text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            {formError && (
              <div className="mx-6 mt-4 p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg flex items-center gap-2 text-sm text-red-600 dark:text-red-400">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                <span>{formError}</span>
              </div>
            )}
            
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  {t('staff.fullName')} <span className="text-red-500">*</span>
                </label>
                <input 
                  type="text" 
                  value={newUser.name}
                  onChange={(e) => {
                    setNewUser({...newUser, name: e.target.value});
                    if (fieldErrors.name) setFieldErrors(prev => ({ ...prev, name: '' }));
                  }}
                  className={`w-full px-3 py-2 border rounded-lg bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white sm:text-sm focus:ring-2 outline-none ${
                    fieldErrors.name 
                      ? 'border-red-500 focus:ring-red-500' 
                      : 'border-slate-300 dark:border-slate-600 focus:ring-blue-500'
                  }`}
                  placeholder="e.g. John Doe"
                />
                {fieldErrors.name && (
                  <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3 flex-shrink-0" />
                    {fieldErrors.name}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  {t('staff.email')} <span className="text-red-500">*</span>
                </label>
                <input 
                  type="email" 
                  value={newUser.email}
                  onChange={(e) => {
                    setNewUser({...newUser, email: e.target.value});
                    if (fieldErrors.email) setFieldErrors(prev => ({ ...prev, email: '' }));
                  }}
                  className={`w-full px-3 py-2 border rounded-lg bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white sm:text-sm focus:ring-2 outline-none ${
                    fieldErrors.email 
                      ? 'border-red-500 focus:ring-red-500' 
                      : 'border-slate-300 dark:border-slate-600 focus:ring-blue-500'
                  }`}
                  placeholder="e.g. john@gateway.com"
                />
                {fieldErrors.email && (
                  <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3 flex-shrink-0" />
                    {fieldErrors.email}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  {t('staff.password')} <span className="text-red-500">*</span>
                </label>
                <input 
                  type="password" 
                  value={newUser.password}
                  onChange={(e) => {
                    setNewUser({...newUser, password: e.target.value});
                    if (fieldErrors.password) setFieldErrors(prev => ({ ...prev, password: '' }));
                  }}
                  className={`w-full px-3 py-2 border rounded-lg bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white sm:text-sm focus:ring-2 outline-none ${
                    fieldErrors.password 
                      ? 'border-red-500 focus:ring-red-500' 
                      : 'border-slate-300 dark:border-slate-600 focus:ring-blue-500'
                  }`}
                  placeholder="At least 6 characters"
                />
                {fieldErrors.password && (
                  <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3 flex-shrink-0" />
                    {fieldErrors.password}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  {t('staff.role')} <span className="text-red-500">*</span>
                </label>
                <select 
                  value={newUser.role}
                  onChange={(e) => {
                    setNewUser({...newUser, role: e.target.value});
                    if (fieldErrors.role) setFieldErrors(prev => ({ ...prev, role: '' }));
                  }}
                  className={`w-full px-3 py-2 border rounded-lg bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white sm:text-sm focus:ring-2 outline-none ${
                    fieldErrors.role 
                      ? 'border-red-500 focus:ring-red-500' 
                      : 'border-slate-300 dark:border-slate-600 focus:ring-blue-500'
                  }`}
                >
                  <option value="SUPPORT">SUPPORT</option>
                  <option value="AUDITOR">AUDITOR</option>
                  <option value="ADMIN">ADMIN</option>
                </select>
                {fieldErrors.role && (
                  <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3 flex-shrink-0" />
                    {fieldErrors.role}
                  </p>
                )}
              </div>
            </div>

            <div className="px-6 py-4 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-700 flex justify-end space-x-3">
              <button 
                onClick={closeAddModal}
                className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
              >
                {t('common.cancel')}
              </button>
              <button 
                onClick={handleAddSubmit}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
              >
                {t('staff.createStaff')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Staff Modal */}
      {isEditModalOpen && editingUser && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl w-full max-w-md overflow-hidden border border-slate-200 dark:border-slate-700">
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
              <h2 className="text-lg font-bold text-slate-800 dark:text-white">{t('staff.modalEditTitle')}</h2>
              <button onClick={() => setIsEditModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t('staff.fullName')}</label>
                <input 
                  type="text" 
                  value={editingUser.name}
                  onChange={(e) => setEditingUser({...editingUser, name: e.target.value})}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white sm:text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t('staff.role')}</label>
                <select 
                  value={editingUser.role}
                  onChange={(e) => setEditingUser({...editingUser, role: e.target.value})}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white sm:text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  <option value="SUPPORT">SUPPORT</option>
                  <option value="AUDITOR">AUDITOR</option>
                  <option value="ADMIN">ADMIN</option>
                </select>
              </div>
            </div>

            <div className="px-6 py-4 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-700 flex justify-end space-x-3">
              <button 
                onClick={() => setIsEditModalOpen(false)}
                className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
              >
                {t('common.cancel')}
              </button>
              <button 
                onClick={handleEditSubmit}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
              >
                {t('common.save')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}