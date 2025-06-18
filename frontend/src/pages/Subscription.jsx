import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  CreditCard, 
  FileText, 
  TrendingUp,
  Settings as SettingsIcon,
  ChevronRight,
  Crown,
  Receipt
} from 'lucide-react';
import { useSubscription } from '../hooks/useSubscription';
import { useAuth } from '../hooks/useAuth';

const Subscription = () => {
  const navigate = useNavigate();
  const { subscription } = useSubscription();
  const { company } = useAuth();

  const subscriptionSections = [
    {
      id: 'plans',
      name: 'Pricing Plans',
      description: 'View and upgrade your subscription plan, compare features and pricing',
      icon: TrendingUp,
      path: '/subscription/plans'
    },
    // {
    //   id: 'status',
    //   name: 'Subscription Status',
    //   description: 'Check your current plan, usage statistics, and subscription details',
    //   icon: FileText,
    //   path: '/subscription/status'
    // },
    {
      id: 'billing',
      name: 'Billing Information',
      description: 'Manage payment methods, view invoices, and update billing details',
      icon: Receipt,
      path: '/subscription/billing'
    }
  ];

  const getStatusColor = () => {
    if (!subscription) return 'text-gray-700 bg-gray-50 border-gray-200';
    
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
    if (!subscription) return 'No Active Subscription';
    
    switch (subscription.status) {
      case 'active':
        return 'Active Subscription';
      case 'trial':
        return `Free Trial (${subscription.days_remaining} days left)`;
      case 'past_due':
        return 'Payment Required';
      case 'cancelled':
        return 'Cancelled';
      default:
        return 'Unknown Status';
    }
  };

  const planDisplayNames = {
    starter: 'Starter',
    professional: 'Professional',
    business: 'Business',
    enterprise: 'Enterprise'
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center mb-4">
          <button
            onClick={() => navigate('/dashboard')}
            className="text-gray-500 hover:text-gray-700 mr-4"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="text-3xl font-bold text-purple-700 flex items-center">
            <Crown className="h-8 w-8 mr-3" />
            Subscription
          </h1>
        </div>
        <p className="text-gray-600">
          Manage your subscription, billing, and account preferences
        </p>
      </div>

      {/* Current Subscription Status */}
      {subscription && (
        <div className="mb-8 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">Current Subscription</h3>
            <div className={`px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor()}`}>
              {getStatusText()}
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-gray-500">Plan</p>
              <p className="text-lg font-semibold text-gray-900">
                {planDisplayNames[subscription.plan_name]} - {subscription.billing_cycle}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Projects Used</p>
              <p className="text-lg font-semibold text-gray-900">
                {subscription.projects_used_this_month} / {subscription.max_projects === -1 ? '∞' : subscription.max_projects}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Company</p>
              <p className="text-lg font-semibold text-gray-900">
                {company?.name || 'N/A'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* No Subscription State */}
      {!subscription && (
        <div className="mb-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <div className="flex items-center">
            <Crown className="h-8 w-8 text-blue-600 mr-4" />
            <div>
              <h3 className="text-lg font-medium text-blue-900">Start Your Journey</h3>
              <p className="text-blue-700">
                Choose a subscription plan to unlock all features and start creating professional quotes.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Subscription Management Cards */}
      <div className="space-y-4">
        {subscriptionSections.map((section) => {
          const Icon = section.icon;
          return (
            <div
              key={section.id}
              onClick={() => navigate(section.path)}
              className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow cursor-pointer group"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <Icon className="h-8 w-8 text-purple-600" />
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-medium text-gray-900 group-hover:text-purple-700 transition-colors">
                      {section.name}
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">
                      {section.description}
                    </p>
                  </div>
                </div>
                <ChevronRight className="h-5 w-5 text-gray-400 group-hover:text-purple-600 transition-colors" />
              </div>
            </div>
          );
        })}
      </div>

      {/* Usage Warning */}
      {subscription && subscription.max_projects !== -1 && 
       (subscription.projects_used_this_month / subscription.max_projects) > 0.75 && (
        <div className="mt-8 bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <div className="flex items-start">
            <TrendingUp className="h-5 w-5 text-yellow-400 mt-0.5 mr-3" />
            <div>
              <h4 className="text-sm font-medium text-yellow-900">Usage Alert</h4>
              <p className="text-sm text-yellow-800 mt-1">
                You're using {Math.round((subscription.projects_used_this_month / subscription.max_projects) * 100)}% 
                of your monthly project limit. Consider upgrading to avoid hitting your limit.
              </p>
              <button
                onClick={() => navigate('/subscription/plans')}
                className="inline-flex items-center mt-2 text-sm font-medium text-yellow-600 hover:text-yellow-700"
              >
                View Upgrade Options
                <ChevronRight className="h-4 w-4 ml-1" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Help Section */}
      <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h4 className="text-sm font-medium text-blue-900 mb-3">💡 Subscription Help:</h4>
        <ul className="text-sm text-blue-800 space-y-2">
          <li>• <strong>Pricing Plans:</strong> Compare features and upgrade or downgrade your plan anytime</li>
          <li>• <strong>Billing Information:</strong> Manage payment methods and access your invoice history</li>
          <li>• Need help? Contact our support team for assistance with your subscription</li>
        </ul>
      </div>
    </div>
  );
};

export default Subscription;