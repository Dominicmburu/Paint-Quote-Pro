import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Download, Send, Edit, Eye } from 'lucide-react';
import api from '../../services/api';
import Loading from '../common/Loading';

const QuotePreview = () => {
  const { id } = useParams();
  const [quote, setQuote] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadQuote();
  }, [id]);

  console.log(quote);

  const loadQuote = async () => {
    try {
      const response = await api.get(`/quotes/${id}`);
      setQuote(response.data.quote);
    } catch (err) {
      setError('Failed to load quote');
    } finally {
      setLoading(false);
    }
  };

  const downloadPDF = async () => {
    try {
      const response = await api.get(`/quotes/${id}/download`, {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `quote_${quote.quote_number}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      setError('Failed to download quote');
    }
  };

  const sendQuote = async () => {
    try {
      setSending(true);
      await api.post(`/quotes/${id}/send`, {
        client_email: quote.project.client_email
      });
      
      // Reload quote to get updated status
      loadQuote();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to send quote');
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return <Loading message="Loading quote..." />;
  }

  if (!quote) {
    return <div className="text-center py-12 text-red-600">Quote not found</div>;
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-purple-700">Quote Preview</h1>
          <p className="text-gray-600 mt-2">Quote #{quote.quote_number}</p>
        </div>
        
        <div className="flex space-x-4">
          <button
            onClick={downloadPDF}
            className="inline-flex items-center px-4 py-2 border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-md font-medium transition-colors"
          >
            <Download className="h-4 w-4 mr-2" />
            Download PDF
          </button>
          
          {quote.status === 'draft' && quote.project.client_email && (
            <button
              onClick={sendQuote}
              disabled={sending}
              className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-md font-medium transition-colors"
            >
              {sending ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Sending...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Send to Client
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {/* Quote Status */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-medium text-gray-900">Quote Status</h3>
            <p className="text-sm text-gray-600 mt-1">
              Created on {new Date(quote.created_at).toLocaleDateString()}
            </p>
          </div>
          
          <div className="flex items-center space-x-4">
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
              quote.status === 'draft' ? 'bg-gray-100 text-gray-800' :
              quote.status === 'sent' ? 'bg-blue-100 text-blue-800' :
              quote.status === 'accepted' ? 'bg-green-100 text-green-800' :
              'bg-red-100 text-red-800'
            }`}>
              {quote.status.charAt(0).toUpperCase() + quote.status.slice(1)}
            </span>
            
            {quote.sent_at && (
              <span className="text-sm text-gray-500">
                Sent on {new Date(quote.sent_at).toLocaleDateString()}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Quote Content */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        {/* Quote Header */}
        <div className="bg-purple-700 text-white p-6">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-2xl font-bold">{quote.title}</h2>
              <p className="mt-2 opacity-90">{quote.description}</p>
            </div>
            <div className="text-right">
              <p className="text-lg font-semibold">Quote #{quote.quote_number}</p>
              <p className="opacity-90">Valid until: {new Date(quote.valid_until).toLocaleDateString()}</p>
            </div>
          </div>
        </div>

        {/* Client Information */}
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Quote For:</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <p className="text-sm text-gray-600">Client</p>
              <p className="font-medium">{quote.project.client_name || 'Not specified'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Project</p>
              <p className="font-medium">{quote.project.name}</p>
            </div>
            {quote.project.client_email && (
              <div>
                <p className="text-sm text-gray-600">Email</p>
                <p className="font-medium">{quote.project.client_email}</p>
              </div>
            )}
            {quote.project.client_address && (
              <div>
                <p className="text-sm text-gray-600">Address</p>
                <p className="font-medium">{quote.project.client_address}</p>
              </div>
            )}
          </div>
        </div>

        {/* Line Items */}
        <div className="p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Quote Details</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Description
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Quantity
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Unit Price
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {quote.line_items.map((item, index) => (
                  <tr key={index}>
                    <td className="px-4 py-4 text-sm text-gray-900">{item.description}</td>
                    <td className="px-4 py-4 text-sm text-gray-900">{item.quantity}</td>
                    <td className="px-4 py-4 text-sm text-gray-900">£{item.unit_price.toFixed(2)}</td>
                    <td className="px-4 py-4 text-sm font-medium text-gray-900">£{item.total.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Totals */}
        <div className="bg-gray-50 p-6">
          <div className="max-w-sm ml-auto space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Subtotal:</span>
              <span className="text-sm font-medium">£{quote.subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">VAT (20%):</span>
              <span className="text-sm font-medium">£{quote.vat_amount.toFixed(2)}</span>
            </div>
            <div className="border-t pt-2">
              <div className="flex justify-between">
                <span className="text-lg font-semibold text-gray-900">Total:</span>
                <span className="text-xl font-bold text-green-600">£{quote.total_amount.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuotePreview;