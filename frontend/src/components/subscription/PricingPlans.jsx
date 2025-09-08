import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, Star, Users, FileText, Clock, CreditCard, ArrowLeft, Gift } from 'lucide-react';
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

  const getPlanPrice = (planName) => {
    const plan = plans[planName];
    if (!plan) return { monthly: 0, yearly: 0 };
    
    return {
      monthly: plan.price_monthly || 0,
      yearly: plan.price_yearly || 0
    };
  };

  const getDisplayPrice = (planName) => {
    const prices = getPlanPrice(planName);
    if (billingCycle === 'yearly') {
      return {
        monthly: Math.round(prices.yearly / 12),
        yearly: prices.yearly,
        savings: Math.round(((prices.monthly * 12) - prices.yearly) / (prices.monthly * 12) * 100)
      };
    }
    return {
      monthly: prices.monthly,
      yearly: prices.yearly,
      savings: 0
    };
  };

  const isCurrentPlan = (planName) => {
    return currentSubscription?.plan_name === planName;
  };

  const isTrialPlan = () => {
    return currentSubscription?.status === 'trial' && currentSubscription?.plan_name === 'trial';
  };

  const canUpgradeToPlan = (planName) => {
    // If user is on trial, they can subscribe to any paid plan
    if (isTrialPlan()) {
      return planName !== 'trial';
    }
    
    // If user has an active paid subscription, they can change to any other plan
    if (currentSubscription?.status === 'active') {
      return planName !== currentSubscription.plan_name;
    }
    
    // If subscription is expired/cancelled, they can subscribe to any paid plan
    return planName !== 'trial';
  };

  const getButtonText = (planName) => {
    if (isCurrentPlan(planName)) {
      if (currentSubscription?.status === 'trial') {
        return 'Subscribe to Continue';
      }
      if (currentSubscription?.will_cancel_at_period_end) {
        return 'Reactivate Plan';
      }
      return 'Current Plan';
    }
    
    if (isTrialPlan()) {
      return 'Subscribe Now';
    }
    
    if (currentSubscription?.status === 'active') {
      const planOrder = { starter: 1, professional: 2, enterprise: 3 };
      const currentOrder = planOrder[currentSubscription?.plan_name] || 0;
      const targetOrder = planOrder[planName] || 0;
      
      if (targetOrder > currentOrder) {
        return 'Upgrade';
      } else if (targetOrder < currentOrder) {
        return 'Downgrade';
      }
      return 'Switch Plan';
    }
    
    return 'Subscribe';
  };

  const getTotalProjectsAfterUpgrade = (planName) => {
    if (!isTrialPlan()) return null;
    
    const trialProjectsUsed = currentSubscription?.projects_used_this_month || 0;
    const newPlanProjects = plans[planName]?.max_projects || 0;
    
    if (newPlanProjects === -1) return 'Unlimited';
    
    // Add remaining trial projects to new plan projects
    const trialProjectsRemaining = Math.max(0, 3 - trialProjectsUsed);
    return trialProjectsRemaining + newPlanProjects;
  };

  const shouldShowTrialBadge = (planName) => {
    return isTrialPlan() && planName === 'starter';
  };

  const getSubscriptionStatus = () => {
    if (!currentSubscription) return null;
    
    if (currentSubscription.status === 'trial') {
      return {
        type: 'trial',
        message: `Trial: ${currentSubscription.days_remaining} days remaining`,
        color: 'bg-orange-100 text-orange-800 border-orange-200'
      };
    }
    
    if (currentSubscription.status === 'active') {
      const billing = currentSubscription.billing_cycle === 'yearly' ? 'Yearly' : 'Monthly';
      if (currentSubscription.will_cancel_at_period_end) {
        return {
          type: 'cancelling',
          message: `${billing} - Cancels at period end`,
          color: 'bg-red-100 text-red-800 border-red-200'
        };
      }
      return {
        type: 'active',
        message: `${billing} - Active`,
        color: 'bg-green-100 text-green-800 border-green-200'
      };
    }
    
    return {
      type: 'inactive',
      message: 'Subscription inactive',
      color: 'bg-gray-100 text-gray-800 border-gray-200'
    };
  };

  if (loading) {
    return <Loading message="Loading pricing plans..." />;
  }

  const planNames = ['starter', 'professional', 'enterprise'];
  const planDisplayNames = {
    starter: 'Starter',
    professional: 'Professional',
    enterprise: 'Enterprise'
  };

  const subscriptionStatus = getSubscriptionStatus();

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
            <h1 className="text-3xl font-bold text-[#4bb4f5]">Subscription Plans</h1>
            <p className="text-gray-600 mt-2">
              Choose the perfect plan for your painting business
            </p>
          </div>
        </div>

        {currentSubscription && (
          <div className={`border rounded-lg p-4 ${subscriptionStatus?.color}`}>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium">Current Plan</h3>
                <p className="font-semibold">
                  {planDisplayNames[currentSubscription.plan_name] || 'Trial'} - {subscriptionStatus?.message}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm">
                  {currentSubscription.projects_used_this_month} / {currentSubscription.max_projects === -1 ? '∞' : currentSubscription.max_projects} projects used
                </p>
                {currentSubscription.status === 'trial' && (
                  <p className="text-xs mt-1">
                    Upgrade to keep your progress!
                  </p>
                )}
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
                ? 'bg-white text-[#4bb4f5] shadow-sm'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            Monthly
          </button>
          <button
            onClick={() => setBillingCycle('yearly')}
            className={`px-6 py-2 rounded-md font-medium transition-colors ${
              billingCycle === 'yearly'
                ? 'bg-white text-[#4bb4f5] shadow-sm'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            Yearly
            <span className="ml-2 text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
              Save up to 17%
            </span>
          </button>
        </div>
      </div>

      {/* Pricing Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {planNames.map((planName) => {
          const plan = plans[planName];
          if (!plan) return null;

          const pricing = getDisplayPrice(planName);
          const isCurrent = isCurrentPlan(planName);
          const isProfessional = planName === 'professional';
          const canUpgrade = canUpgradeToPlan(planName);
          const buttonText = getButtonText(planName);
          const totalProjects = getTotalProjectsAfterUpgrade(planName);

          return (
            <div
              key={planName}
              className={`relative bg-white rounded-lg border-2 p-6 ${
                isProfessional
                  ? 'border-[#4bb4f5] shadow-lg scale-105'
                  : isCurrent
                  ? 'border-green-500'
                  : 'border-gray-200'
              }`}
            >
              {/* Trial Badge - positioned on the left */}
              {shouldShowTrialBadge(planName) && (
                <div className="absolute -top-3 -left-3">
                  <span className="bg-orange-500 text-white px-3 py-1 rounded-full text-sm font-medium flex items-center">
                    <Gift className="h-4 w-4 mr-1" />
                    Trial Active
                  </span>
                </div>
              )}

              {/* Most Popular Badge */}
              {isProfessional && !shouldShowTrialBadge(planName) && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <span className="bg-[#4bb4f5] text-white px-3 py-1 rounded-full text-sm font-medium flex items-center">
                    <Star className="h-4 w-4 mr-1" />
                    Most Popular
                  </span>
                </div>
              )}

              {/* Current Plan Badge */}
              {isCurrent && !shouldShowTrialBadge(planName) && (
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
                  {pricing.monthly === 0 ? (
                    <span className="text-4xl font-bold text-gray-900">Free</span>
                  ) : (
                    <>
                      <span className="text-4xl font-bold text-gray-900">
                        £{pricing.monthly}
                      </span>
                      <span className="text-gray-600">/month</span>
                    </>
                  )}
                  
                  {billingCycle === 'yearly' && pricing.yearly > 0 && (
                    <div className="text-sm text-gray-500">
                      £{pricing.yearly} billed annually
                      {pricing.savings > 0 && (
                        <span className="text-green-600 font-medium"> (Save {pricing.savings}%)</span>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Features */}
              <div className="space-y-4 mb-6">
                <div className="flex items-center">
                  <FileText className="h-5 w-5 text-[#4bb4f5] mr-3" />
                  <span className="text-gray-700">
                    {plan.max_projects === -1 ? 'Unlimited' : plan.max_projects} projects/month
                    {isTrialPlan() && planName !== 'trial' && totalProjects && (
                      <span className="ml-2 text-sm text-green-600 font-medium">
                        (Total: {totalProjects})
                      </span>
                    )}
                  </span>
                </div>
                <div className="flex items-center">
                  <Users className="h-5 w-5 text-[#4bb4f5] mr-3" />
                  <span className="text-gray-700">
                    {plan.max_users === -1 ? 'Unlimited' : plan.max_users} team members
                  </span>
                </div>
                {plan.features?.map((feature, index) => (
                  <div key={index} className="flex items-center">
                    <Check className="h-5 w-5 text-[#4bb4f5] mr-3 flex-shrink-0" />
                    <span className="text-gray-700 text-sm">{feature}</span>
                  </div>
                ))}
              </div>

              {/* Upgrade Benefits for Trial Users */}
              {isTrialPlan() && planName !== 'trial' && (
                <div className="bg-blue-50 border border-blue-200 rounded-md p-3 mb-4">
                  <p className="text-sm text-blue-800 font-medium">Upgrade Benefits:</p>
                  <ul className="text-sm text-blue-700 mt-1 space-y-1">
                    <li>• Keep all your trial projects</li>
                    <li>• Get {totalProjects} total projects</li>
                    <li>• Unlock all premium features</li>
                  </ul>
                </div>
              )}

              {/* Action Button */}
              <div className="text-center">
                {!canUpgrade && isCurrent && !currentSubscription?.will_cancel_at_period_end ? (
                  <button
                    disabled
                    className="w-full bg-gray-100 text-gray-500 py-2 px-4 rounded-md font-medium cursor-not-allowed"
                  >
                    {buttonText}
                  </button>
                ) : (
                  <button
                    onClick={() => handleUpgrade(planName)}
                    disabled={processingPlan === planName}
                    className={`w-full py-2 px-4 rounded-md font-medium transition-colors ${
                      isProfessional
                        ? 'bg-[#4bb4f5] hover:bg-[#4bb4f5] text-white'
                        : 'bg-green-600 hover:bg-green-700 text-white'
                    } disabled:opacity-50`}
                  >
                    {processingPlan === planName ? (
                      <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Processing...
                      </div>
                    ) : (
                      buttonText
                    )}
                  </button>
                )}
              </div>

              {/* Current Plan Additional Info */}
              {isCurrent && currentSubscription?.status === 'active' && (
                <div className="mt-4 text-center">
                  <p className="text-xs text-gray-500">
                    Next billing: {new Date(currentSubscription.current_period_end).toLocaleDateString()}
                  </p>
                  {currentSubscription.will_cancel_at_period_end && (
                    <p className="text-xs text-red-600 mt-1">
                      Will cancel at period end
                    </p>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Trial Upgrade Notice */}
      {isTrialPlan() && (
        <div className="mt-8 bg-gradient-to-r from-orange-50 to-yellow-50 border border-orange-200 rounded-lg p-6">
          <div className="flex items-center mb-4">
            <Clock className="h-6 w-6 text-orange-600 mr-3" />
            <h3 className="text-lg font-semibold text-orange-900">
              Your trial ends in {currentSubscription.days_remaining} days
            </h3>
          </div>
          <p className="text-orange-800 mb-4">
            Don't lose access to your {currentSubscription.projects_used_this_month} projects! 
            Choose a plan to continue using PaintQuote Pro with all your data intact.
          </p>
          <div className="text-sm text-orange-700">
            <p className="font-medium">What happens when you upgrade:</p>
            <ul className="mt-2 space-y-1 ml-4">
              <li>• All your current projects are preserved</li>
              <li>• Your project count adds to the new plan's limit</li>
              <li>• Immediate access to all premium features</li>
              <li>• No interruption to your workflow</li>
            </ul>
          </div>
        </div>
      )}

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
              Yes, you can upgrade or downgrade your plan at any time. Upgrades take effect immediately, while downgrades take effect at your next billing cycle.
            </p>
          </div>
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              What happens to my trial projects when I upgrade?
            </h3>
            <p className="text-gray-600">
              All your trial projects are preserved and your remaining trial projects are added to your new plan's monthly limit.
            </p>
          </div>
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Can I switch between monthly and yearly billing?
            </h3>
            <p className="text-gray-600">
              Yes, you can change your billing cycle at any time. The change will take effect at your next billing date.
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