import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Search, 
  Filter, 
  MoreVertical, 
  Edit, 
  Trash2, 
  Mail, 
  Eye, 
  Plus,
  Download,
  UserCheck,
  UserX,
  Calendar,
  AlertCircle,
  Building,
  Shield
} from 'lucide-react';
import api from '../../services/api';
import Loading from '../common/Loading';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterRole, setFilterRole] = useState('all');
  const [filterCompany, setFilterCompany] = useState('all');
  const [showUserModal, setShowUserModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showUserDetails, setShowUserDetails] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    loadUsers();
    loadCompanies();
  }, []);

  useEffect(() => {
    filterUsers();
  }, [users, searchTerm, filterStatus, filterRole, filterCompany]);


  console.log('users:',users, 'filter:', filteredUsers, 'companies:', companies);

  const loadUsers = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Based on your backend, we need to get users from companies endpoint or create a users endpoint
      const response = await api.get('/admin/companies');
      
      // Extract users from companies response
      let allUsers = [];
      response.data.companies.forEach(company => {
        if (company.users && company.users.length > 0) {
          company.users.forEach(user => {
            allUsers.push({
              ...user,
              company_name: company.name,
              company_id: company.id
            });
          });
        }
      });
      
      setUsers(allUsers);
    } catch (error) {
      console.error('Failed to load users:', error);
      setError('Failed to load users. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const loadCompanies = async () => {
    try {
      const response = await api.get('/admin/companies');
      setCompanies(response.data.companies || []);
    } catch (error) {
      console.error('Failed to load companies:', error);
    }
  };

  const filterUsers = () => {
    let filtered = users;

    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(user => 
        (user.first_name?.toLowerCase().includes(searchLower)) ||
        (user.last_name?.toLowerCase().includes(searchLower)) ||
        (user.email?.toLowerCase().includes(searchLower)) ||
        (user.company_name?.toLowerCase().includes(searchLower))
      );
    }

    if (filterStatus !== 'all') {
      filtered = filtered.filter(user => {
        if (filterStatus === 'active') return user.is_active === true;
        if (filterStatus === 'inactive') return user.is_active === false;
        return true;
      });
    }

    if (filterRole !== 'all') {
      filtered = filtered.filter(user => user.role === filterRole);
    }

    if (filterCompany !== 'all') {
      filtered = filtered.filter(user => user.company_id?.toString() === filterCompany);
    }

    setFilteredUsers(filtered);
  };

  const handleUserAction = async (action, userId, data = {}) => {
    try {
      setActionLoading(true);
      setError('');
      setSuccess('');

      let response;
      switch (action) {
        case 'activate':
          // Since backend doesn't have specific activate endpoint, we'll update user status
          response = await api.put(`/admin/users/${userId}`, { is_active: true });
          setSuccess('User activated successfully');
          break;
        case 'deactivate':
          response = await api.put(`/admin/users/${userId}`, { is_active: false });
          setSuccess('User deactivated successfully');
          break;
        case 'delete':
          if (window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
            response = await api.delete(`/admin/users/${userId}`);
            setSuccess('User deleted successfully');
          } else {
            return;
          }
          break;
        case 'update_role':
          response = await api.put(`/admin/users/${userId}`, { role: data.role });
          setSuccess('User role updated successfully');
          break;
        case 'send_email':
          // This would need to be implemented in backend
          response = await api.post(`/admin/users/${userId}/send-notification`, data);
          setSuccess('Email sent successfully');
          break;
        default:
          throw new Error('Unknown action');
      }

      // Reload users after successful action
      await loadUsers();
      
    } catch (error) {
      console.error('Action failed:', error);
      setError(error.response?.data?.error || `Failed to ${action} user`);
    } finally {
      setActionLoading(false);
    }
  };

  const exportUsers = async () => {
    try {
      const response = await api.get('/admin/users/export', {
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `users_export_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      setSuccess('Users exported successfully');
    } catch (error) {
      console.error('Export failed:', error);
      setError('Failed to export users');
    }
  };

  const UserModal = ({ user, onClose }) => {
    const [editingUser, setEditingUser] = useState(user || {
      first_name: '',
      last_name: '',
      email: '',
      phone: '',
      role: 'user',
      is_active: true,
      company_id: ''
    });
    const [saving, setSaving] = useState(false);
    const [modalError, setModalError] = useState('');

    const handleSave = async () => {
      try {
        setSaving(true);
        setModalError('');

        // Validate required fields
        if (!editingUser.first_name || !editingUser.last_name || !editingUser.email) {
          setModalError('First name, last name, and email are required');
          return;
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(editingUser.email)) {
          setModalError('Please enter a valid email address');
          return;
        }

        if (user) {
          // Update existing user
          await api.put(`/admin/users/${user.id}`, editingUser);
          setSuccess('User updated successfully');
        } else {
          // Create new user
          await api.post('/admin/users', editingUser);
          setSuccess('User created successfully');
        }
        
        await loadUsers();
        onClose();
      } catch (error) {
        console.error('Save failed:', error);
        setModalError(error.response?.data?.error || 'Failed to save user');
      } finally {
        setSaving(false);
      }
    };

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
          <h3 className="text-lg font-medium mb-4">
            {user ? 'Edit User' : 'Create New User'}
          </h3>
          
          {modalError && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-600">{modalError}</p>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">First Name *</label>
              <input
                type="text"
                value={editingUser.first_name}
                onChange={(e) => setEditingUser({...editingUser, first_name: e.target.value})}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="Enter first name"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">Last Name *</label>
              <input
                type="text"
                value={editingUser.last_name}
                onChange={(e) => setEditingUser({...editingUser, last_name: e.target.value})}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="Enter last name"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">Email *</label>
              <input
                type="email"
                value={editingUser.email}
                onChange={(e) => setEditingUser({...editingUser, email: e.target.value})}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="Enter email address"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">Phone</label>
              <input
                type="tel"
                value={editingUser.phone || ''}
                onChange={(e) => setEditingUser({...editingUser, phone: e.target.value})}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="Enter phone number"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">Company</label>
              <select
                value={editingUser.company_id || ''}
                onChange={(e) => setEditingUser({...editingUser, company_id: e.target.value})}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="">Select Company</option>
                {companies.map(company => (
                  <option key={company.id} value={company.id}>
                    {company.name}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">Role</label>
              <select
                value={editingUser.role}
                onChange={(e) => setEditingUser({...editingUser, role: e.target.value})}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="user">User</option>
                <option value="admin">Admin</option>
                <option value="super_admin">Super Admin</option>
              </select>
            </div>
            
            <div className="flex items-center">
              <input
                type="checkbox"
                checked={editingUser.is_active}
                onChange={(e) => setEditingUser({...editingUser, is_active: e.target.checked})}
                className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
              />
              <label className="ml-2 block text-sm text-gray-900">Active</label>
            </div>
          </div>
          
          <div className="flex justify-end space-x-3 mt-6">
            <button
              onClick={onClose}
              disabled={saving}
              className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50"
            >
              {saving ? 'Saving...' : (user ? 'Update' : 'Create')}
            </button>
          </div>
        </div>
      </div>
    );
  };

  const UserDetailsModal = ({ user, onClose }) => {
    if (!user) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
          <div className="flex justify-between items-start mb-6">
            <h3 className="text-lg font-medium">User Details</h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              ×
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h4 className="font-medium text-purple-700">Personal Information</h4>
              <div className="bg-gray-50 p-4 rounded-lg space-y-3">
                <div>
                  <span className="text-sm text-gray-600">Name:</span>
                  <p className="font-medium">{user.first_name} {user.last_name}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-600">Email:</span>
                  <p className="font-medium">{user.email}</p>
                </div>
                {user.phone && (
                  <div>
                    <span className="text-sm text-gray-600">Phone:</span>
                    <p className="font-medium">{user.phone}</p>
                  </div>
                )}
                <div>
                  <span className="text-sm text-gray-600">Role:</span>
                  <span className={`ml-2 inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    user.role === 'super_admin' ? 'bg-red-100 text-red-800' :
                    user.role === 'admin' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {user.role?.replace('_', ' ').toUpperCase()}
                  </span>
                </div>
                <div>
                  <span className="text-sm text-gray-600">Status:</span>
                  <span className={`ml-2 inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    user.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {user.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="font-medium text-purple-700">Account Information</h4>
              <div className="bg-gray-50 p-4 rounded-lg space-y-3">
                <div>
                  <span className="text-sm text-gray-600">Company:</span>
                  <p className="font-medium">{user.company_name || 'No Company'}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-600">Created:</span>
                  <p className="font-medium">
                    {user.created_at ? new Date(user.created_at).toLocaleDateString() : 'Unknown'}
                  </p>
                </div>
                <div>
                  <span className="text-sm text-gray-600">Last Login:</span>
                  <p className="font-medium">
                    {user.last_login ? new Date(user.last_login).toLocaleDateString() : 'Never'}
                  </p>
                </div>
                <div>
                  <span className="text-sm text-gray-600">Updated:</span>
                  <p className="font-medium">
                    {user.updated_at ? new Date(user.updated_at).toLocaleDateString() : 'Never'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return <Loading message="Loading users..." />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-purple-700">User Management</h1>
          <p className="text-gray-600">Manage user accounts and permissions</p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={exportUsers}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            <Download className="h-4 w-4 mr-2" />
            Export
          </button>
          <button
            onClick={() => {
              setSelectedUser(null);
              setShowUserModal(true);
            }}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-purple-600 hover:bg-purple-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add User
          </button>
        </div>
      </div>

      {/* Status Messages */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <AlertCircle className="h-5 w-5 text-red-400" />
            <div className="ml-3">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          </div>
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 rounded-md p-4">
          <div className="flex">
            <UserCheck className="h-5 w-5 text-green-400" />
            <div className="ml-3">
              <p className="text-sm text-green-600">{success}</p>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
            <div className="relative">
              <Search className="h-4 w-4 absolute left-3 top-3 text-gray-400" />
              <input
                type="text"
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Role</label>
            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="all">All Roles</option>
              <option value="user">User</option>
              <option value="admin">Admin</option>
              <option value="super_admin">Super Admin</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Company</label>
            <select
              value={filterCompany}
              onChange={(e) => setFilterCompany(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="all">All Companies</option>
              {companies.map(company => (
                <option key={company.id} value={company.id.toString()}>
                  {company.name}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-end">
            <button
              onClick={() => {
                setSearchTerm('');
                setFilterStatus('all');
                setFilterRole('all');
                setFilterCompany('all');
              }}
              className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white shadow-sm rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Company
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Joined
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Last Login
                </th>
                <th className="relative px-6 py-3">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-12 text-center">
                    <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">No users found matching your filters.</p>
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-10 w-10 rounded-full bg-purple-600 flex items-center justify-center">
                          <span className="text-sm font-medium text-white">
                            {user.first_name?.[0]}{user.last_name?.[0]}
                          </span>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {user.first_name} {user.last_name}
                          </div>
                          <div className="text-sm text-gray-500">{user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <Building className="h-4 w-4 text-gray-400 mr-2" />
                        <span className="text-sm text-gray-900">{user.company_name || 'No Company'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        user.role === 'super_admin' ? 'bg-red-100 text-red-800' :
                        user.role === 'admin' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {user.role?.replace('_', ' ').toUpperCase() || 'USER'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        user.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {user.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {user.created_at ? new Date(user.created_at).toLocaleDateString() : 'Unknown'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {user.last_login ? new Date(user.last_login).toLocaleDateString() : 'Never'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => {
                            setSelectedUser(user);
                            setShowUserDetails(true);
                          }}
                          className="text-blue-600 hover:text-blue-900"
                          title="View Details"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => {
                            setSelectedUser(user);
                            setShowUserModal(true);
                          }}
                          className="text-purple-600 hover:text-purple-900"
                          title="Edit"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleUserAction(user.is_active ? 'deactivate' : 'activate', user.id)}
                          className={user.is_active ? 'text-red-600 hover:text-red-900' : 'text-green-600 hover:text-green-900'}
                          title={user.is_active ? 'Deactivate' : 'Activate'}
                          disabled={actionLoading}
                        >
                          {user.is_active ? <UserX className="h-4 w-4" /> : <UserCheck className="h-4 w-4" />}
                        </button>
                        <button
                          onClick={() => handleUserAction('send_email', user.id, { type: 'notification' })}
                          className="text-blue-600 hover:text-blue-900"
                          title="Send Email"
                          disabled={actionLoading}
                        >
                          <Mail className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center">
            <Users className="h-8 w-8 text-blue-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Total Users</p>
              <p className="text-lg font-semibold text-gray-900">{users.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center">
            <UserCheck className="h-8 w-8 text-green-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Active Users</p>
              <p className="text-lg font-semibold text-gray-900">
                {users.filter(u => u.is_active).length}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center">
            <UserX className="h-8 w-8 text-red-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Inactive Users</p>
              <p className="text-lg font-semibold text-gray-900">
                {users.filter(u => !u.is_active).length}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center">
            <Shield className="h-8 w-8 text-purple-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Admin Users</p>
              <p className="text-lg font-semibold text-gray-900">
                {users.filter(u => u.role === 'admin' || u.role === 'super_admin').length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      {showUserModal && (
        <UserModal
          user={selectedUser}
          onClose={() => {
            setShowUserModal(false);
            setSelectedUser(null);
            setError('');
            setSuccess('');
          }}
        />
      )}

      {showUserDetails && selectedUser && (
        <UserDetailsModal
          user={selectedUser}
          onClose={() => {
            setShowUserDetails(false);
            setSelectedUser(null);
          }}
        />
      )}
    </div>
  );
};

export default UserManagement;