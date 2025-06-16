import React, { useState, useEffect } from 'react';
import { 
  CreditCard, 
  Download, 
  Calendar, 
  DollarSign, 
  Receipt,
  AlertCircle,
  CheckCircle,
  Edit3
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useSubscription } from '../../hooks/useSubscription';
import api from '../../services/api';

const BillingInfo = () => {
  const { user, company } = useAuth();
  const { subscription } = useSubscription();
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showUpdatePayment, setShowUpdatePayment] = useState(false);

  useEffect(() => {
    loadBillingData();
  }, []);

  const loadBillingData = async () => {
    try {
      setLoading(true);
      // In a real app, you'd fetch invoices from Stripe or your backend
      // For now, we'll simulate some invoice data
      const mockInvoices = [
        {
          id: 'inv_1',
          number: 'PQP-2025-001',
          date: '2025-06-01',
          amount: 79.00,
          status: 'paid',
          plan: 'Professional',
          period: 'Jun 2025'
        },
        {
          id: 'inv_2',
          number: 'PQP-2025-002',
          date: '2025-05-01',
          amount: 79.00,
          status: 'paid',
          plan: 'Professional',
          period: 'May 2025'
        }
      ];
      setInvoices(mockInvoices);
    } catch (err) {
      setError('Failed to load billing information');
    } finally {
      setLoading(false);
    }
  };

  const downloadInvoice = async (invoiceId) => {
    try {
      // In a real app, you'd call your backend to get the invoice PDF
      console.log('Downloading invoice:', invoiceId);
      // For demo purposes, we'll just show an alert
      alert('Invoice download would start here');
    } catch (err) {
      setError('Failed to download invoice');
    }
  };

  const handleUpdatePaymentMethod = () => {
    // In a real app, you'd redirect to Stripe's customer portal
    // or show a payment method update form
    setShowUpdatePayment(true);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'paid':
        return 'text-green-700 bg-green-50 border-green-200';
      case 'pending':
        return 'text-yellow-700 bg-yellow-50 border-yellow-200';
      case 'failed':
        return 'text-red-700 bg-red-50 border-red-200';
      default:
        return 'text-gray-700 bg-gray-50 border-gray-200';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'paid':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'pending':
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      case 'failed':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP'
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="bg-gray-200 h-32 rounded-lg mb-4"></div>
          <div className="bg-gray-200 h-64 rounded-lg"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex items-center">
            <AlertCircle className="h-5 w-5 text-red-400 mr-3" />
            <p className="text-sm text-red-600">{error}</p>
          </div>
        </div>
      )}

      {/* Payment Method */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900 flex items-center">
            <CreditCard className="h-5 w-5 mr-2" />
            Payment Method
          </h3>
          <button
            onClick={handleUpdatePaymentMethod}
            className="inline-flex items-center px-3 py-1 border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-md text-sm font-medium transition-colors"
          >
            <Edit3 className="h-4 w-4 mr-1" />
            Update
          </button>
        </div>

        {subscription?.status === 'trial' ? (
          <div className="text-center py-8">
            <CreditCard className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h4 className="text-lg font-medium text-gray-900 mb-2">No Payment Method</h4>
            <p className="text-gray-600 mb-4">
              You're currently on a free trial. Add a payment method to continue after your trial ends.
            </p>
            <button
              onClick={handleUpdatePaymentMethod}
              className="inline-flex items-center px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-md font-medium transition-colors"
            >
              <CreditCard className="h-4 w-4 mr-2" />
              Add Payment Method
            </button>
          </div>
        ) : (
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <CreditCard className="h-8 w-8 text-gray-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-900">•••• •••• •••• 4242</p>
              <p className="text-sm text-gray-500">Expires 12/26</p>
            </div>
            <div className="ml-auto">
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                Active
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Billing Address */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">Billing Address</h3>
          <button className="text-purple-600 hover:text-purple-700 text-sm font-medium">
            Edit
          </button>
        </div>
        
        <div className="text-gray-700">
          <p className="font-medium">{company?.name}</p>
          {company?.address ? (
            <p className="mt-1 whitespace-pre-line">{company.address}</p>
          ) : (
            <p className="mt-1 text-gray-500 italic">No billing address set</p>
          )}
          {company?.vat_number && (
            <p className="mt-2 text-sm">VAT Number: {company.vat_number}</p>
          )}
        </div>
      </div>

      {/* Invoice History */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
          <Receipt className="h-5 w-5 mr-2" />
          Invoice History
        </h3>

        {invoices.length === 0 ? (
          <div className="text-center py-8">
            <Receipt className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h4 className="text-lg font-medium text-gray-900 mb-2">No Invoices Yet</h4>
            <p className="text-gray-600">
              Your invoices will appear here once you start your subscription.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Invoice
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
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
                {invoices.map((invoice) => (
                  <tr key={invoice.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {invoice.number}
                      </div>
                      <div className="text-sm text-gray-500">
                        {invoice.period}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatDate(invoice.date)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {invoice.plan}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {formatCurrency(invoice.amount)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(invoice.status)}`}>
                        {getStatusIcon(invoice.status)}
                        <span className="ml-1 capitalize">{invoice.status}</span>
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => downloadInvoice(invoice.id)}
                        className="text-purple-600 hover:text-purple-700 flex items-center"
                      >
                        <Download className="h-4 w-4 mr-1" />
                        Download
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Billing Summary */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
          <DollarSign className="h-5 w-5 mr-2" />
          Billing Summary
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">
              {formatCurrency(invoices.reduce((sum, inv) => sum + inv.amount, 0))}
            </div>
            <div className="text-sm text-gray-500">Total Spent</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">
              {subscription?.billing_cycle === 'yearly' ? formatCurrency(79 * 12) : formatCurrency(79)}
            </div>
            <div className="text-sm text-gray-500">
              Current Plan {subscription?.billing_cycle === 'yearly' ? '(Annual)' : '(Monthly)'}
            </div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">
              {subscription?.current_period_end ? 
                formatDate(subscription.current_period_end) : 
                'N/A'
              }
            </div>
            <div className="text-sm text-gray-500">Next Billing Date</div>
          </div>
        </div>
      </div>

      {/* Update Payment Modal */}
      {showUpdatePayment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Update Payment Method
            </h3>
            <p className="text-gray-600 mb-6">
              You'll be redirected to our secure payment processor to update your payment information.
            </p>
            <div className="flex space-x-4">
              <button
                onClick={() => setShowUpdatePayment(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-md font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  // In a real app, redirect to Stripe customer portal
                  alert('Would redirect to payment update page');
                  setShowUpdatePayment(false);
                }}
                className="flex-1 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-md font-medium transition-colors"
              >
                Continue
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BillingInfo;