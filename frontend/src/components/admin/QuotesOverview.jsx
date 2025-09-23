import React, { useState, useEffect } from 'react';
import { 
  Quote, 
  Search, 
  Filter, 
  Calendar,
  Building,
  User,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertCircle,
  XCircle,
  Download,
  RefreshCw,
  Eye,
  Send,
  FileText,
  DollarSign,
  Percent,
  Trash2,
  Edit
} from 'lucide-react';
import api from '../../services/api';
import Loading from '../common/Loading';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, AreaChart, Area } from 'recharts';

const QuotesOverview = () => {
  const [quotes, setQuotes] = useState([]);
  const [filteredQuotes, setFilteredQuotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterCompany, setFilterCompany] = useState('all');
  const [dateRange, setDateRange] = useState('30');
  const [stats, setStats] = useState({});
  const [companies, setCompanies] = useState([]);
  const [quoteTrends, setQuoteTrends] = useState([]);
  const [statusDistribution, setStatusDistribution] = useState([]);
  const [monthlyAverages, setMonthlyAverages] = useState([]);
  const [selectedQuote, setSelectedQuote] = useState(null);
  const [showQuoteModal, setShowQuoteModal] = useState(false);

  useEffect(() => {
    loadQuotes();
    loadCompanies();
    loadQuoteStats();
  }, [dateRange]);

  useEffect(() => {
    filterQuotes();
  }, [quotes, searchTerm, filterStatus, filterCompany]);

  const loadQuotes = async () => {
    try {
      setLoading(true);
      // Use the correct admin quotes endpoint
      const response = await api.get(`/admin/admin-quotes?days=${dateRange}&search=${searchTerm}&status=${filterStatus !== 'all' ? filterStatus : ''}&company_id=${filterCompany !== 'all' ? filterCompany : ''}`);
      setQuotes(response.data || []);
    } catch (error) {
      console.error('Failed to load quotes:', error);
      setQuotes([]);
    } finally {
      setLoading(false);
    }
  };

  const loadCompanies = async () => {
    try {
      // Use the companies-list endpoint for dropdown data
      const response = await api.get('/admin/companies-list');
      setCompanies(response.data || []);
    } catch (error) {
      console.error('Failed to load companies:', error);
      setCompanies([]);
    }
  };

  const loadQuoteStats = async () => {
    try {
      // Use the correct admin quotes stats endpoint
      const response = await api.get(`/admin/admin-quotes/stats?days=${dateRange}`);
      const data = response.data || {};
      setStats(data.stats || {});
      setQuoteTrends(data.trends || []);
      setStatusDistribution(data.status_distribution || []);
      setMonthlyAverages(data.monthly_averages || []);
    } catch (error) {
      console.error('Failed to load quote stats:', error);
      // Set default empty values on error
      setStats({});
      setQuoteTrends([]);
      setStatusDistribution([]);
      setMonthlyAverages([]);
    }
  };

  const filterQuotes = () => {
    let filtered = quotes;

    if (searchTerm) {
      filtered = filtered.filter(quote => 
        quote.project_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        quote.company_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        quote.user_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        quote.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        quote.quote_number?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (filterStatus !== 'all') {
      filtered = filtered.filter(quote => quote.status === filterStatus);
    }

    if (filterCompany !== 'all') {
      filtered = filtered.filter(quote => quote.company_id?.toString() === filterCompany);
    }

    setFilteredQuotes(filtered);
  };

  const exportQuotes = async () => {
    try {
      const response = await api.get(`/admin/admin-quotes/export?days=${dateRange}`);
      
      // Handle JSON response with CSV data
      if (response.data && response.data.csv_data) {
        const blob = new Blob([response.data.csv_data], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `quotes_export_${new Date().toISOString().split('T')[0]}.csv`);
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

  const viewQuoteDetails = async (quoteId) => {
    try {
      const response = await api.get(`/admin/admin-quotes/${quoteId}`);
      setSelectedQuote(response.data.quote);
      setShowQuoteModal(true);
    } catch (error) {
      console.error('Failed to load quote details:', error);
      alert('Failed to load quote details.');
    }
  };

  const updateQuoteStatus = async (quoteId, newStatus) => {
    try {
      await api.put(`/admin/admin-quotes/${quoteId}/status`, { status: newStatus });
      loadQuotes(); // Reload quotes to show updated status
      loadQuoteStats(); // Reload stats
      alert(`Quote status updated to ${newStatus}`);
    } catch (error) {
      console.error('Failed to update quote status:', error);
      alert('Failed to update quote status.');
    }
  };

  const deleteQuote = async (quoteId) => {
    if (!window.confirm('Are you sure you want to delete this quote?')) {
      return;
    }

    try {
      await api.delete(`/admin/admin-quotes/${quoteId}`);
      loadQuotes(); // Reload quotes
      loadQuoteStats(); // Reload stats
      alert('Quote deleted successfully');
    } catch (error) {
      console.error('Failed to delete quote:', error);
      alert('Failed to delete quote.');
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'accepted':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'sent':
        return <Send className="h-4 w-4 text-blue-600" />;
      case 'draft':
        return <FileText className="h-4 w-4 text-gray-600" />;
      case 'expired':
        return <Clock className="h-4 w-4 text-red-600" />;
      case 'rejected':
        return <XCircle className="h-4 w-4 text-red-600" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'accepted':
        return 'bg-green-100 text-green-800';
      case 'sent':
        return 'bg-blue-100 text-blue-800';
      case 'draft':
        return 'bg-gray-100 text-gray-800';
      case 'expired':
        return 'bg-red-100 text-red-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const COLORS = ['#10B981', '#3B82F6', '#6B7280', '#EF4444', '#F59E0B'];

  if (loading) {
    return <Loading message="Loading quotes..." />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-purple-700">Quotes Overview</h1>
          <p className="text-gray-600">Monitor quote generation and conversion rates across all companies</p>
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
            onClick={loadQuotes}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </button>
          <button
            onClick={exportQuotes}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-purple-600 hover:bg-purple-700"
          >
            <Download className="h-4 w-4 mr-2" />
            Export
          </button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        <div className="bg-white rounded-lg border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Quotes</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total_quotes || 0}</p>
              <p className="text-xs text-green-600 mt-1">
                +{(stats.quote_growth || 0).toFixed(1)}% growth
              </p>
            </div>
            <Quote className="h-8 w-8 text-blue-600" />
          </div>
        </div>

        <div className="bg-white rounded-lg border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Accepted</p>
              <p className="text-2xl font-bold text-gray-900">{stats.accepted_quotes || 0}</p>
              <p className="text-xs text-green-600 mt-1">
                {stats.conversion_rate ? `${stats.conversion_rate}%` : '0%'} conversion
              </p>
            </div>
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
        </div>

        <div className="bg-white rounded-lg border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Value</p>
              <p className="text-2xl font-bold text-gray-900">€{(stats.total_value || 0).toLocaleString()}</p>
              <p className="text-xs text-gray-600 mt-1">
                Accepted: €{(stats.accepted_value || 0).toLocaleString()}
              </p>
            </div>
            <DollarSign className="h-8 w-8 text-green-600" />
          </div>
        </div>

        <div className="bg-white rounded-lg border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Avg Value</p>
              <p className="text-2xl font-bold text-gray-900">€{(stats.avg_value || 0).toLocaleString()}</p>
              <p className="text-xs text-gray-600 mt-1">
                Per quote
              </p>
            </div>
            <TrendingUp className="h-8 w-8 text-purple-600" />
          </div>
        </div>

        <div className="bg-white rounded-lg border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Draft Quotes</p>
              <p className="text-2xl font-bold text-gray-900">{stats.draft_quotes || 0}</p>
              <p className="text-xs text-gray-600 mt-1">
                Sent: {stats.sent_quotes || 0}
              </p>
            </div>
            <FileText className="h-8 w-8 text-gray-600" />
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Quote Generation Trends */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-medium text-purple-700 mb-4">Quote Generation Trends</h3>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={quoteTrends}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Area type="monotone" dataKey="quotes" stroke="#7C3AED" fill="#7C3AED" fillOpacity={0.3} />
              <Area type="monotone" dataKey="value" stroke="#10B981" fill="#10B981" fillOpacity={0.2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Quote Status Distribution */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-medium text-purple-700 mb-4">Quote Status Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={statusDistribution}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {statusDistribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Monthly Averages Chart */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-medium text-purple-700 mb-4">Monthly Average Quote Value</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={monthlyAverages}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip formatter={(value) => [`€${value.toLocaleString()}`, 'Average Value']} />
            <Line type="monotone" dataKey="average_value" stroke="#8B5CF6" strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
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
                placeholder="Search quotes..."
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
              <option value="draft">Draft</option>
              <option value="sent">Sent</option>
              <option value="accepted">Accepted</option>
              <option value="rejected">Rejected</option>
              <option value="expired">Expired</option>
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
                setFilterCompany('all');
                loadQuotes();
              }}
              className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Quotes Table */}
      <div className="bg-white shadow-sm rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Quote
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Project
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Company
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Value
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Created
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Valid Until
                </th>
                <th className="relative px-6 py-3">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredQuotes.length === 0 ? (
                <tr>
                  <td colSpan="8" className="px-6 py-12 text-center text-gray-500">
                    <Quote className="h-12 w-12 mx-auto text-gray-300 mb-4" />
                    <p className="text-lg font-medium">No quotes found</p>
                    <p className="text-sm">Try adjusting your filters or search terms</p>
                  </td>
                </tr>
              ) : (
                filteredQuotes.map((quote) => (
                  <tr key={quote.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">#{quote.quote_number}</div>
                      <div className="text-sm text-gray-500">{quote.title}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <FileText className="h-8 w-8 text-purple-600 mr-3" />
                        <div>
                          <div className="text-sm font-medium text-gray-900">{quote.project_name}</div>
                          <div className="text-sm text-gray-500">{quote.client_name}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <Building className="h-4 w-4 text-gray-400 mr-2" />
                        <div>
                          <div className="text-sm text-gray-900">{quote.company_name || 'Unknown'}</div>
                          <div className="text-sm text-gray-500">{quote.user_name}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {getStatusIcon(quote.status)}
                        <span className={`ml-2 inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(quote.status)}`}>
                          {quote.status?.toUpperCase()}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      €{quote.total_amount ? quote.total_amount.toLocaleString() : 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {quote.created_at ? new Date(quote.created_at).toLocaleDateString() : 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {quote.valid_until ? new Date(quote.valid_until).toLocaleDateString() : 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => viewQuoteDetails(quote.id)}
                          className="text-blue-600 hover:text-blue-900"
                          title="View Quote"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => deleteQuote(quote.id)}
                          className="text-red-600 hover:text-red-900"
                          title="Delete Quote"
                        >
                          <Trash2 className="h-4 w-4" />
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

      {/* Top Companies by Quote Value */}
      {stats.top_companies && stats.top_companies.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h4 className="text-lg font-medium text-purple-700 mb-4">Top Companies by Quote Value</h4>
          <div className="space-y-3">
            {stats.top_companies.map((company, index) => (
              <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                <div className="flex items-center">
                  <span className="text-lg font-bold text-purple-600 mr-3">#{index + 1}</span>
                  <div>
                    <span className="text-sm font-medium text-gray-900">{company.name}</span>
                    <div className="text-xs text-gray-500">{company.quote_count} quotes</div>
                  </div>
                </div>
                <span className="text-sm font-semibold text-green-600">€{company.total_value.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Activity */}
      {stats.recent_activity && stats.recent_activity.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h4 className="text-lg font-medium text-purple-700 mb-4">Recent Quote Activity</h4>
          <div className="space-y-3">
            {stats.recent_activity.map((activity, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                <div className="flex items-center">
                  <Clock className="h-4 w-4 text-gray-400 mr-3" />
                  <div>
                    <span className="text-sm text-gray-900">{activity.action}</span>
                    <div className="text-xs text-gray-500">{activity.quote_title} - {activity.project_name}</div>
                  </div>
                </div>
                <span className="text-xs text-gray-500">
                  {activity.timestamp ? new Date(activity.timestamp).toLocaleDateString() : 'N/A'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quote Details Modal */}
      {showQuoteModal && selectedQuote && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-purple-700">Quote Details</h2>
                <button
                  onClick={() => setShowQuoteModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XCircle className="h-6 w-6" />
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-medium mb-4">Quote Information</h3>
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm font-medium text-gray-500">Quote Number</label>
                      <p className="text-sm text-gray-900">{selectedQuote.quote_number}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Title</label>
                      <p className="text-sm text-gray-900">{selectedQuote.title}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Status</label>
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(selectedQuote.status)}`}>
                        {selectedQuote.status?.toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Total Amount</label>
                      <p className="text-lg font-bold text-gray-900">€{selectedQuote.total_amount?.toLocaleString()}</p>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-lg font-medium mb-4">Project Information</h3>
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm font-medium text-gray-500">Project</label>
                      <p className="text-sm text-gray-900">{selectedQuote.project?.name}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Company</label>
                      <p className="text-sm text-gray-900">{selectedQuote.company?.name}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Created By</label>
                      <p className="text-sm text-gray-900">{selectedQuote.user?.name}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Valid Until</label>
                      <p className="text-sm text-gray-900">
                        {selectedQuote.valid_until ? new Date(selectedQuote.valid_until).toLocaleDateString() : 'N/A'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Line Items */}
              {selectedQuote.line_items && selectedQuote.line_items.length > 0 && (
                <div className="mt-6">
                  <h3 className="text-lg font-medium mb-4">Line Items</h3>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Quantity</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Unit Price</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {selectedQuote.line_items.map((item, index) => (
                          <tr key={index}>
                            <td className="px-4 py-3 text-sm text-gray-900">{item.description}</td>
                            <td className="px-4 py-3 text-sm text-gray-900">{item.quantity}</td>
                            <td className="px-4 py-3 text-sm text-gray-900">€{item.unit_price?.toLocaleString()}</td>
                            <td className="px-4 py-3 text-sm font-medium text-gray-900">€{item.total?.toLocaleString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  
                  {/* Quote Totals */}
                  <div className="mt-4 border-t pt-4">
                    <div className="flex justify-end">
                      <div className="w-64">
                        <div className="flex justify-between py-1">
                          <span className="text-sm text-gray-600">Subtotal:</span>
                          <span className="text-sm font-medium">€{selectedQuote.subtotal?.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between py-1">
                          <span className="text-sm text-gray-600">VAT:</span>
                          <span className="text-sm font-medium">€{selectedQuote.vat_amount?.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between py-2 border-t font-bold">
                          <span className="text-sm">Total:</span>
                          <span className="text-sm">€{selectedQuote.total_amount?.toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Quote Actions */}
              <div className="mt-6 flex justify-between">
                <div className="flex space-x-2">
                  <select
                    value={selectedQuote.status}
                    onChange={(e) => updateQuoteStatus(selectedQuote.id, e.target.value)}
                    className="border border-gray-300 rounded-md px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="draft">Draft</option>
                    <option value="sent">Sent</option>
                    <option value="accepted">Accepted</option>
                    <option value="rejected">Rejected</option>
                    <option value="expired">Expired</option>
                  </select>
                </div>
                <button
                  onClick={() => setShowQuoteModal(false)}
                  className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuotesOverview;