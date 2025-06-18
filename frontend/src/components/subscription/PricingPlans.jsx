import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, Star, Users, FileText, Clock, CreditCard, ArrowLeft } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useSubscription } from '../../hooks/useSubscription';
import api from '../../services/api';
import Loading from '../common/Loading';

const PricingPlans = () => {
  const navigate = useNavigate();
  const { user, company } = useAuth();
  const { subscription: currentSubscription, refreshSubscription } = useSubscription();
  const [plans, setPlans] = useState({});
  const [loading, setLoading] = useState(true);
  const [processingPlan, setProcessingPlan] = useState(null);
  const [billingCycle, setBillingCycle] = useState('monthly');
  const [error, setError] = useState('');

  useEffect(() => {
    loadPlans();
  }, []);

  const loadPlans = async () => {
    try {
      const response = await api.get('/subscriptions/plans');
      setPlans(response.data.plans);
    } catch (err) {
      setError('Failed to load pricing plans');
    } finally {
      setLoading(false);
    }
  };

  const handleUpgrade = async (planName) => {
    if (processingPlan) return;
    
    try {
      setProcessingPlan(planName);
      setError('');

      const response = await api.post('/subscriptions/create-checkout-session', {
        plan_name: planName,
        billing_cycle: billingCycle
      });

      // Redirect to Stripe Checkout
      window.location.href = response.data.checkout_url;
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to start upgrade process');
      setProcessingPlan(null);
    }
  };

  const getMonthlyPrice = (plan) => {
    const prices = {
      starter: { monthly: 29, yearly: 290 },
      professional: { monthly: 79, yearly: 790 },
      business: { monthly: 149, yearly: 1490 },
      enterprise: { monthly: 299, yearly: 2990 }
    };
    
    if (billingCycle === 'yearly') {
      return Math.round(prices[plan]?.yearly / 12) || 0;
    }
    return prices[plan]?.monthly || 0;
  };

  const getYearlyPrice = (plan) => {
    const prices = {
      starter: 290,
      professional: 790,
      business: 1490,
      enterprise: 2990
    };
    return prices[plan] || 0;
  };

  const getCurrentPlanFeatures = () => {
    if (!currentSubscription) return null;
    return plans[currentSubscription.plan_name];
  };

  const isCurrentPlan = (planName) => {
    return currentSubscription?.plan_name === planName;
  };

  const isDowngrade = (planName) => {
    const planOrder = { starter: 1, professional: 2, business: 3, enterprise: 4 };
    const currentOrder = planOrder[currentSubscription?.plan_name] || 0;
    const targetOrder = planOrder[planName] || 0;
    return targetOrder < currentOrder;
  };

  if (loading) {
    return <Loading message="Loading pricing plans..." />;
  }

  const planNames = ['starter', 'professional', 'business', 'enterprise'];
  const planDisplayNames = {
    starter: 'Starter',
    professional: 'Professional',
    business: 'Business',
    enterprise: 'Enterprise'
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center mb-4">
          <button
            onClick={() => navigate('/subscription')}
            className="text-gray-500 hover:text-gray-700 mr-4"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-purple-700">Subscription Plans</h1>
            <p className="text-gray-600 mt-2">
              Choose the perfect plan for your painting business
            </p>
          </div>
        </div>

        {currentSubscription && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-blue-900">Current Plan</h3>
                <p className="text-blue-700">
                  {planDisplayNames[currentSubscription.plan_name]} - {currentSubscription.billing_cycle}
                  {currentSubscription.status === 'trial' && (
                    <span className="ml-2 text-sm">
                      (Trial: {currentSubscription.days_remaining} days remaining)
                    </span>
                  )}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-blue-600">
                  {currentSubscription.projects_used_this_month} / {currentSubscription.max_projects === -1 ? '∞' : currentSubscription.max_projects} projects used
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {/* Billing Toggle */}
      <div className="flex justify-center mb-8">
        <div className="bg-gray-100 p-1 rounded-lg">
          <button
            onClick={() => setBillingCycle('monthly')}
            className={`px-6 py-2 rounded-md font-medium transition-colors ${
              billingCycle === 'monthly'
                ? 'bg-white text-purple-700 shadow-sm'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            Monthly
          </button>
          <button
            onClick={() => setBillingCycle('yearly')}
            className={`px-6 py-2 rounded-md font-medium transition-colors ${
              billingCycle === 'yearly'
                ? 'bg-white text-purple-700 shadow-sm'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            Yearly
            <span className="ml-2 text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
              Save 17%
            </span>
          </button>
        </div>
      </div>

      {/* Pricing Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {planNames.map((planName) => {
          const plan = plans[planName];
          if (!plan) return null;

          const monthlyPrice = getMonthlyPrice(planName);
          const yearlyPrice = getYearlyPrice(planName);
          const isCurrent = isCurrentPlan(planName);
          const isProfessional = planName === 'professional';

          return (
            <div
              key={planName}
              className={`relative bg-white rounded-lg border-2 p-6 ${
                isProfessional
                  ? 'border-purple-500 shadow-lg scale-105'
                  : isCurrent
                  ? 'border-green-500'
                  : 'border-gray-200'
              }`}
            >
              {isProfessional && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <span className="bg-purple-500 text-white px-3 py-1 rounded-full text-sm font-medium flex items-center">
                    <Star className="h-4 w-4 mr-1" />
                    Most Popular
                  </span>
                </div>
              )}

              {isCurrent && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <span className="bg-green-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                    Current Plan
                  </span>
                </div>
              )}

              <div className="text-center mb-6">
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  {planDisplayNames[planName]}
                </h3>
                <div className="mb-4">
                  <span className="text-4xl font-bold text-gray-900">
                    £{billingCycle === 'yearly' ? monthlyPrice : monthlyPrice}
                  </span>
                  <span className="text-gray-600">/month</span>
                  {billingCycle === 'yearly' && (
                    <div className="text-sm text-gray-500">
                      £{yearlyPrice} billed annually
                    </div>
                  )}
                </div>
              </div>

              {/* Features */}
              <div className="space-y-4 mb-6">
                <div className="flex items-center">
                  <FileText className="h-5 w-5 text-purple-600 mr-3" />
                  <span className="text-gray-700">
                    {plan.max_projects === -1 ? 'Unlimited' : plan.max_projects} projects/month
                  </span>
                </div>
                <div className="flex items-center">
                  <Users className="h-5 w-5 text-purple-600 mr-3" />
                  <span className="text-gray-700">
                    {plan.max_users === -1 ? 'Unlimited' : plan.max_users} team members
                  </span>
                </div>
                <div className="flex items-center">
                  <Check className="h-5 w-5 text-green-500 mr-3" />
                  <span className="text-gray-700">AI Floor Plan Analysis</span>
                </div>
                <div className="flex items-center">
                  <Check className="h-5 w-5 text-green-500 mr-3" />
                  <span className="text-gray-700">PDF Quote Generation</span>
                </div>
                {(planName === 'professional' || planName === 'business' || planName === 'enterprise') && (
                  <div className="flex items-center">
                    <Check className="h-5 w-5 text-green-500 mr-3" />
                    <span className="text-gray-700">Email Integration</span>
                  </div>
                )}
                {(planName === 'business' || planName === 'enterprise') && (
                  <>
                    <div className="flex items-center">
                      <Check className="h-5 w-5 text-green-500 mr-3" />
                      <span className="text-gray-700">Priority Support</span>
                    </div>
                    <div className="flex items-center">
                      <Check className="h-5 w-5 text-green-500 mr-3" />
                      <span className="text-gray-700">Custom Branding</span>
                    </div>
                  </>
                )}
                {planName === 'enterprise' && (
                  <>
                    <div className="flex items-center">
                      <Check className="h-5 w-5 text-green-500 mr-3" />
                      <span className="text-gray-700">API Access</span>
                    </div>
                    <div className="flex items-center">
                      <Check className="h-5 w-5 text-green-500 mr-3" />
                      <span className="text-gray-700">Dedicated Support</span>
                    </div>
                  </>
                )}
              </div>

              {/* Action Button */}
              <div className="text-center">
                {isCurrent ? (
                  <button
                    disabled
                    className="w-full bg-gray-100 text-gray-500 py-2 px-4 rounded-md font-medium cursor-not-allowed"
                  >
                    Current Plan
                  </button>
                ) : (
                  <button
                    onClick={() => handleUpgrade(planName)}
                    disabled={processingPlan === planName}
                    className={`w-full py-2 px-4 rounded-md font-medium transition-colors ${
                      isProfessional
                        ? 'bg-purple-600 hover:bg-purple-700 text-white'
                        : isDowngrade(planName)
                        ? 'bg-gray-600 hover:bg-gray-700 text-white'
                        : 'bg-green-600 hover:bg-green-700 text-white'
                    } disabled:opacity-50`}
                  >
                    {processingPlan === planName ? (
                      <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Processing...
                      </div>
                    ) : isDowngrade(planName) ? (
                      'Downgrade'
                    ) : (
                      'Upgrade Now'
                    )}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* FAQ Section */}
      <div className="mt-16">
        <h2 className="text-2xl font-bold text-center text-gray-900 mb-8">
          Frequently Asked Questions
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Can I change plans anytime?
            </h3>
            <p className="text-gray-600">
              Yes, you can upgrade or downgrade your plan at any time. Changes take effect immediately for upgrades, or at the end of your billing cycle for downgrades.
            </p>
          </div>
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              What happens to my projects if I downgrade?
            </h3>
            <p className="text-gray-600">
              Your existing projects remain accessible. However, you'll be limited to your new plan's project limit for future projects.
            </p>
          </div>
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Do you offer refunds?
            </h3>
            <p className="text-gray-600">
              We offer a 14-day trial period. After that, we don't provide refunds, but you can cancel your subscription at any time.
            </p>
          </div>
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Is my data secure?
            </h3>
            <p className="text-gray-600">
              Absolutely. We use industry-standard encryption and security measures to protect your data. Your information is never shared with third parties.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PricingPlans;