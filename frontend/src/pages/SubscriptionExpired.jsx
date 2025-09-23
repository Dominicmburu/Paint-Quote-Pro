import React, { useState } from 'react';
import { Clock, CreditCard, ArrowRight, Download, Lock, Unlock, CheckCircle } from 'lucide-react';
import { useTranslation } from '../hooks/useTranslation';

const SubscriptionExpired = () => {
  const [selectedPlan, setSelectedPlan] = useState('professional');
  const { t } = useTranslation();

  const plans = [
    {
      id: 'starter',
      name: t('Starter'),
      price: 29,
      yearlyPrice: 290,
      description: t('Perfect for small painting businesses'),
      features: [
        t('Up to 5 projects per month'),
        t('Basic floor plan analysis'),
        t('PDF quote generation'),
        t('2 team members'),
        t('Email support')
      ]
    },
    {
      id: 'professional',
      name: t('Professional'),
      price: 79,
      yearlyPrice: 790,
      description: t('Most popular for growing businesses'),
      features: [
        t('Up to 25 projects per month'),
        t('Advanced AI floor plan analysis'),
        t('Custom quote templates'),
        t('10 team members'),
        t('Priority support'),
        t('Custom paint brand settings')
      ],
      popular: true
    },
    {
      id: 'enterprise',
      name: t('Enterprise'),
      price: 199,
      yearlyPrice: 1990,
      description: t('For large painting contractors'),
      features: [
        t('Unlimited projects'),
        t('Unlimited team members'),
        t('Advanced AI analysis'),
        t('White-label options'),
        t('API access'),
        t('Dedicated account manager')
      ]
    }
  ];

  const lockedFeatures = [
    t('Create new projects'),
    t('Generate new quotes'),
    t('Access AI floor plan analysis'),
    t('Download existing quotes'),
    t('Team collaboration features')
  ];

  const availableFeatures = [
    t('View existing projects (read-only)'),
    t('Access account settings'),
    t('View billing history'),
    t('Contact support')
  ];

  const handleReactivate = () => {
    const plan = plans.find(p => p.id === selectedPlan);
    window.location.href = `/pricing?plan=${plan.id}&action=reactivate`;
  };

  return (
    <div className="min-h-screen bg-yellow-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-orange-500 to-yellow-600 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center">
            <div className="bg-white rounded-full p-3 mr-4">
              <Clock className="h-8 w-8 text-orange-500" />
            </div>
            <h1 className="text-3xl font-bold text-white">{t('Subscription Expired')}</h1>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Expired Message */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8 mb-8">
          <div className="text-center mb-8">
            <div className="bg-orange-100 rounded-full p-6 w-24 h-24 mx-auto mb-6">
              <Clock className="h-12 w-12 text-orange-500 mx-auto" />
            </div>
            <h2 className="text-2xl font-bold text-purple-700 mb-4">
              {t('Your subscription has expired')}
            </h2>
            <p className="text-gray-600 text-lg max-w-2xl mx-auto">
              {t('Don\'t worry - your data is safe! Reactivate your subscription to continue creating professional paint quotes and access all your projects.')}
            </p>
          </div>

          {/* Current Access Status */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
            {/* What's Locked */}
            <div className="bg-red-50 border border-red-200 rounded-xl p-6">
              <div className="flex items-center mb-4">
                <Lock className="h-6 w-6 text-red-500 mr-3" />
                <h3 className="text-lg font-semibold text-red-700">{t('Currently Unavailable')}</h3>
              </div>
              <ul className="space-y-2">
                {lockedFeatures.map((feature, index) => (
                  <li key={index} className="flex items-center text-red-600">
                    <div className="w-2 h-2 bg-red-400 rounded-full mr-3"></div>
                    <span className="text-sm">{feature}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* What's Available */}
            <div className="bg-green-50 border border-green-200 rounded-xl p-6">
              <div className="flex items-center mb-4">
                <Unlock className="h-6 w-6 text-green-500 mr-3" />
                <h3 className="text-lg font-semibold text-green-700">{t('Still Available')}</h3>
              </div>
              <ul className="space-y-2">
                {availableFeatures.map((feature, index) => (
                  <li key={index} className="flex items-center text-green-600">
                    <CheckCircle className="w-4 h-4 text-green-500 mr-3" />
                    <span className="text-sm">{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Quick Reactivation */}
          <div className="text-center">
            <button
              onClick={handleReactivate}
              className="bg-green-600 hover:bg-green-700 text-white px-8 py-4 rounded-lg font-semibold text-lg transition-colors flex items-center justify-center mx-auto"
            >
              <CreditCard className="h-5 w-5 mr-2" />
              {t('Reactivate Subscription')}
              <ArrowRight className="h-5 w-5 ml-2" />
            </button>
            <p className="text-gray-500 text-sm mt-3">
              {t('Resume where you left off in just a few clicks')}
            </p>
          </div>
        </div>

        {/* Plan Selection */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8 mb-8">
          <h3 className="text-xl font-bold text-purple-700 mb-6 text-center">
            {t('Choose your plan to continue')}
          </h3>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {plans.map((plan) => (
              <div
                key={plan.id}
                onClick={() => setSelectedPlan(plan.id)}
                className={`relative border-2 rounded-xl p-6 cursor-pointer transition-all ${
                  selectedPlan === plan.id
                    ? 'border-green-500 bg-green-50 transform scale-105'
                    : 'border-gray-200 hover:border-gray-300'
                } ${plan.popular ? 'ring-2 ring-green-200' : ''}`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <span className="bg-green-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                      {t('Most Popular')}
                    </span>
                  </div>
                )}
                
                <div className="text-center mb-4">
                  <h4 className="text-lg font-bold text-purple-700">{plan.name}</h4>
                  <div className="text-3xl font-bold text-purple-700 mt-2">
                    €{plan.price}
                    <span className="text-sm text-gray-500 font-normal">/month</span>
                  </div>
                  <p className="text-gray-600 text-sm mt-2">{plan.description}</p>
                </div>

                <ul className="space-y-2 mb-6">
                  {plan.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="text-sm text-gray-600 flex items-center">
                      <CheckCircle className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>

                {selectedPlan === plan.id && (
                  <div className="absolute inset-0 border-2 border-green-500 rounded-xl pointer-events-none">
                    <div className="absolute top-2 right-2">
                      <CheckCircle className="h-6 w-6 text-green-500 bg-white rounded-full" />
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="mt-8 text-center">
            <button
              onClick={handleReactivate}
              className="bg-purple-600 hover:bg-purple-700 text-white px-12 py-4 rounded-lg font-semibold text-lg transition-colors"
            >
              {t('Continue with')} {plans.find(p => p.id === selectedPlan)?.name} {t('Plan')}
            </button>
          </div>
        </div>

        {/* Special Offer */}
        <div className="bg-gradient-to-r from-purple-600 to-green-600 rounded-2xl p-8 text-white text-center">
          <h3 className="text-xl font-bold mb-4">{t('Welcome Back Offer!')}</h3>
          <p className="text-purple-100 mb-6">
            {t('Reactivate your subscription today and get your first month at 20% off. Plus, all your previous data and settings are exactly as you left them.')}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={handleReactivate}
              className="bg-yellow-400 hover:bg-yellow-500 text-purple-900 px-8 py-3 rounded-lg font-semibold transition-colors"
            >
              {t('Claim 20% Discount')}
            </button>
            <button
              onClick={() => window.location.href = '/subscription/billing'}
              className="border-2 border-white text-white hover:bg-white hover:text-purple-700 px-8 py-3 rounded-lg font-semibold transition-colors"
            >
              {t('View Billing History')}
            </button>
          </div>
        </div>

        {/* Data Safety Notice */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-xl p-6 text-center">
          <div className="flex items-center justify-center mb-4">
            <Download className="h-6 w-6 text-blue-600 mr-2" />
            <h4 className="font-semibold text-blue-800">{t('Your Data is Safe')}</h4>
          </div>
          <p className="text-blue-700 text-sm">
            {t('All your projects, quotes, and settings are preserved and will be immediately available when you reactivate. We keep your data secure for 90 days after subscription expiry.')}
          </p>
        </div>

        {/* Support Section */}
        <div className="mt-8 text-center">
          <p className="text-gray-600 mb-4">{t('Questions about reactivating your subscription?')}</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => window.location.href = '/contact'}
              className="text-purple-600 hover:text-purple-700 font-semibold"
            >
              {t('Contact Support')}
            </button>
            <span className="text-gray-400 hidden sm:block">•</span>
            <button
              onClick={() => window.location.href = '/help/billing'}
              className="text-purple-600 hover:text-purple-700 font-semibold"
            >
              {t('Billing Help')}
            </button>
            <span className="text-gray-400 hidden sm:block">•</span>
            <button
              onClick={() => window.location.href = '/features'}
              className="text-purple-600 hover:text-purple-700 font-semibold"
            >
              {t('See All Features')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SubscriptionExpired;