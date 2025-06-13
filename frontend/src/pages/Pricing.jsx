import { Link } from 'react-router-dom';
import { Check, X, Star } from 'lucide-react';
import React, { useState } from 'react';

const Pricing = () => {
  const plans = [
    {
      name: 'Starter',
      price: 29,
      yearlyPrice: 290,
      description: 'Perfect for small painting businesses',
      features: [
        'Up to 50 projects per month',
        'Basic floor plan analysis',
        'PDF quote generation',
        '2 team members',
        'Email support',
        'Company branding'
      ],
      limitations: [
        'Advanced AI features',
        'Custom templates',
        'Priority support'
      ],
      popular: false,
      color: 'border-gray-200'
    },
    {
      name: 'Professional',
      price: 79,
      yearlyPrice: 790,
      description: 'Most popular for growing businesses',
      features: [
        'Up to 200 projects per month',
        'Advanced AI floor plan analysis',
        'Custom quote templates',
        '10 team members',
        'Priority email support',
        'Custom paint brand settings',
        'Export to Excel/CSV',
        'Client portal access'
      ],
      limitations: [
        'White-label options',
        'API access'
      ],
      popular: true,
      color: 'border-green-500'
    },
    {
      name: 'Enterprise',
      price: 199,
      yearlyPrice: 1990,
      description: 'For large painting contractors',
      features: [
        'Unlimited projects',
        'Unlimited team members',
        'Advanced AI analysis',
        'Custom integrations',
        'Dedicated account manager',
        'Phone & priority support',
        'White-label options',
        'API access',
        'Custom training',
        'SLA guarantee'
      ],
      limitations: [],
      popular: false,
      color: 'border-purple-500'
    }
  ];

  const [isYearly, setIsYearly] = useState(false);

  return (
    <div className="min-h-screen bg-yellow-50">
      {/* Header */}
      <div className="bg-gradient-to-br from-purple-700 to-green-600 py-16 relative overflow-hidden" style={{
        backgroundImage: `url('https://images.unsplash.com/photo-1554224155-6726b3ff858f?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2026&q=80')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundBlendMode: 'overlay'
      }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl font-bold text-white mb-4">
            Simple, Transparent Pricing
          </h1>
          <p className="text-xl text-purple-100 max-w-3xl mx-auto">
            Choose the perfect plan for your painting business. All plans include a 14-day free trial.
          </p>
          
          {/* Billing toggle */}
          <div className="mt-8 flex items-center justify-center">
            <span className={`mr-3 ${!isYearly ? 'text-white font-semibold' : 'text-purple-200'}`}>
              Monthly
            </span>
            <button
              onClick={() => setIsYearly(!isYearly)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 ${
                isYearly ? 'bg-white' : 'bg-purple-800'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-purple-600 transition-transform ${
                  isYearly ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
            <span className={`ml-3 ${isYearly ? 'text-white font-semibold' : 'text-purple-200'}`}>
              Yearly
              <span className="ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-400 text-purple-900">
                Save 17%
              </span>
            </span>
          </div>
        </div>
      </div>

      {/* Pricing Cards */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {plans.map((plan, index) => (
            <div
              key={plan.name}
              className={`relative bg-white rounded-2xl shadow-lg border-2 ${plan.color} ${
                plan.popular ? 'transform scale-105' : ''
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <div className="inline-flex items-center px-4 py-2 rounded-full bg-green-500 text-white text-sm font-medium">
                    <Star className="h-4 w-4 mr-1" />
                    Most Popular
                  </div>
                </div>
              )}

              <div className="p-8">
                <h3 className="text-2xl font-bold text-purple-700">{plan.name}</h3>
                <p className="text-gray-600 mt-2">{plan.description}</p>

                <div className="mt-6">
                  <div className="flex items-baseline">
                    <span className="text-4xl font-bold text-purple-700">
                      £{isYearly ? plan.yearlyPrice : plan.price}
                    </span>
                    <span className="text-gray-500 ml-2">
                      /{isYearly ? 'year' : 'month'}
                    </span>
                  </div>
                  {isYearly && (
                    <p className="text-sm text-green-600 mt-1">
                      Save £{(plan.price * 12) - plan.yearlyPrice} per year
                    </p>
                  )}
                </div>

                <Link
                  to="/register"
                  className={`mt-6 w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white transition-colors ${
                    plan.popular
                      ? 'bg-green-600 hover:bg-green-700'
                      : 'bg-purple-600 hover:bg-purple-700'
                  }`}
                >
                  Start Free Trial
                </Link>

                <div className="mt-8">
                  <h4 className="text-sm font-medium text-gray-900 mb-4">What's included:</h4>
                  <ul className="space-y-3">
                    {plan.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-start">
                        <Check className="h-5 w-5 text-green-500 flex-shrink-0" />
                        <span className="ml-3 text-sm text-gray-700">{feature}</span>
                      </li>
                    ))}
                    {plan.limitations.map((limitation, limitationIndex) => (
                      <li key={limitationIndex} className="flex items-start opacity-50">
                        <X className="h-5 w-5 text-gray-400 flex-shrink-0" />
                        <span className="ml-3 text-sm text-gray-500">{limitation}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* FAQ Section */}
      <div className="bg-white py-16">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-purple-700 text-center mb-12">
            Frequently Asked Questions
          </h2>
          
          <div className="space-y-8">
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Can I change plans at any time?
              </h3>
              <p className="text-gray-600">
                Yes, you can upgrade or downgrade your plan at any time. Changes take effect immediately, 
                and we'll prorate any billing differences.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                What happens if I exceed my project limit?
              </h3>
              <p className="text-gray-600">
                If you reach your monthly project limit, you'll be prompted to upgrade your plan. 
                You can also wait until the next billing cycle when your limit resets.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Is there a free trial?
              </h3>
              <p className="text-gray-600">
                Yes! All plans come with a 14-day free trial. No credit card required to start. 
                You can explore all features during your trial period.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Do you offer refunds?
              </h3>
              <p className="text-gray-600">
                We offer a 30-day money-back guarantee. If you're not satisfied within the first 30 days, 
                we'll provide a full refund, no questions asked.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Can I cancel at any time?
              </h3>
              <p className="text-gray-600">
                Yes, you can cancel your subscription at any time. Your access will continue until 
                the end of your current billing period.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-gradient-to-r from-green-600 to-purple-700 py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to streamline your painting business?
          </h2>
          <p className="text-xl text-green-100 mb-8">
            Join hundreds of professional painters already using Paint Quote Pro
          </p>
          <Link
            to="/register"
            className="inline-flex items-center px-8 py-4 border border-transparent text-lg font-medium rounded-md text-purple-700 bg-yellow-400 hover:bg-yellow-300 transition-colors"
          >
            Start Your Free Trial
          </Link>
        </div>
      </div>
    </div>
  );
};


export default Pricing;