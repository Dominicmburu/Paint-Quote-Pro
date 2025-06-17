import React, { useState, useEffect } from 'react';
import {
  Building,
  Search,
  Filter,
  MoreVertical,
  Edit,
  Trash2,
  Eye,
  Plus,
  Download,
  Users,
  FileText,
  Calendar,
  MapPin,
  Phone,
  Mail,
  Globe,
  AlertCircle,
  CheckCircle,
  XCircle
} from 'lucide-react';
import api from '../../services/api';

const CompanyManagement = () => {
  const [companies, setCompanies] = useState([]);
  const [filteredCompanies, setFilteredCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showCompanyModal, setShowCompanyModal] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [pagination, setPagination] = useState({
    page: 1,
    pages: 1,
    per_page: 20,
    total: 0
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    loadCompanies();
  }, [pagination.page]);

  useEffect(() => {
    filterCompanies();
  }, [companies, searchTerm, filterStatus]);

  const loadCompanies = async (page = 1) => {
    try {
      setLoading(true);
      setError('');

      const response = await api.get('/admin/companies', {
        params: {
          page: page,
          per_page: pagination.per_page
        }
      });

      if (response.data.companies) {
        setCompanies(response.data.companies);
        setPagination(response.data.pagination || {
          page: 1,
          pages: 1,
          per_page: 20,
          total: response.data.companies.length
        });
      } else {
        setError('Invalid response format from server');
      }
    } catch (error) {
      console.error('Failed to load companies:', error);
      setError(error.response?.data?.error || 'Failed to load companies');
    } finally {
      setLoading(false);
    }
  };

  const filterCompanies = () => {
    let filtered = companies;

    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(company =>
        company.name?.toLowerCase().includes(searchLower) ||
        company.email?.toLowerCase().includes(searchLower) ||
        company.address?.toLowerCase().includes(searchLower) ||
        (company.users && company.users.some(user =>
          user.first_name?.toLowerCase().includes(searchLower) ||
          user.last_name?.toLowerCase().includes(searchLower) ||
          user.email?.toLowerCase().includes(searchLower)
        ))
      );
    }

    if (filterStatus !== 'all') {
      filtered = filtered.filter(company => {
        const hasActiveUsers = company.users && company.users.some(user => user.is_active);
        return filterStatus === 'active' ? hasActiveUsers : !hasActiveUsers;
      });
    }

    setFilteredCompanies(filtered);
  };

  const handleCompanyAction = async (action, companyId) => {
    try {
      setActionLoading(true);
      setError('');

      let response;
      let message = '';

      switch (action) {
        case 'toggle_status':
          response = await api.post(`/admin/companies/${companyId}/toggle-status`);
          message = response.data.message || 'Company status updated successfully';
          break;
        case 'delete':
          if (window.confirm('Are you sure you want to delete this company? This action cannot be undone.')) {
            // Note: Your backend doesn't have a delete company endpoint
            // You may need to add this to your admin routes
            response = await api.delete(`/admin/companies/${companyId}`);
            message = 'Company deleted successfully';
          } else {
            return;
          }
          break;
        default:
          throw new Error('Unknown action');
      }

      setSuccess(message);
      setTimeout(() => setSuccess(''), 3000);
      loadCompanies(pagination.page);
    } catch (error) {
      console.error('Action failed:', error);
      setError(error.response?.data?.error || `Failed to ${action} company`);
      setTimeout(() => setError(''), 5000);
    } finally {
      setActionLoading(false);
    }
  };

  const exportCompanies = async () => {
    try {
      setActionLoading(true);
      const response = await api.get('/admin/users/export');

      if (response.data.csv_data) {
        // Create and download CSV file
        const blob = new Blob([response.data.csv_data], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `companies_export_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);

        setSuccess('Export completed successfully');
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (error) {
      console.error('Export failed:', error);
      setError(error.response?.data?.error || 'Export failed');
      setTimeout(() => setError(''), 5000);
    } finally {
      setActionLoading(false);
    }
  };

  const CompanyModal = ({ company, onClose }) => {
    const [editingCompany, setEditingCompany] = useState(company || {
      name: '',
      email: '',
      phone: '',
      website: '',
      address: '',
      preferred_paint_brand: 'Dulux',
      vat_number: '',
      vat_rate: 0.20
    });

    const handleSave = async () => {
      try {
        setActionLoading(true);
        setError('');

        if (company) {
          // Update existing company - you'll need to add this endpoint to your backend
          await api.put(`/admin/companies/${company.id}`, editingCompany);
          setSuccess('Company updated successfully');
        } else {
          // Create new company - you'll need to add this endpoint to your backend
          await api.post('/admin/companies', editingCompany);
          setSuccess('Company created successfully');
        }

        setTimeout(() => setSuccess(''), 3000);
        loadCompanies(pagination.page);
        onClose();
      } catch (error) {
        console.error('Save failed:', error);
        setError(error.response?.data?.error || 'Failed to save company');
        setTimeout(() => setError(''), 5000);
      } finally {
        setActionLoading(false);
      }
    };

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
          <h3 className="text-lg font-medium mb-4">
            {company ? 'Edit Company' : 'Create Company'}
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Company Name *</label>
              <input
                type="text"
                value={editingCompany.name}
                onChange={(e) => setEditingCompany({ ...editingCompany, name: e.target.value })}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Email *</label>
              <input
                type="email"
                value={editingCompany.email}
                onChange={(e) => setEditingCompany({ ...editingCompany, email: e.target.value })}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Phone</label>
              <input
                type="tel"
                value={editingCompany.phone || ''}
                onChange={(e) => setEditingCompany({ ...editingCompany, phone: e.target.value })}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Website</label>
              <input
                type="url"
                value={editingCompany.website || ''}
                onChange={(e) => setEditingCompany({ ...editingCompany, website: e.target.value })}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700">Address</label>
              <input
                type="text"
                value={editingCompany.address || ''}
                onChange={(e) => setEditingCompany({ ...editingCompany, address: e.target.value })}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Preferred Paint Brand</label>
              <select
                value={editingCompany.preferred_paint_brand || 'Dulux'}
                onChange={(e) => setEditingCompany({ ...editingCompany, preferred_paint_brand: e.target.value })}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="Dulux">Dulux</option>
                <option value="Farrow & Ball">Farrow & Ball</option>
                <option value="Benjamin Moore">Benjamin Moore</option>
                <option value="Sherwin Williams">Sherwin Williams</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">VAT Rate</label>
              <input
                type="number"
                step="0.01"
                min="0"
                max="1"
                value={editingCompany.vat_rate || 0.20}
                onChange={(e) => setEditingCompany({ ...editingCompany, vat_rate: parseFloat(e.target.value) })}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700">VAT Number</label>
              <input
                type="text"
                value={editingCompany.vat_number || ''}
                onChange={(e) => setEditingCompany({ ...editingCompany, vat_number: e.target.value })}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
          </div>

          <div className="flex justify-end space-x-3 mt-6">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
              disabled={actionLoading}
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={actionLoading || !editingCompany.name || !editingCompany.email}
              className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50"
            >
              {actionLoading ? 'Saving...' : (company ? 'Update' : 'Create')}
            </button>
          </div>
        </div>
      </div>
    );
  };

  const CompanyDetailsModal = ({ company, onClose }) => {
    if (!company) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-medium">Company Details</h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl">
              ×
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Company Info */}
            <div className="space-y-4">
              <h4 className="text-md font-medium text-purple-700">Company Information</h4>
              <div className="bg-gray-50 p-4 rounded-lg space-y-3">
                <div className="flex items-center">
                  <Building className="h-5 w-5 text-gray-400 mr-3" />
                  <div>
                    <p className="text-sm font-medium">{company.name}</p>
                    <p className="text-xs text-gray-500">Company Name</p>
                  </div>
                </div>

                {company.email && (
                  <div className="flex items-center">
                    <Mail className="h-5 w-5 text-gray-400 mr-3" />
                    <div>
                      <p className="text-sm font-medium">{company.email}</p>
                      <p className="text-xs text-gray-500">Email</p>
                    </div>
                  </div>
                )}

                {company.phone && (
                  <div className="flex items-center">
                    <Phone className="h-5 w-5 text-gray-400 mr-3" />
                    <div>
                      <p className="text-sm font-medium">{company.phone}</p>
                      <p className="text-xs text-gray-500">Phone</p>
                    </div>
                  </div>
                )}

                {company.website && (
                  <div className="flex items-center">
                    <Globe className="h-5 w-5 text-gray-400 mr-3" />
                    <div>
                      <p className="text-sm font-medium">{company.website}</p>
                      <p className="text-xs text-gray-500">Website</p>
                    </div>
                  </div>
                )}

                {company.address && (
                  <div className="flex items-center">
                    <MapPin className="h-5 w-5 text-gray-400 mr-3" />
                    <div>
                      <p className="text-sm font-medium">{company.address}</p>
                      <p className="text-xs text-gray-500">Address</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Statistics */}
            <div className="space-y-4">
              <h4 className="text-md font-medium text-purple-700">Statistics</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="flex items-center">
                    <Users className="h-6 w-6 text-blue-600" />
                    <div className="ml-3">
                      <p className="text-lg font-semibold text-gray-900">
                        {company.user_count || 0}
                      </p>
                      <p className="text-sm text-gray-600">Users</p>
                    </div>
                  </div>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <div className="flex items-center">
                    <FileText className="h-6 w-6 text-green-600" />
                    <div className="ml-3">
                      <p className="text-lg font-semibold text-gray-900">
                        {company.project_count || 0}
                      </p>
                      <p className="text-sm text-gray-600">Projects</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Subscription Info */}
              {company.subscription && (
                <div className="bg-purple-50 p-4 rounded-lg">
                  <h5 className="font-medium text-purple-700 mb-2">Subscription</h5>
                  <p className="text-sm">Plan: <span className="font-medium">{company.subscription.plan_name}</span></p>
                  <p className="text-sm">Status: <span className="font-medium">{company.subscription.status}</span></p>
                  <p className="text-sm">Billing: <span className="font-medium">{company.subscription.billing_cycle}</span></p>
                </div>
              )}
            </div>

            {/* Company Users */}
            <div className="lg:col-span-2 space-y-4">
              <h4 className="text-md font-medium text-purple-700">Company Users</h4>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {company.users && company.users.length > 0 ? (
                  company.users.map((user) => (
                    <div key={user.id} className="border border-gray-200 rounded-lg p-3">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center">
                          <div className="h-8 w-8 rounded-full bg-purple-600 flex items-center justify-center">
                            <span className="text-xs font-medium text-white">
                              {user.first_name?.[0] || ''}{user.last_name?.[0] || ''}
                            </span>
                          </div>
                          <div className="ml-3">
                            <p className="text-sm font-medium">{user.first_name} {user.last_name}</p>
                            <p className="text-xs text-gray-500">{user.email}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${user.role === 'admin' ? 'bg-yellow-100 text-yellow-800' :
                              user.role === 'super_admin' ? 'bg-red-100 text-red-800' :
                                'bg-gray-100 text-gray-800'
                            }`}>
                            {user.role}
                          </span>
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${user.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                            }`}>
                            {user.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 text-sm">No users found for this company</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const StatusIndicator = ({ company }) => {
    const hasActiveUsers = company.users && company.users.some(user => user.is_active);
    const hasUsers = company.users && company.users.length > 0;

    if (!hasUsers) {
      return (
        <span className="inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">
          <XCircle className="w-3 h-3 mr-1" />
          No Users
        </span>
      );
    }

    if (hasActiveUsers) {
      return (
        <span className="inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
          <CheckCircle className="w-3 h-3 mr-1" />
          Active
        </span>
      );
    }

    return (
      <span className="inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
        <XCircle className="w-3 h-3 mr-1" />
        Inactive
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
        <span className="ml-3 text-gray-600">Loading companies...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Alerts */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <AlertCircle className="h-5 w-5 text-red-400" />
            <div className="ml-3">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          </div>
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 rounded-md p-4">
          <div className="flex">
            <CheckCircle className="h-5 w-5 text-green-400" />
            <div className="ml-3">
              <p className="text-sm text-green-800">{success}</p>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-purple-700">Company Management</h1>
          <p className="text-gray-600">Manage company accounts and information</p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={exportCompanies}
            disabled={actionLoading}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
          >
            <Download className="h-4 w-4 mr-2" />
            {actionLoading ? 'Exporting...' : 'Export'}
          </button>
          <button
            onClick={() => setShowCompanyModal(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-purple-600 hover:bg-purple-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Company
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
            <div className="relative">
              <Search className="h-4 w-4 absolute left-3 top-3 text-gray-400" />
              <input
                type="text"
                placeholder="Search companies, users, or emails..."
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
          <div className="flex items-end">
            <button
              onClick={() => {
                setSearchTerm('');
                setFilterStatus('all');
              }}
              className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Companies Table */}
      <div className="bg-white shadow-sm rounded-lg border border-gray-200 overflow-hidden">
        {filteredCompanies.length === 0 ? (
          <div className="text-center py-12">
            <Building className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No companies found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm || filterStatus !== 'all'
                ? 'Try adjusting your search or filter criteria'
                : 'Get started by creating a new company'
              }
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Company
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contact
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Users
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Projects
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="relative px-6 py-3">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredCompanies.map((company) => (
                  <tr key={company.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-10 w-10 rounded-full bg-purple-600 flex items-center justify-center">
                          <Building className="h-5 w-5 text-white" />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{company.name}</div>
                          <div className="text-sm text-gray-500">{company.preferred_paint_brand || 'No brand set'}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{company.email}</div>
                      <div className="text-sm text-gray-500">{company.phone || 'No phone'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {company.created_at ? new Date(company.created_at).toLocaleDateString() : 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => {
                            setSelectedCompany(company);
                            setShowDetailsModal(true);
                          }}
                          className="text-blue-600 hover:text-blue-900"
                          title="View Details"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => {
                            setSelectedCompany(company);
                            setShowCompanyModal(true);
                          }}
                          className="text-purple-600 hover:text-purple-900"
                          title="Edit"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleCompanyAction('toggle_status', company.id)}
                          className="text-yellow-600 hover:text-yellow-900"
                          title="Toggle Status"
                          disabled={actionLoading}
                        >
                          {company.users && company.users.some(u => u.is_active) ? (
                            <XCircle className="h-4 w-4" />
                          ) : (
                            <CheckCircle className="h-4 w-4" />
                          )}
                        </button>
                        <button
                          onClick={() => handleCompanyAction('delete', company.id)}
                          className="text-red-600 hover:text-red-900"
                          title="Delete"
                          disabled={actionLoading}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6 rounded-lg border">
          <div className="flex-1 flex justify-between sm:hidden">
            <button
              onClick={() => loadCompanies(pagination.page - 1)}
              disabled={pagination.page <= 1}
              className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
            >
              Previous
            </button>
            <button
              onClick={() => loadCompanies(pagination.page + 1)}
              disabled={pagination.page >= pagination.pages}
              className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
            >
              Next
            </button>
          </div>
          <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700">
                Showing{' '}
                <span className="font-medium">
                  {(pagination.page - 1) * pagination.per_page + 1}
                </span>{' '}
                to{' '}
                <span className="font-medium">
                  {Math.min(pagination.page * pagination.per_page, pagination.total)}
                </span>{' '}
                of{' '}
                <span className="font-medium">{pagination.total}</span> results
              </p>
            </div>
            <div>
              <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                <button
                  onClick={() => loadCompanies(pagination.page - 1)}
                  disabled={pagination.page <= 1}
                  className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                >
                  Previous
                </button>

                {/* Page numbers */}
                {Array.from({ length: Math.min(5, pagination.pages) }, (_, i) => {
                  const pageNum = Math.max(1, Math.min(pagination.pages - 4, pagination.page - 2)) + i;
                  return pageNum <= pagination.pages ? (
                    <button
                      key={pageNum}
                      onClick={() => loadCompanies(pageNum)}
                      className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${pageNum === pagination.page
                          ? 'z-10 bg-purple-50 border-purple-500 text-purple-600'
                          : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                        }`}
                    >
                      {pageNum}
                    </button>
                  ) : null;
                })}

                <button
                  onClick={() => loadCompanies(pagination.page + 1)}
                  disabled={pagination.page >= pagination.pages}
                  className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                >
                  Next
                </button>
              </nav>
            </div>
          </div>
        </div>
      )}

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center">
            <Building className="h-8 w-8 text-blue-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Total Companies</p>
              <p className="text-lg font-semibold text-gray-900">{pagination.total}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center">
            <Users className="h-8 w-8 text-green-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Total Users</p>
              <p className="text-lg font-semibold text-gray-900">
                {companies.reduce((sum, company) => sum + (company.user_count || 0), 0)}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center">
            <FileText className="h-8 w-8 text-purple-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Total Projects</p>
              <p className="text-lg font-semibold text-gray-900">
                {companies.reduce((sum, company) => sum + (company.project_count || 0), 0)}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center">
            <CheckCircle className="h-8 w-8 text-yellow-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Active Companies</p>
              <p className="text-lg font-semibold text-gray-900">
                {companies.filter(c => c.users && c.users.some(u => u.is_active)).length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      {showCompanyModal && (
        <CompanyModal
          company={selectedCompany}
          onClose={() => {
            setShowCompanyModal(false);
            setSelectedCompany(null);
          }}
        />
      )}

      {showDetailsModal && selectedCompany && (
        <CompanyDetailsModal
          company={selectedCompany}
          onClose={() => {
            setShowDetailsModal(false);
            setSelectedCompany(null);
          }}
        />
      )}
    </div>
  );
};

export default CompanyManagement;