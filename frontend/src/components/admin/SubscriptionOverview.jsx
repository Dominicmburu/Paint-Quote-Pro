import React, { useState, useEffect } from 'react';
import {
  CreditCard,
  Search,
  Filter,
  Calendar,
  DollarSign,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  CheckCircle,
  Clock,
  XCircle,
  Download,
  RefreshCw,
  Eye,
  Edit,
  MoreVertical,
  Users,
  Building
} from 'lucide-react';
import api from '../../services/api';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar } from 'recharts';

const SubscriptionOverview = () => {
  const [subscriptions, setSubscriptions] = useState([]);
  const [filteredSubscriptions, setFilteredSubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPlan, setFilterPlan] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [stats, setStats] = useState({});
  const [revenueData, setRevenueData] = useState([]);
  const [planDistribution, setPlanDistribution] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    pages: 1,
    per_page: 20,
    total: 0
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showRefundModal, setShowRefundModal] = useState(false);
  const [selectedSubscription, setSelectedSubscription] = useState(null);

  useEffect(() => {
    loadSubscriptionData();
  }, [pagination.page]);

  useEffect(() => {
    filterSubscriptions();
  }, [subscriptions, searchTerm, filterPlan, filterStatus]);

  const loadSubscriptionData = async (page = 1) => {
    try {
      setLoading(true);
      setError('');

      const [subscriptionsRes, statsRes, revenueRes] = await Promise.all([
        api.get('/admin/subscriptions', {
          params: {
            page: page,
            per_page: pagination.per_page,
            search: searchTerm,
            plan: filterPlan !== 'all' ? filterPlan : undefined,
            status: filterStatus !== 'all' ? filterStatus : undefined
          }
        }),
        api.get('/admin/subscriptions/stats'),
        api.get('/admin/subscriptions/revenue-data')
      ]);

      if (subscriptionsRes.data.subscriptions) {
        setSubscriptions(subscriptionsRes.data.subscriptions);
        setPagination(subscriptionsRes.data.pagination || {
          page: 1,
          pages: 1,
          per_page: 20,
          total: subscriptionsRes.data.subscriptions.length
        });
      }

      setStats(statsRes.data || {});
      setRevenueData(revenueRes.data.monthly_revenue || []);
      setPlanDistribution(revenueRes.data.plan_distribution || []);

    } catch (error) {
      console.error('Failed to load subscription data:', error);
      setError(error.response?.data?.error || 'Failed to load subscription data');
    } finally {
      setLoading(false);
    }
  };

  const filterSubscriptions = () => {
    let filtered = subscriptions;

    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(sub =>
        sub.company_name?.toLowerCase().includes(searchLower) ||
        sub.user_email?.toLowerCase().includes(searchLower) ||
        sub.company_email?.toLowerCase().includes(searchLower)
      );
    }

    if (filterPlan !== 'all') {
      filtered = filtered.filter(sub => sub.plan_name === filterPlan);
    }

    if (filterStatus !== 'all') {
      filtered = filtered.filter(sub => sub.status === filterStatus);
    }

    setFilteredSubscriptions(filtered);
  };

  const handleSubscriptionAction = async (action, subscriptionId, data = {}) => {
    try {
      setActionLoading(true);
      setError('');

      let response;
      let message = '';

      switch (action) {
        case 'cancel':
          if (window.confirm('Are you sure you want to cancel this subscription?')) {
            response = await api.put(`/admin/subscriptions/${subscriptionId}/cancel`);
            message = 'Subscription cancelled successfully';
          } else {
            return;
          }
          break;
        case 'reactivate':
          response = await api.put(`/admin/subscriptions/${subscriptionId}/reactivate`);
          message = 'Subscription reactivated successfully';
          break;
        case 'refund':
          response = await api.post(`/admin/subscriptions/${subscriptionId}/refund`, data);
          message = `Refund of £${(data.amount / 100).toFixed(2)} processed successfully`;
          break;
        case 'update':
          response = await api.put(`/admin/subscriptions/${subscriptionId}`, data);
          message = 'Subscription updated successfully';
          break;
        default:
          throw new Error('Unknown action');
      }

      setSuccess(message);
      setTimeout(() => setSuccess(''), 3000);
      loadSubscriptionData(pagination.page);
    } catch (error) {
      console.error('Action failed:', error);
      setError(error.response?.data?.error || `Failed to ${action} subscription`);
      setTimeout(() => setError(''), 5000);
    } finally {
      setActionLoading(false);
    }
  };

  const exportSubscriptions = async () => {
    try {
      setActionLoading(true);
      const response = await api.get('/admin/subscriptions/export');

      if (response.data.csv_data) {
        // Create and download CSV file
        const blob = new Blob([response.data.csv_data], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `subscriptions_export_${new Date().toISOString().split('T')[0]}.csv`);
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

  const RefundModal = ({ subscription, onClose, onRefund }) => {
    const [refundAmount, setRefundAmount] = useState('');
    const [reason, setReason] = useState('requested_by_customer');

    const handleRefund = () => {
      const amount = Math.round(parseFloat(refundAmount) * 100); // Convert to cents
      onRefund('refund', subscription.id, { amount, reason });
      onClose();
    };

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 w-full max-w-md">
          <h3 className="text-lg font-medium mb-4">Process Refund</h3>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Company</label>
              <p className="text-sm text-gray-900">{subscription.company_name}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Plan</label>
              <p className="text-sm text-gray-900">{subscription.plan_name} - £{subscription.amount?.toFixed(2)}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Refund Amount (£)</label>
              <input
                type="number"
                step="0.01"
                max={subscription.amount || 0}
                value={refundAmount}
                onChange={(e) => setRefundAmount(e.target.value)}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="0.00"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Reason</label>
              <select
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="requested_by_customer">Requested by customer</option>
                <option value="duplicate">Duplicate charge</option>
                <option value="fraudulent">Fraudulent</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end space-x-3 mt-6">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleRefund}
              disabled={!refundAmount || parseFloat(refundAmount) <= 0}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50"
            >
              Process Refund
            </button>
          </div>
        </div>
      </div>
    );
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'trial':
        return <Clock className="h-4 w-4 text-yellow-600" />;
      case 'cancelled':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'past_due':
        return <AlertCircle className="h-4 w-4 text-orange-600" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'trial':
        return 'bg-yellow-100 text-yellow-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      case 'past_due':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPlanColor = (plan) => {
    switch (plan) {
      case 'enterprise':
        return 'bg-purple-100 text-purple-800';
      case 'professional':
        return 'bg-blue-100 text-blue-800';
      case 'starter':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-yellow-100 text-yellow-800';
    }
  };

  const COLORS = ['#8B5CF6', '#10B981', '#F59E0B', '#EF4444', '#6B7280'];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
        <span className="ml-3 text-gray-600">Loading subscription data...</span>
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
          <h1 className="text-2xl font-bold text-purple-700">Subscription Overview</h1>
          <p className="text-gray-600">Monitor subscriptions, revenue, and billing</p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={() => loadSubscriptionData(pagination.page)}
            disabled={actionLoading}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${actionLoading ? 'animate-spin' : ''}`} />
            {actionLoading ? 'Loading...' : 'Refresh'}
          </button>
          <button
            onClick={exportSubscriptions}
            disabled={actionLoading}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
          >
            <Download className="h-4 w-4 mr-2" />
            Export
          </button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Revenue</p>
              <p className="text-2xl font-bold text-gray-900">
                £{(stats.total_revenue || 0).toLocaleString()}
              </p>
              <p className={`text-xs mt-1 ${(stats.revenue_growth || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {(stats.revenue_growth || 0) >= 0 ? '+' : ''}{(stats.revenue_growth || 0).toFixed(1)}% from last month
              </p>
            </div>
            <DollarSign className="h-8 w-8 text-green-600" />
          </div>
        </div>

        <div className="bg-white rounded-lg border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active Subscriptions</p>
              <p className="text-2xl font-bold text-gray-900">{stats.active_subscriptions || 0}</p>
              <p className={`text-xs mt-1 ${(stats.active_growth || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {(stats.active_growth || 0) >= 0 ? '+' : ''}{(stats.active_growth || 0).toFixed(1)}% from last month
              </p>
            </div>
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
        </div>

        <div className="bg-white rounded-lg border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Trial Users</p>
              <p className="text-2xl font-bold text-gray-900">{stats.trial_subscriptions || 0}</p>
              <p className="text-xs text-yellow-600 mt-1">
                {(stats.trial_conversion_rate || 0).toFixed(1)}% conversion rate
              </p>
            </div>
            <Clock className="h-8 w-8 text-yellow-600" />
          </div>
        </div>

        <div className="bg-white rounded-lg border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Churn Rate</p>
              <p className="text-2xl font-bold text-gray-900">{(stats.churn_rate || 0).toFixed(1)}%</p>
              <p className={`text-xs mt-1 ${(stats.churn_change || 0) >= 0 ? 'text-red-600' : 'text-green-600'}`}>
                {(stats.churn_change || 0) >= 0 ? '+' : ''}{(stats.churn_change || 0).toFixed(1)}% from last month
              </p>
            </div>
            <TrendingDown className="h-8 w-8 text-red-600" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Revenue Chart */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-medium text-purple-700 mb-4">Monthly Revenue</h3>
          {revenueData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip formatter={(value) => [`£${value.toLocaleString()}`, 'Revenue']} />
                <Line type="monotone" dataKey="revenue" stroke="#7C3AED" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[300px]">
              <p className="text-gray-500">No revenue data available</p>
            </div>
          )}
        </div>

        {/* Plan Distribution */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-medium text-purple-700 mb-4">Plan Distribution</h3>
          {planDistribution.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={planDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {planDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[300px]">
              <p className="text-gray-500">No plan distribution data available</p>
            </div>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
            <div className="relative">
              <Search className="h-4 w-4 absolute left-3 top-3 text-gray-400" />
              <input
                type="text"
                placeholder="Search companies or users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Plan</label>
            <select
              value={filterPlan}
              onChange={(e) => setFilterPlan(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="all">All Plans</option>
              <option value="starter">Starter</option>
              <option value="professional">Professional</option>
              <option value="enterprise">Enterprise</option>
            </select>
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
              <option value="trial">Trial</option>
              <option value="cancelled">Cancelled</option>
              <option value="past_due">Past Due</option>
            </select>
          </div>
          <div className="flex items-end">
            <button
              onClick={() => {
                setSearchTerm('');
                setFilterPlan('all');
                setFilterStatus('all');
              }}
              className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Subscriptions Table */}
      <div className="bg-white shadow-sm rounded-lg border border-gray-200 overflow-hidden">
        {filteredSubscriptions.length === 0 ? (
          <div className="text-center py-12">
            <CreditCard className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No subscriptions found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm || filterPlan !== 'all' || filterStatus !== 'all'
                ? 'Try adjusting your search or filter criteria'
                : 'No subscriptions have been created yet'
              }
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Company/User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Plan
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Next Billing
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Started
                  </th>
                  <th className="relative px-6 py-3">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredSubscriptions.map((subscription) => (
                  <tr key={subscription.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-10 w-10 rounded-full bg-purple-600 flex items-center justify-center">
                          <Building className="h-5 w-5 text-white" />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {subscription.company_name || 'Individual'}
                          </div>
                          <div className="text-sm text-gray-500">{subscription.user_email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPlanColor(subscription.plan_name)}`}>
                        {subscription.plan_name?.toUpperCase() || 'TRIAL'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {getStatusIcon(subscription.status)}
                        <span className={`ml-2 inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(subscription.status)}`}>
                          {subscription.status?.toUpperCase()}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      £{subscription.amount ? subscription.amount.toFixed(2) : '0.00'}
                      <span className="text-gray-500">/{subscription.billing_cycle}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {subscription.next_billing_date ?
                        new Date(subscription.next_billing_date).toLocaleDateString() :
                        'N/A'
                      }
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {subscription.created_at ? new Date(subscription.created_at).toLocaleDateString() : 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center space-x-2">
                        {subscription.status === 'active' ? (
                          <button
                            onClick={() => handleSubscriptionAction('cancel', subscription.id)}
                            className="text-red-600 hover:text-red-900"
                            title="Cancel Subscription"
                            disabled={actionLoading}
                          >
                            <XCircle className="h-4 w-4" />
                          </button>
                        ) : subscription.status === 'cancelled' ? (
                          <button
                            onClick={() => handleSubscriptionAction('reactivate', subscription.id)}
                            className="text-green-600 hover:text-green-900"
                            title="Reactivate Subscription"
                            disabled={actionLoading}
                          >
                            <CheckCircle className="h-4 w-4" />
                          </button>
                        ) : null}

                        {subscription.status === 'active' && (
                          <button
                            onClick={() => {
                              setSelectedSubscription(subscription);
                              setShowRefundModal(true);
                            }}
                            className="text-blue-600 hover:text-blue-900"
                            title="Process Refund"
                            disabled={actionLoading}
                          >
                            <RefreshCw className="h-4 w-4" />
                          </button>
                        )}
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
              onClick={() => loadSubscriptionData(pagination.page - 1)}
              disabled={pagination.page <= 1}
              className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
            >
              Previous
            </button>
            <button
              onClick={() => loadSubscriptionData(pagination.page + 1)}
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
              <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                <button
                  onClick={() => loadSubscriptionData(pagination.page - 1)}
                  disabled={pagination.page <= 1}
                  className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                >
                  Previous
                </button>

                {Array.from({ length: Math.min(5, pagination.pages) }, (_, i) => {
                  const pageNum = Math.max(1, Math.min(pagination.pages - 4, pagination.page - 2)) + i;
                  return pageNum <= pagination.pages ? (
                    <button
                      key={pageNum}
                      onClick={() => loadSubscriptionData(pageNum)}
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
                  onClick={() => loadSubscriptionData(pagination.page + 1)}
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

      {/* Additional Statistics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Monthly Recurring Revenue */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h4 className="text-md font-medium text-purple-700 mb-4">Monthly Recurring Revenue</h4>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Current MRR</span>
              <span className="text-lg font-semibold">£{(stats.current_mrr || 0).toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Previous MRR</span>
              <span className="text-lg font-semibold">£{(stats.previous_mrr || 0).toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Growth</span>
              <span className={`text-lg font-semibold ${(stats.mrr_growth || 0) >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                {(stats.mrr_growth || 0) >= 0 ? '+' : ''}{(stats.mrr_growth || 0).toFixed(1)}%
              </span>
            </div>
          </div>
        </div>

        {/* Trial Conversion */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h4 className="text-md font-medium text-purple-700 mb-4">Trial Conversions</h4>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">This Month</span>
              <span className="text-lg font-semibold">{stats.monthly_conversions || 0}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Conversion Rate</span>
              <span className="text-lg font-semibold">{(stats.trial_conversion_rate || 0).toFixed(1)}%</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Active Trials</span>
              <span className="text-lg font-semibold">{stats.active_trials || 0}</span>
            </div>
          </div>
        </div>

        {/* Payment Issues */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h4 className="text-md font-medium text-purple-700 mb-4">Payment Issues</h4>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Failed Payments</span>
              <span className="text-lg font-semibold text-red-600">{stats.failed_payments || 0}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Past Due</span>
              <span className="text-lg font-semibold text-orange-600">{stats.past_due_count || 0}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Cancelled</span>
              <span className="text-lg font-semibold text-gray-600">{stats.cancelled_count || 0}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Summary by Plan */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h4 className="text-md font-medium text-purple-700 mb-4">Subscription Summary by Plan</h4>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-2 px-4 text-sm font-medium text-gray-600">Plan</th>
                <th className="text-left py-2 px-4 text-sm font-medium text-gray-600">Active</th>
                <th className="text-left py-2 px-4 text-sm font-medium text-gray-600">Trial</th>
                <th className="text-left py-2 px-4 text-sm font-medium text-gray-600">Cancelled</th>
                <th className="text-left py-2 px-4 text-sm font-medium text-gray-600">Monthly Revenue</th>
              </tr>
            </thead>
            <tbody>
              {['starter', 'professional', 'enterprise'].map(plan => {
                const planSubs = subscriptions.filter(s => s.plan_name === plan);
                const activeSubs = planSubs.filter(s => s.status === 'active');
                const trialSubs = planSubs.filter(s => s.status === 'trial');
                const cancelledSubs = planSubs.filter(s => s.status === 'cancelled');
                const monthlyRevenue = activeSubs.reduce((sum, sub) => {
                  const amount = sub.billing_cycle === 'yearly' ? (sub.amount || 0) / 12 : (sub.amount || 0);
                  return sum + amount;
                }, 0);

                return (
                  <tr key={plan} className="border-b border-gray-100">
                    <td className="py-3 px-4">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPlanColor(plan)}`}>
                        {plan.toUpperCase()}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-900">{activeSubs.length}</td>
                    <td className="py-3 px-4 text-sm text-gray-900">{trialSubs.length}</td>
                    <td className="py-3 px-4 text-sm text-gray-900">{cancelledSubs.length}</td>
                    <td className="py-3 px-4 text-sm text-gray-900">£{monthlyRevenue.toFixed(2)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Refund Modal */}
      {showRefundModal && selectedSubscription && (
        <RefundModal
          subscription={selectedSubscription}
          onClose={() => {
            setShowRefundModal(false);
            setSelectedSubscription(null);
          }}
          onRefund={handleSubscriptionAction}
        />
      )}
    </div>
  );
};

export default SubscriptionOverview;