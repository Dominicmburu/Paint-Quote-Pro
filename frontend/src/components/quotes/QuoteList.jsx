import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Search, 
  Filter, 
  FileText, 
  CheckCircle, 
  Clock, 
  Edit2,
  Calendar,
  DollarSign
} from 'lucide-react';
import api from '../../services/api';
import Loading from '../common/Loading';

const QuoteList = () => {
  const [quotes, setQuotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [signatureStatuses, setSignatureStatuses] = useState({});

  useEffect(() => {
    loadQuotes();
  }, [statusFilter]);

  const loadQuotes = async () => {
    try {
      setLoading(true);
      const response = await api.get('/quotes', {
        params: {
          status: statusFilter === 'all' ? undefined : statusFilter,
          search: searchTerm || undefined
        }
      });
      
      const quotesData = response.data.quotes || [];
      setQuotes(quotesData);

      // Load signature status for each quote
      const statuses = {};
      for (const quote of quotesData) {
        try {
          const statusResponse = await api.get(`/quotes/${quote.id}/signature-status`);
          statuses[quote.id] = statusResponse.data;
        } catch (error) {
          console.error(`Failed to load signature status for quote ${quote.id}:`, error);
        }
      }
      setSignatureStatuses(statuses);

    } catch (error) {
      console.error('Failed to load quotes:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    loadQuotes();
  };

  const getStatusIcon = (quote) => {
    const signatureStatus = signatureStatuses[quote.id];
    
    if (signatureStatus?.is_signed) {
      return <CheckCircle className="h-4 w-4 text-green-600" />;
    }
    
    switch (quote.status) {
      case 'draft':
        return <FileText className="h-4 w-4 text-gray-600" />;
      case 'sent':
        return <Edit2 className="h-4 w-4 text-orange-600" />;
      case 'accepted':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusText = (quote) => {
    const signatureStatus = signatureStatuses[quote.id];
    
    if (signatureStatus?.is_signed) {
      return 'Signed';
    }
    
    switch (quote.status) {
      case 'draft':
        return 'Draft';
      case 'sent':
        return 'Awaiting Signature';
      case 'accepted':
        return 'Accepted';
      default:
        return quote.status;
    }
  };

  const statusOptions = [
    { value: 'all', label: 'All Quotes' },
    { value: 'draft', label: 'Draft' },
    { value: 'sent', label: 'Sent' },
    { value: 'accepted', label: 'Accepted' }
  ];

  if (loading) {
    return <Loading />;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Quotes</h1>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
        <div className="flex flex-col md:flex-row gap-4">
          <form onSubmit={handleSearch} className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search quotes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </form>

          <div className="flex items-center space-x-2">
            <Filter className="h-4 w-4 text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {statusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Quotes List */}
      {quotes.length > 0 ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
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
                    Client
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {quotes.map((quote) => {
                  const signatureStatus = signatureStatuses[quote.id];
                  
                  return (
                    <tr key={quote.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {quote.quote_number}
                          </div>
                          <div className="text-sm text-gray-500">
                            {quote.title}
                          </div>
                        </div>
                      </td>
                      
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {quote.project_name}
                      </td>
                      
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {quote.client_company_name}
                      </td>
                      
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center text-sm text-gray-900">
                          <DollarSign className="h-4 w-4 mr-1 text-gray-400" />
                          €{quote.total_amount.toLocaleString()}
                        </div>
                      </td>
                      
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                          {getStatusIcon(quote)}
                          <span className="ml-1">{getStatusText(quote)}</span>
                        </span>
                        {signatureStatus?.is_signed && signatureStatus.signature && (
                          <div className="text-xs text-gray-500 mt-1">
                            by {signatureStatus.signature.client_name}
                          </div>
                        )}
                      </td>
                      
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center text-sm text-gray-500">
                          <Calendar className="h-4 w-4 mr-1" />
                          {new Date(quote.created_at).toLocaleDateString()}
                        </div>
                      </td>
                      
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <Link
                          to={`/quotes/${quote.id}`}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          View
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="text-center py-12">
          <FileText className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No quotes found</h3>
          <p className="text-gray-500">
            {searchTerm || statusFilter !== 'all' 
              ? 'Try adjusting your search or filter criteria.'
              : 'Quotes will appear here once you create them from projects.'
            }
          </p>
        </div>
      )}
    </div>
  );
};

export default QuoteList;