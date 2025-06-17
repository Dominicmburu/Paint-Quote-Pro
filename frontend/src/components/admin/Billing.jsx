import React, { useState, useEffect } from 'react';
import { 
  DollarSign, 
  Search, 
  Filter, 
  Calendar,
  CreditCard,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  TrendingUp,
  TrendingDown,
  Download,
  RefreshCw,
  Eye,
  Send,
  Building,
  User,
  FileText,
  Activity,
  Percent
} from 'lucide-react';
import api from '../../services/api';
import Loading from '../common/Loading';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, AreaChart, Area } from 'recharts';

const Billing = () => {
  const [subscriptions, setSubscriptions] = useState([]);
  const [filteredSubscriptions, setFilteredSubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPlan, setFilterPlan] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [dateRange, setDateRange] = useState('30');
  const [stats, setStats] = useState({});
  const [revenueData, setRevenueData] = useState([]);
  const [planDistribution, setPlanDistribution] = useState([]);

  useEffect(() => {
    loadBillingData();
  }, [dateRange]);

  useEffect(() => {
    filterSubscriptions();
  }, [subscriptions, searchTerm, filterPlan, filterStatus]);

  const loadBillingData = async () => {
    try {
      setLoading(true);
      
      // Use existing subscription endpoints
      const [subscriptionsRes, statsRes, revenueRes] = await Promise.all([
        api.get('/admin/subscriptions'),
        api.get('/admin/subscriptions/stats'),
        api.get('/admin/subscriptions/revenue-data')
      ]);
      
      setSubscriptions(subscriptionsRes.data.subscriptions || []);
      setStats(statsRes.data || {});
      setRevenueData(revenueRes.data.monthly_revenue || []);
      setPlanDistribution(revenueRes.data.plan_distribution || []);
    } catch (error) {
      console.error('Failed to load billing data:', error);
      // Set fallback data
      setSubscriptions([]);
      setStats({});
      setRevenueData([]);
      setPlanDistribution([]);
    } finally {
      setLoading(false);
    }
  };

  const filterSubscriptions = () => {
    let filtered = subscriptions;

    if (searchTerm) {
      filtered = filtered.filter(subscription => 
        subscription.company_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        subscription.company_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        subscription.stripe_customer_id?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (filterPlan !== 'all') {
      filtered = filtered.filter(subscription => subscription.plan_name === filterPlan);
    }

    if (filterStatus !== 'all') {
      filtered = filtered.filter(subscription => subscription.status === filterStatus);
    }

    setFilteredSubscriptions(filtered);
  };

  const exportSubscriptions = async () => {
    try {
      const response = await api.get('/admin/subscriptions/export');
      
      if (response.data && response.data.csv_data) {
        const blob = new Blob([response.data.csv_data], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `billing_export_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Export failed:', error);
      alert('Export failed. Please try again.');
    }
  };

  const cancelSubscription = async (subscriptionId) => {
    if (!window.confirm('Are you sure you want to cancel this subscription?')) {
      return;
    }

    try {
      await api.put(`/admin/subscriptions/${subscriptionId}/cancel`);
      loadBillingData();
      alert('Subscription cancelled successfully');
    } catch (error) {
      console.error('Failed to cancel subscription:', error);
      alert('Failed to cancel subscription.');
    }
  };

  const reactivateSubscription = async (subscriptionId) => {
    try {
      await api.put(`/admin/subscriptions/${subscriptionId}/reactivate`);
      loadBillingData();
      alert('Subscription reactivated successfully');
    } catch (error) {
      console.error('Failed to reactivate subscription:', error);
      alert('Failed to reactivate subscription.');
    }
  };

  const processRefund = async (subscriptionId) => {
    const amount = prompt('Enter refund amount (in pence):');
    if (!amount || isNaN(amount)) {
      alert('Please enter a valid amount');
      return;
    }

    const reason = prompt('Enter refund reason:') || 'requested_by_customer';

    try {
      await api.post(`/admin/subscriptions/${subscriptionId}/refund`, {
        amount: parseInt(amount),
        reason: reason
      });
      loadBillingData();
      alert('Refund processed successfully');
    } catch (error) {
      console.error('Failed to process refund:', error);
      alert('Failed to process refund.');
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'trial':
        return <Clock className="h-4 w-4 text-blue-600" />;
      case 'past_due':
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      case 'cancelled':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'unpaid':
        return <XCircle className="h-4 w-4 text-red-600" />;
      default:
        return <AlertTriangle className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'trial':
        return 'bg-blue-100 text-blue-800';
      case 'past_due':
        return 'bg-yellow-100 text-yellow-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      case 'unpaid':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const calculateAmount = (subscription) => {
    // Calculate monthly amount based on plan and billing cycle
    const planPrices = {
      starter: { monthly: 29, yearly: 290 },
      professional: { monthly: 59, yearly: 590 },
      enterprise: { monthly: 99, yearly: 990 }
    };

    const plan = planPrices[subscription.plan_name] || { monthly: 0, yearly: 0 };
    
    if (subscription.billing_cycle === 'yearly') {
      return plan.yearly;
    }
    return plan.monthly;
  };

  const COLORS = ['#10B981', '#3B82F6', '#EF4444', '#F59E0B', '#6B7280'];

  // Filter out past due and unpaid subscriptions for alerts
  const problemSubscriptions = subscriptions.filter(sub => 
    sub.status === 'past_due' || sub.status === 'unpaid'
  );

  if (loading) {
    return <Loading message="Loading billing data..." />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-purple-700">Billing & Subscriptions</h1>
          <p className="text-gray-600">Monitor subscription revenue and payment status</p>
        </div>
        <div className="flex space-x-3">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
            <option value="90">Last 90 days</option>
            <option value="365">Last year</option>
          </select>
          <button
            onClick={loadBillingData}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </button>
          <button
            onClick={exportSubscriptions}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-purple-600 hover:bg-purple-700"
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
              <p className="text-2xl font-bold text-gray-900">£{(stats.total_revenue || 0).toLocaleString()}</p>
              <p className="text-xs text-green-600 mt-1">
                +{(stats.revenue_growth || 0).toFixed(1)}% growth
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
              <p className="text-xs text-blue-600 mt-1">
                +{(stats.active_growth || 0).toFixed(1)}% growth
              </p>
            </div>
            <Activity className="h-8 w-8 text-blue-600" />
          </div>
        </div>

        <div className="bg-white rounded-lg border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">MRR</p>
              <p className="text-2xl font-bold text-gray-900">£{(stats.current_mrr || 0).toLocaleString()}</p>
              <p className="text-xs text-purple-600 mt-1">
                +{(stats.mrr_growth || 0).toFixed(1)}% growth
              </p>
            </div>
            <TrendingUp className="h-8 w-8 text-purple-600" />
          </div>
        </div>

        <div className="bg-white rounded-lg border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Churn Rate</p>
              <p className="text-2xl font-bold text-gray-900">{(stats.churn_rate || 0).toFixed(1)}%</p>
              <p className="text-xs text-red-600 mt-1">
                {(stats.churn_change || 0) >= 0 ? '+' : ''}{(stats.churn_change || 0).toFixed(1)}% change
              </p>
            </div>
            <Percent className="h-8 w-8 text-red-600" />
          </div>
        </div>
      </div>

      {/* Additional Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Trial Subscriptions</p>
              <p className="text-2xl font-bold text-gray-900">{stats.trial_subscriptions || 0}</p>
              <p className="text-xs text-blue-600 mt-1">
                {(stats.trial_conversion_rate || 0).toFixed(1)}% conversion rate
              </p>
            </div>
            <Clock className="h-8 w-8 text-blue-600" />
          </div>
        </div>

        <div className="bg-white rounded-lg border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Monthly Conversions</p>
              <p className="text-2xl font-bold text-gray-900">{stats.monthly_conversions || 0}</p>
              <p className="text-xs text-green-600 mt-1">
                Trial to paid
              </p>
            </div>
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
        </div>

        <div className="bg-white rounded-lg border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Failed Payments</p>
              <p className="text-2xl font-bold text-gray-900">{stats.failed_payments || 0}</p>
              <p className="text-xs text-red-600 mt-1">
                Require attention
              </p>
            </div>
            <AlertTriangle className="h-8 w-8 text-red-600" />
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Revenue Chart */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-medium text-purple-700 mb-4">Monthly Recurring Revenue</h3>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={revenueData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip formatter={(value) => [`£${value.toLocaleString()}`, 'Revenue']} />
              <Area type="monotone" dataKey="revenue" stroke="#10B981" fill="#10B981" fillOpacity={0.3} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Plan Distribution */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-medium text-purple-700 mb-4">Revenue by Plan</h3>
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
              <Tooltip formatter={(value) => [`£${value.toLocaleString()}`, 'Revenue']} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Problem Subscriptions Alert */}
      {problemSubscriptions.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <AlertTriangle className="h-5 w-5 text-red-400 mr-2" />
            <div className="flex-1">
              <h4 className="text-sm font-medium text-red-800">Subscriptions Requiring Attention</h4>
              <p className="text-sm text-red-700 mt-1">
                {problemSubscriptions.length} subscription{problemSubscriptions.length > 1 ? 's' : ''} with payment issues.
              </p>
              <div className="mt-3 space-y-2">
                {problemSubscriptions.slice(0, 3).map((subscription) => (
                  <div key={subscription.id} className="flex justify-between items-center bg-white rounded p-2">
                    <div>
                      <span className="text-sm font-medium">{subscription.company_name}</span>
                      <span className="text-sm text-gray-500 ml-2">£{calculateAmount(subscription)}/month</span>
                    </div>
                    <div className="flex space-x-2">
                      <span className={`text-xs px-2 py-1 rounded ${getStatusColor(subscription.status)}`}>
                        {subscription.status?.toUpperCase()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
            <div className="relative">
              <Search className="h-4 w-4 absolute left-3 top-3 text-gray-400" />
              <input
                type="text"
                placeholder="Search subscriptions..."
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
              <option value="past_due">Past Due</option>
              <option value="cancelled">Cancelled</option>
              <option value="unpaid">Unpaid</option>
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
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Company
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Plan
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Billing Cycle
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Next Payment
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
              {filteredSubscriptions.length === 0 ? (
                <tr>
                  <td colSpan="8" className="px-6 py-12 text-center text-gray-500">
                    <CreditCard className="h-12 w-12 mx-auto text-gray-300 mb-4" />
                    <p className="text-lg font-medium">No subscriptions found</p>
                    <p className="text-sm">Try adjusting your filters or search terms</p>
                  </td>
                </tr>
              ) : (
                filteredSubscriptions.map((subscription) => (
                  <tr key={subscription.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <Building className="h-8 w-8 text-purple-600 mr-3" />
                        <div>
                          <div className="text-sm font-medium text-gray-900">{subscription.company_name}</div>
                          <div className="text-sm text-gray-500">{subscription.company_email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-purple-100 text-purple-800">
                        {subscription.plan_name?.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <span className="text-green-600 font-medium">
                        £{calculateAmount(subscription)}/{subscription.billing_cycle === 'yearly' ? 'year' : 'month'}
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
                      {subscription.billing_cycle?.charAt(0).toUpperCase() + subscription.billing_cycle?.slice(1)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {subscription.current_period_end ? new Date(subscription.current_period_end).toLocaleDateString() : 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {subscription.created_at ? new Date(subscription.created_at).toLocaleDateString() : 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center space-x-2">
                        <button
                          className="text-blue-600 hover:text-blue-900"
                          title="View Subscription"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        {subscription.status === 'active' && (
                          <button
                            onClick={() => cancelSubscription(subscription.id)}
                            className="text-red-600 hover:text-red-900"
                            title="Cancel Subscription"
                          >
                            <XCircle className="h-4 w-4" />
                          </button>
                        )}
                        {subscription.status === 'cancelled' && (
                          <button
                            onClick={() => reactivateSubscription(subscription.id)}
                            className="text-green-600 hover:text-green-900"
                            title="Reactivate Subscription"
                          >
                            <CheckCircle className="h-4 w-4" />
                          </button>
                        )}
                        <button
                          onClick={() => processRefund(subscription.id)}
                          className="text-yellow-600 hover:text-yellow-900"
                          title="Process Refund"
                        >
                          <DollarSign className="h-4 w-4" />
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

      {/* Additional Revenue Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Financial Overview */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h4 className="text-md font-medium text-purple-700 mb-4">Financial Overview</h4>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Total Revenue</span>
              <span className="text-sm font-semibold">£{(stats.total_revenue || 0).toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Monthly Recurring Revenue</span>
              <span className="text-sm font-semibold">£{(stats.current_mrr || 0).toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Previous MRR</span>
              <span className="text-sm font-semibold">£{(stats.previous_mrr || 0).toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center border-t pt-2">
              <span className="text-sm font-medium text-gray-900">MRR Growth</span>
              <span className={`text-sm font-bold ${(stats.mrr_growth || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {(stats.mrr_growth || 0) >= 0 ? '+' : ''}{(stats.mrr_growth || 0).toFixed(1)}%
              </span>
            </div>
          </div>
        </div>

        {/* Subscription Metrics */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h4 className="text-md font-medium text-purple-700 mb-4">Subscription Metrics</h4>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Active Subscriptions</span>
              <span className="text-sm font-semibold">{stats.active_subscriptions || 0}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Trial Conversion Rate</span>
              <span className="text-sm font-semibold">{(stats.trial_conversion_rate || 0).toFixed(1)}%</span>
            </div>
          </div>
        </div>

        {/* Performance Metrics */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h4 className="text-md font-medium text-purple-700 mb-4">Performance Metrics</h4>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Churn Rate</span>
              <span className="text-sm font-semibold">{(stats.churn_rate || 0).toFixed(1)}%</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Monthly Conversions</span>
              <span className="text-sm font-semibold">{stats.monthly_conversions || 0}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Failed Payments</span>
              <span className="text-sm font-semibold">{stats.failed_payments || 0}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Active Trials</span>
              <span className="text-sm font-semibold">{stats.active_trials || 0}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Plan Performance */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-medium text-purple-700 mb-4">Plan Performance</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-blue-50 p-4 rounded-lg text-center">
            <div className="text-2xl font-bold text-blue-600">
              {subscriptions.filter(s => s.plan_name === 'starter').length}
            </div>
            <div className="text-sm text-gray-600">Starter Plan</div>
            <div className="text-xs text-gray-500 mt-1">
              £{(subscriptions.filter(s => s.plan_name === 'starter').length * 29).toLocaleString()}/month
            </div>
          </div>
          <div className="bg-purple-50 p-4 rounded-lg text-center">
            <div className="text-2xl font-bold text-purple-600">
              {subscriptions.filter(s => s.plan_name === 'professional').length}
            </div>
            <div className="text-sm text-gray-600">Professional Plan</div>
            <div className="text-xs text-gray-500 mt-1">
              £{(subscriptions.filter(s => s.plan_name === 'professional').length * 59).toLocaleString()}/month
            </div>
          </div>
          <div className="bg-green-50 p-4 rounded-lg text-center">
            <div className="text-2xl font-bold text-green-600">
              {subscriptions.filter(s => s.plan_name === 'enterprise').length}
            </div>
            <div className="text-sm text-gray-600">Enterprise Plan</div>
            <div className="text-xs text-gray-500 mt-1">
              £{(subscriptions.filter(s => s.plan_name === 'enterprise').length * 99).toLocaleString()}/month
            </div>
          </div>
        </div>
      </div>

      {/* Subscription Growth Trends */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-medium text-purple-700 mb-4">Subscription Count by Status</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={[
            { status: 'Active', count: stats.active_subscriptions || 0 },
            { status: 'Trial', count: stats.trial_subscriptions || 0 },
            { status: 'Past Due', count: stats.past_due_count || 0 },
            { status: 'Cancelled', count: stats.cancelled_count || 0 }
          ]}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="status" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="count" fill="#8B5CF6" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h4 className="text-lg font-medium text-purple-700 mb-4">Recent Subscription Activity</h4>
        <div className="space-y-3">
          {filteredSubscriptions.slice(0, 5).map((subscription, index) => (
            <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded">
              <div className="flex items-center">
                <div className={`h-3 w-3 rounded-full mr-3 ${
                  subscription.status === 'active' ? 'bg-green-500' :
                  subscription.status === 'trial' ? 'bg-blue-500' :
                  subscription.status === 'past_due' ? 'bg-yellow-500' :
                  'bg-red-500'
                }`} />
                <div>
                  <span className="text-sm font-medium text-gray-900">{subscription.company_name}</span>
                  <div className="text-xs text-gray-500">
                    {subscription.plan_name} plan - {subscription.status}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <span className="text-sm font-semibold text-gray-900">
                  £{calculateAmount(subscription)}/{subscription.billing_cycle === 'yearly' ? 'yr' : 'mo'}
                </span>
                <div className="text-xs text-gray-500">
                  {subscription.created_at ? new Date(subscription.created_at).toLocaleDateString() : 'N/A'}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h4 className="text-lg font-medium text-purple-700 mb-4">Quick Actions</h4>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <button className="p-4 border border-gray-300 rounded-lg hover:bg-gray-50 text-center">
            <FileText className="h-8 w-8 mx-auto text-blue-600 mb-2" />
            <div className="text-sm font-medium">Generate Invoice</div>
            <div className="text-xs text-gray-500">Create custom invoice</div>
          </button>
          <button className="p-4 border border-gray-300 rounded-lg hover:bg-gray-50 text-center">
            <Download className="h-8 w-8 mx-auto text-green-600 mb-2" />
            <div className="text-sm font-medium">Export Data</div>
            <div className="text-xs text-gray-500">Download subscription data</div>
          </button>
          <button className="p-4 border border-gray-300 rounded-lg hover:bg-gray-50 text-center">
            <Send className="h-8 w-8 mx-auto text-purple-600 mb-2" />
            <div className="text-sm font-medium">Send Reminder</div>
            <div className="text-xs text-gray-500">Payment reminder email</div>
          </button>
          <button className="p-4 border border-gray-300 rounded-lg hover:bg-gray-50 text-center">
            <Calendar className="h-8 w-8 mx-auto text-yellow-600 mb-2" />
            <div className="text-sm font-medium">Schedule Report</div>
            <div className="text-xs text-gray-500">Automated billing reports</div>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Billing;