import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  FileText, 
  Eye, 
  Download, 
  Send, 
  Search, 
  Filter,
  Plus,
  Calendar,
  DollarSign,
  User,
  Settings
} from 'lucide-react';
import api from '../../services/api';
import Loading from '../common/Loading';

const QuoteHistory = () => {
  const navigate = useNavigate();
  const [quotes, setQuotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState(null);

  useEffect(() => {
    loadQuotes();
  }, [currentPage, statusFilter, dateFilter, searchTerm]);

  const loadQuotes = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage,
        per_page: 10,
        ...(statusFilter !== 'all' && { status: statusFilter }),
        ...(searchTerm && { search: searchTerm }),
        ...(dateFilter !== 'all' && { date_filter: dateFilter })
      });

      const response = await api.get(`/quotes?${params}`);
      setQuotes(response.data.quotes);
      setPagination(response.data.pagination);
    } catch (err) {
      setError('Failed to load quotes');
    } finally {
      setLoading(false);
    }
  };

  const downloadQuote = async (quoteId, quoteNumber) => {
    try {
      const response = await api.get(`/quotes/${quoteId}/download`, {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `quote_${quoteNumber}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      setError('Failed to download quote');
    }
  };

  const sendQuote = async (quoteId) => {
    try {
      await api.post(`/quotes/${quoteId}/send`);
      loadQuotes(); // Refresh to show updated status
    } catch (err) {
      setError('Failed to send quote');
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      draft: 'bg-gray-100 text-gray-800',
      sent: 'bg-blue-100 text-blue-800',
      viewed: 'bg-yellow-100 text-yellow-800',
      accepted: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
      expired: 'bg-orange-100 text-orange-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const filteredQuotes = quotes.filter(quote => {
    const matchesSearch = !searchTerm || 
      quote.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      quote.project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      quote.project.client_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      quote.quote_number.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesSearch;
  });

  if (loading && quotes.length === 0) {
    return <Loading message="Loading quotes..." />;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-purple-700">Quote History</h1>
          <p className="text-gray-600 mt-2">Manage all your project quotes</p>
        </div>
        
        <div className="flex space-x-4 mt-4 sm:mt-0">
          <Link
            to="/quotes/settings"
            className="inline-flex items-center px-4 py-2 border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-md font-medium transition-colors"
          >
            <Settings className="h-4 w-4 mr-2" />
            Quote Settings
          </Link>
          <Link
            to="/projects"
            className="inline-flex items-center px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md font-medium transition-colors"
          >
            <Plus className="h-4 w-4 mr-2" />
            New Quote
          </Link>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="h-5 w-5 absolute left-3 top-3 text-gray-400" />
            <input
              type="text"
              placeholder="Search quotes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="all">All Statuses</option>
              <option value="draft">Draft</option>
              <option value="sent">Sent</option>
              <option value="viewed">Viewed</option>
              <option value="accepted">Accepted</option>
              <option value="rejected">Rejected</option>
              <option value="expired">Expired</option>
            </select>
          </div>

          {/* Date Filter */}
          <div>
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="all">All Time</option>
              <option value="today">Today</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
              <option value="quarter">This Quarter</option>
              <option value="year">This Year</option>
            </select>
          </div>

          {/* Clear Filters */}
          <div>
            <button
              onClick={() => {
                setSearchTerm('');
                setStatusFilter('all');
                setDateFilter('all');
              }}
              className="w-full px-4 py-2 border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-md transition-colors"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Quotes List */}
      {filteredQuotes.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
          <FileText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No quotes found</h3>
          <p className="text-gray-500 mb-6">
            {searchTerm || statusFilter !== 'all' || dateFilter !== 'all'
              ? 'Try adjusting your filters or search terms.'
              : 'Create your first quote to get started.'}
          </p>
          <Link
            to="/projects"
            className="inline-flex items-center px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-md font-medium transition-colors"
          >
            <Plus className="h-4 w-4 mr-2" />
            Create First Quote
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Quote
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Client & Project
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredQuotes.map((quote) => (
                  <tr key={quote.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {quote.quote_number}
                        </div>
                        <div className="text-sm text-gray-500 truncate max-w-xs">
                          {quote.title}
                        </div>
                      </div>
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {quote.project.client_name || 'No client name'}
                        </div>
                        <div className="text-sm text-gray-500">
                          {quote.project.name}
                        </div>
                      </div>
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        €{quote.total_amount?.toFixed(2) || '0.00'}
                      </div>
                      <div className="text-sm text-gray-500">
                        {quote.line_items?.length || 0} items
                      </div>
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(quote.status)}`}>
                        {quote.status.charAt(0).toUpperCase() + quote.status.slice(1)}
                      </span>
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div>
                        <div>{new Date(quote.created_at).toLocaleDateString()}</div>
                        {quote.sent_at && (
                          <div className="text-xs">
                            Sent: {new Date(quote.sent_at).toLocaleDateString()}
                          </div>
                        )}
                      </div>
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <Link
                          to={`/quotes/${quote.id}`}
                          className="text-purple-600 hover:text-purple-700"
                          title="View Quote"
                        >
                          <Eye className="h-4 w-4" />
                        </Link>
                        
                        <button
                          onClick={() => downloadQuote(quote.id, quote.quote_number)}
                          className="text-green-600 hover:text-green-700"
                          title="Download PDF"
                        >
                          <Download className="h-4 w-4" />
                        </button>
                        
                        {quote.status === 'draft' && quote.project.client_email && (
                          <button
                            onClick={() => sendQuote(quote.id)}
                            className="text-blue-600 hover:text-blue-700"
                            title="Send to Client"
                          >
                            <Send className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pagination && pagination.pages > 1 && (
            <div className="bg-white px-4 py-3 border-t border-gray-200 sm:px-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <p className="text-sm text-gray-700">
                    Showing page <span className="font-medium">{pagination.page}</span> of{' '}
                    <span className="font-medium">{pagination.pages}</span>
                  </p>
                </div>
                
                <div className="flex space-x-2">
                  <button
                    onClick={() => setCurrentPage(currentPage - 1)}
                    disabled={!pagination.has_prev}
                    className="px-3 py-1 border border-gray-300 text-gray-500 hover:bg-gray-50 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setCurrentPage(currentPage + 1)}
                    disabled={!pagination.has_next}
                    className="px-3 py-1 border border-gray-300 text-gray-500 hover:bg-gray-50 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Quick Stats */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <FileText className="h-8 w-8 text-purple-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Quotes</p>
              <p className="text-2xl font-bold text-gray-900">{quotes.length}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <DollarSign className="h-8 w-8 text-green-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Value</p>
              <p className="text-2xl font-bold text-gray-900">
                €{quotes.reduce((sum, quote) => sum + (quote.total_amount || 0), 0).toFixed(2)}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <Send className="h-8 w-8 text-blue-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Sent Quotes</p>
              <p className="text-2xl font-bold text-gray-900">
                {quotes.filter(q => ['sent', 'viewed', 'accepted'].includes(q.status)).length}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <User className="h-8 w-8 text-yellow-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Accepted</p>
              <p className="text-2xl font-bold text-gray-900">
                {quotes.filter(q => q.status === 'accepted').length}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuoteHistory;