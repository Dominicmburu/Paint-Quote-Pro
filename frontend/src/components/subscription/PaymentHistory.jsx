import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft,
  CreditCard, 
  Download, 
  Calendar, 
  DollarSign, 
  Receipt,
  AlertCircle,
  CheckCircle,
  XCircle,
  Clock,
  Building,
  RefreshCw
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useSubscription } from '../../hooks/useSubscription';
import api from '../../services/api';

const PaymentHistory = () => {
  const navigate = useNavigate();
  const { user, company } = useAuth();
  const { subscription } = useSubscription();
  const [paymentHistory, setPaymentHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadPaymentHistory();
  }, []);

  const loadPaymentHistory = async (showRefreshing = false) => {
    try {
      if (showRefreshing) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError('');

      const response = await api.get('/subscriptions/payment-history');
      setPaymentHistory(response.data.payment_history || []);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load payment history');
      console.error('Payment history error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    loadPaymentHistory(true);
  };

  const downloadReceipt = async (paymentId) => {
    try {
      // In a real implementation, this would download a receipt
      console.log('Downloading receipt for payment:', paymentId);
      // For demo purposes, show an alert
      alert('Receipt download would start here');
    } catch (err) {
      setError('Failed to download receipt');
    }
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'succeeded':
      case 'paid':
        return 'text-green-700 bg-green-50 border-green-200';
      case 'pending':
      case 'processing':
        return 'text-yellow-700 bg-yellow-50 border-yellow-200';
      case 'failed':
      case 'declined':
        return 'text-red-700 bg-red-50 border-red-200';
      case 'cancelled':
        return 'text-gray-700 bg-gray-50 border-gray-200';
      default:
        return 'text-gray-700 bg-gray-50 border-gray-200';
    }
  };

  const getStatusIcon = (status) => {
    switch (status?.toLowerCase()) {
      case 'succeeded':
      case 'paid':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'pending':
      case 'processing':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'failed':
      case 'declined':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'cancelled':
        return <XCircle className="h-4 w-4 text-gray-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-GB', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCurrency = (amount, currency = 'GBP') => {
    if (!amount) return '£0.00';
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: currency
    }).format(amount);
  };

  const getPaymentDescription = (payment) => {
    if (payment.description) return payment.description;
    
    // Fallback description based on plan and billing cycle
    if (payment.plan_name && payment.billing_cycle) {
      const planName = payment.plan_name.charAt(0).toUpperCase() + payment.plan_name.slice(1);
      const cycle = payment.billing_cycle.charAt(0).toUpperCase() + payment.billing_cycle.slice(1);
      return `${planName} - ${cycle} Subscription`;
    }
    
    return 'Subscription Payment';
  };

  const calculateTotalSpent = () => {
    return paymentHistory
      .filter(payment => payment.status?.toLowerCase() === 'succeeded')
      .reduce((sum, payment) => sum + (payment.amount || 0), 0);
  };

  if (loading && !refreshing) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          <div className="animate-pulse">
            <div className="bg-gray-200 h-32 rounded-lg mb-4"></div>
            <div className="bg-gray-200 h-64 rounded-lg"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <button
              onClick={() => navigate('/subscription')}
              className="text-gray-500 hover:text-gray-700 mr-4"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-[#4bb4f5] flex items-center">
                <Receipt className="h-8 w-8 mr-3" />
                Payment History
              </h1>
              <p className="text-gray-600 mt-2">
                View all your payment transactions and download receipts
              </p>
            </div>
          </div>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="inline-flex items-center px-4 py-2 border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-md font-medium transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
          <div className="flex items-center">
            <AlertCircle className="h-5 w-5 text-red-400 mr-3" />
            <p className="text-sm text-red-600">{error}</p>
          </div>
        </div>
      )}

      <div className="space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <DollarSign className="h-8 w-8 text-green-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Spent</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(calculateTotalSpent())}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <Receipt className="h-8 w-8 text-blue-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Payments</p>
                <p className="text-2xl font-bold text-gray-900">{paymentHistory.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <CheckCircle className="h-8 w-8 text-green-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Successful</p>
                <p className="text-2xl font-bold text-gray-900">
                  {paymentHistory.filter(p => p.status?.toLowerCase() === 'succeeded').length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <Building className="h-8 w-8 text-purple-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Current Plan</p>
                <p className="text-lg font-bold text-gray-900">
                  {subscription?.plan_name?.charAt(0).toUpperCase() + subscription?.plan_name?.slice(1) || 'Trial'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Payment History Table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900 flex items-center">
              <Calendar className="h-5 w-5 mr-2" />
              Transaction History
            </h3>
          </div>

          {paymentHistory.length === 0 ? (
            <div className="text-center py-12">
              <Receipt className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <h4 className="text-lg font-medium text-gray-900 mb-2">No Payment History</h4>
              <p className="text-gray-600">
                Your payment transactions will appear here once you make your first payment.
              </p>
              {subscription?.status === 'trial' && (
                <button
                  onClick={() => navigate('/subscription/pricing')}
                  className="mt-4 inline-flex items-center px-4 py-2 bg-[#4bb4f5] hover:bg-blue-600 text-white rounded-md font-medium transition-colors"
                >
                  <CreditCard className="h-4 w-4 mr-2" />
                  Subscribe Now
                </button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Description
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
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {paymentHistory.map((payment) => (
                    <tr key={payment.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatDate(payment.transaction_date)}
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900">
                          {getPaymentDescription(payment)}
                        </div>
                        {payment.failure_message && (
                          <div className="text-sm text-red-600 mt-1">
                            {payment.failure_message}
                          </div>
                        )}
                        {payment.stripe_payment_intent_id && (
                          <div className="text-xs text-gray-500 mt-1">
                            ID: {payment.stripe_payment_intent_id}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {payment.plan_name?.charAt(0).toUpperCase() + payment.plan_name?.slice(1) || 'N/A'}
                        </div>
                        {payment.billing_cycle && (
                          <div className="text-xs text-gray-500">
                            {payment.billing_cycle.charAt(0).toUpperCase() + payment.billing_cycle.slice(1)}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {formatCurrency(payment.amount, payment.currency)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(payment.status)}`}>
                          {getStatusIcon(payment.status)}
                          <span className="ml-1 capitalize">{payment.status || 'Unknown'}</span>
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        {payment.status?.toLowerCase() === 'succeeded' ? (
                          <button
                            onClick={() => downloadReceipt(payment.id)}
                            className="text-[#4bb4f5] hover:text-blue-600 flex items-center"
                          >
                            <Download className="h-4 w-4 mr-1" />
                            Receipt
                          </button>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Additional Information */}
        {paymentHistory.length > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h4 className="text-sm font-medium text-blue-900 mb-3">Payment Information:</h4>
            <ul className="text-sm text-blue-800 space-y-2">
              <li>• <strong>Receipts:</strong> Download receipts for successful payments for your records</li>
              <li>• <strong>Failed Payments:</strong> Contact support if you need help with failed transactions</li>
              <li>• <strong>Billing Cycles:</strong> Monthly plans bill on the same date each month, yearly plans bill annually</li>
              <li>• <strong>Refunds:</strong> Contact our support team if you need assistance with refunds</li>
              <li>• All payments are processed securely through Stripe</li>
            </ul>
          </div>
        )}

        {/* Contact Support */}
        <div className="text-center py-6">
          <p className="text-gray-600 mb-4">
            Need help with your payments or have questions about billing?
          </p>
          <button
            onClick={() => navigate('/support')}
            className="inline-flex items-center px-6 py-2 border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-md font-medium transition-colors"
          >
            Contact Support
          </button>
        </div>
      </div>
    </div>
  );
};

export default PaymentHistory;