import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  CreditCard, 
  Calendar, 
  Users, 
  FileText, 
  AlertTriangle, 
  CheckCircle, 
  Clock,
  TrendingUp,
  Settings
} from 'lucide-react';
import { useSubscription } from '../../hooks/useSubscription';
import { useAuth } from '../../hooks/useAuth';

const SubscriptionStatus = () => {
  const { subscription } = useSubscription();
  const { company } = useAuth();
  const [showCancelModal, setShowCancelModal] = useState(false);

  if (!subscription) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Subscription Found</h3>
          <p className="text-gray-600 mb-4">
            You don't have an active subscription. Start your free trial today!
          </p>
          <Link
            to="/subscription"
            className="inline-flex items-center px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-md font-medium transition-colors"
          >
            <TrendingUp className="h-4 w-4 mr-2" />
            Choose a Plan
          </Link>
        </div>
      </div>
    );
  }

  const getStatusIcon = () => {
    switch (subscription.status) {
      case 'active':
        return <CheckCircle className="h-6 w-6 text-green-500" />;
      case 'trial':
        return <Clock className="h-6 w-6 text-blue-500" />;
      case 'past_due':
        return <AlertTriangle className="h-6 w-6 text-yellow-500" />;
      case 'cancelled':
        return <AlertTriangle className="h-6 w-6 text-red-500" />;
      default:
        return <AlertTriangle className="h-6 w-6 text-gray-500" />;
    }
  };

  const getStatusColor = () => {
    switch (subscription.status) {
      case 'active':
        return 'text-green-700 bg-green-50 border-green-200';
      case 'trial':
        return 'text-blue-700 bg-blue-50 border-blue-200';
      case 'past_due':
        return 'text-yellow-700 bg-yellow-50 border-yellow-200';
      case 'cancelled':
        return 'text-red-700 bg-red-50 border-red-200';
      default:
        return 'text-gray-700 bg-gray-50 border-gray-200';
    }
  };

  const getStatusText = () => {
    switch (subscription.status) {
      case 'active':
        return 'Active';
      case 'trial':
        return `Trial (${subscription.days_remaining} days left)`;
      case 'past_due':
        return 'Payment Required';
      case 'cancelled':
        return 'Cancelled';
      default:
        return 'Unknown';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-GB', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getUsagePercentage = () => {
    if (subscription.max_projects === -1) return 0; // Unlimited
    return (subscription.projects_used_this_month / subscription.max_projects) * 100;
  };

  const planDisplayNames = {
    starter: 'Starter',
    professional: 'Professional',
    business: 'Business',
    enterprise: 'Enterprise'
  };

  return (
    <div className="space-y-6">
      {/* Current Plan Status */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            {getStatusIcon()}
            <h3 className="text-lg font-medium text-gray-900 ml-3">
              Subscription Status
            </h3>
          </div>
          <div className={`px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor()}`}>
            {getStatusText()}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="text-sm font-medium text-gray-500 mb-2">Current Plan</h4>
            <p className="text-xl font-semibold text-gray-900">
              {planDisplayNames[subscription.plan_name]} - {subscription.billing_cycle}
            </p>
          </div>
          <div>
            <h4 className="text-sm font-medium text-gray-500 mb-2">Company</h4>
            <p className="text-xl font-semibold text-gray-900">
              {company?.name || 'N/A'}
            </p>
          </div>
        </div>
      </div>

      {/* Usage Stats */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Usage This Month</h3>
        
        <div className="space-y-4">
          {/* Projects Usage */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center">
                <FileText className="h-5 w-5 text-purple-600 mr-2" />
                <span className="text-sm font-medium text-gray-700">Projects</span>
              </div>
              <span className="text-sm text-gray-600">
                {subscription.projects_used_this_month} / {subscription.max_projects === -1 ? '∞' : subscription.max_projects}
              </span>
            </div>
            {subscription.max_projects !== -1 && (
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full ${
                    getUsagePercentage() > 80 ? 'bg-red-500' : 
                    getUsagePercentage() > 60 ? 'bg-yellow-500' : 'bg-green-500'
                  }`}
                  style={{ width: `${Math.min(getUsagePercentage(), 100)}%` }}
                />
              </div>
            )}
          </div>

          {/* Team Members */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center">
                <Users className="h-5 w-5 text-purple-600 mr-2" />
                <span className="text-sm font-medium text-gray-700">Team Members</span>
              </div>
              <span className="text-sm text-gray-600">
                1 / {subscription.max_users === -1 ? '∞' : subscription.max_users}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Billing Information */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900 flex items-center">
            <CreditCard className="h-5 w-5 mr-2" />
            Billing Information
          </h3>
          <Link
            to="/subscription"
            className="text-purple-600 hover:text-purple-700 text-sm font-medium"
          >
            Manage Billing
          </Link>
        </div>

        <div className="space-y-4">
          {subscription.status === 'trial' ? (
            <div>
              <h4 className="text-sm font-medium text-gray-500 mb-1">Trial Period</h4>
              <p className="text-gray-900">
                Ends on {formatDate(subscription.trial_end)}
              </p>
              <p className="text-sm text-gray-600 mt-1">
                {subscription.days_remaining} days remaining
              </p>
            </div>
          ) : (
            <>
              <div>
                <h4 className="text-sm font-medium text-gray-500 mb-1">Current Period</h4>
                <p className="text-gray-900">
                  {formatDate(subscription.current_period_start)} - {formatDate(subscription.current_period_end)}
                </p>
              </div>
              {subscription.status === 'past_due' && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
                  <div className="flex items-center">
                    <AlertTriangle className="h-5 w-5 text-yellow-400 mr-2" />
                    <div>
                      <h4 className="text-sm font-medium text-yellow-800">Payment Required</h4>
                      <p className="text-sm text-yellow-700 mt-1">
                        Your payment is past due. Please update your payment method to continue using our services.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h3>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Link
            to="/subscription"
            className="inline-flex items-center justify-center px-4 py-2 border border-purple-300 text-purple-700 hover:bg-purple-50 rounded-md font-medium transition-colors"
          >
            <TrendingUp className="h-4 w-4 mr-2" />
            Upgrade Plan
          </Link>
          
          <Link
            to="/settings"
            className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-md font-medium transition-colors"
          >
            <Settings className="h-4 w-4 mr-2" />
            Account Settings
          </Link>
        </div>

        {subscription.status === 'active' && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <button
              onClick={() => setShowCancelModal(true)}
              className="text-sm text-red-600 hover:text-red-700 font-medium"
            >
              Cancel Subscription
            </button>
          </div>
        )}
      </div>

      {/* Usage Recommendations */}
      {subscription.max_projects !== -1 && getUsagePercentage() > 75 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start">
            <TrendingUp className="h-5 w-5 text-blue-400 mt-0.5 mr-3" />
            <div>
              <h4 className="text-sm font-medium text-blue-900">Consider Upgrading</h4>
              <p className="text-sm text-blue-800 mt-1">
                You're using {Math.round(getUsagePercentage())}% of your monthly project limit. 
                Upgrade to a higher plan to get more projects and additional features.
              </p>
              <Link
                to="/subscription"
                className="inline-flex items-center mt-2 text-sm font-medium text-blue-600 hover:text-blue-700"
              >
                View Plans
                <TrendingUp className="h-4 w-4 ml-1" />
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Subscription Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Cancel Subscription
            </h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to cancel your subscription? You'll continue to have access until the end of your current billing period.
            </p>
            <div className="flex space-x-4">
              <button
                onClick={() => setShowCancelModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-md font-medium transition-colors"
              >
                Keep Subscription
              </button>
              <button
                onClick={() => {
                  // Handle cancellation
                  setShowCancelModal(false);
                }}
                className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md font-medium transition-colors"
              >
                Cancel Subscription
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SubscriptionStatus;