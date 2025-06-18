import React, { useState } from 'react';
import { Calendar, Star, TrendingUp, Users, CheckCircle, ArrowRight, Trophy } from 'lucide-react';

const TrialExpired = () => {
  const [isYearly, setIsYearly] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState('professional');

  // Sample trial statistics
  const trialStats = {
    projectsCreated: 7,
    quotesGenerated: 12,
    totalValue: 8450,
    timeUsed: 14
  };

  const plans = [
    {
      id: 'starter',
      name: 'Starter',
      price: 29,
      yearlyPrice: 290,
      description: 'Perfect for small painting businesses',
      features: [
        'Up to 5 projects per month',
        'Basic floor plan analysis', 
        'PDF quote generation',
        '2 team members',
        'Email support'
      ],
      savings: null
    },
    {
      id: 'professional',
      name: 'Professional',
      price: 79,
      yearlyPrice: 790,
      description: 'Most popular for growing businesses',
      features: [
        'Up to 25 projects per month',
        'Advanced AI floor plan analysis',
        'Custom quote templates',
        '10 team members',
        'Priority support',
        'Custom paint brand settings'
      ],
      popular: true,
      savings: 158
    },
    {
      id: 'enterprise',
      name: 'Enterprise',
      price: 199,
      yearlyPrice: 1990,
      description: 'For large painting contractors',
      features: [
        'Unlimited projects',
        'Unlimited team members',
        'Advanced AI analysis',
        'White-label options',
        'API access',
        'Dedicated account manager'
      ],
      savings: 398
    }
  ];

  const trialHighlights = [
    {
      icon: <TrendingUp className="h-6 w-6 text-green-600" />,
      title: "Projects Created",
      value: trialStats.projectsCreated,
      description: "painting projects during your trial"
    },
    {
      icon: <Star className="h-6 w-6 text-yellow-600" />,
      title: "Quotes Generated", 
      value: trialStats.quotesGenerated,
      description: "professional quotes created"
    },
    {
      icon: <Trophy className="h-6 w-6 text-purple-600" />,
      title: "Total Quote Value",
      value: `£${trialStats.totalValue.toLocaleString()}`,
      description: "worth of quotes generated"
    }
  ];

  const handleSubscribe = () => {
    const plan = plans.find(p => p.id === selectedPlan);
    const billing = isYearly ? 'yearly' : 'monthly';
    window.location.href = `/pricing?plan=${plan.id}&billing=${billing}&trial_expired=true`;
  };

  return (
    <div className="min-h-screen bg-yellow-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center">
            <div className="bg-white rounded-full p-3 mr-4">
              <Calendar className="h-8 w-8 text-purple-600" />
            </div>
            <h1 className="text-3xl font-bold text-white">Your Trial Has Ended</h1>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Trial Summary */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8 mb-8">
          <div className="text-center mb-8">
            <div className="bg-purple-100 rounded-full p-6 w-24 h-24 mx-auto mb-6">
              <Calendar className="h-12 w-12 text-purple-600 mx-auto" />
            </div>
            <h2 className="text-2xl font-bold text-purple-700 mb-4">
              Thanks for trying Paint Quote Pro!
            </h2>
            <p className="text-gray-600 text-lg max-w-2xl mx-auto">
              Your 14-day free trial has ended, but the good news is you can continue right where you left off. 
              Choose a plan below to keep creating professional paint quotes.
            </p>
          </div>

          {/* Trial Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {trialHighlights.map((stat, index) => (
              <div key={index} className="text-center p-6 bg-gradient-to-br from-purple-50 to-blue-50 rounded-xl">
                <div className="flex justify-center mb-4">
                  {stat.icon}
                </div>
                <div className="text-3xl font-bold text-purple-700 mb-2">{stat.value}</div>
                <h4 className="font-semibold text-purple-700 mb-1">{stat.title}</h4>
                <p className="text-gray-600 text-sm">{stat.description}</p>
              </div>
            ))}
          </div>

          {/* Impact Message */}
          <div className="bg-green-50 border border-green-200 rounded-xl p-6 text-center">
            <h3 className="text-lg font-semibold text-green-800 mb-3">
              You're already seeing the impact! 🎉
            </h3>
            <p className="text-green-700">
              In just {trialStats.timeUsed} days, you've created {trialStats.projectsCreated} projects and generated 
              £{trialStats.totalValue.toLocaleString()} worth of quotes. Imagine what you could achieve with unlimited access!
            </p>
          </div>
        </div>

        {/* Billing Toggle */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center bg-white rounded-lg p-1 border border-gray-200">
            <button
              onClick={() => setIsYearly(false)}
              className={`px-6 py-2 rounded-md font-medium transition-all ${
                !isYearly 
                  ? 'bg-purple-600 text-white shadow-sm' 
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setIsYearly(true)}
              className={`px-6 py-2 rounded-md font-medium transition-all ${
                isYearly 
                  ? 'bg-purple-600 text-white shadow-sm' 
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              Yearly
              <span className="ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                Save 17%
              </span>
            </button>
          </div>
        </div>

        {/* Plan Selection */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {plans.map((plan) => (
            <div
              key={plan.id}
              onClick={() => setSelectedPlan(plan.id)}
              className={`relative border-2 rounded-2xl p-8 cursor-pointer transition-all ${
                selectedPlan === plan.id
                  ? 'border-green-500 bg-green-50 transform scale-105'
                  : 'border-gray-200 hover:border-gray-300 bg-white'
              } ${plan.popular ? 'ring-2 ring-purple-200' : ''}`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <div className="inline-flex items-center px-4 py-2 rounded-full bg-purple-600 text-white text-sm font-medium">
                    <Star className="h-4 w-4 mr-1" />
                    Most Popular
                  </div>
                </div>
              )}
              
              <div className="text-center mb-6">
                <h4 className="text-xl font-bold text-purple-700">{plan.name}</h4>
                <div className="mt-4">
                  <div className="text-4xl font-bold text-purple-700">
                    £{isYearly ? plan.yearlyPrice : plan.price}
                  </div>
                  <div className="text-gray-500">
                    /{isYearly ? 'year' : 'month'}
                  </div>
                  {isYearly && plan.savings && (
                    <div className="text-green-600 text-sm font-medium mt-1">
                      Save £{plan.savings} per year
                    </div>
                  )}
                </div>
                <p className="text-gray-600 text-sm mt-3">{plan.description}</p>
              </div>

              <ul className="space-y-3 mb-8">
                {plan.features.map((feature, featureIndex) => (
                  <li key={featureIndex} className="flex items-start">
                    <CheckCircle className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700 text-sm">{feature}</span>
                  </li>
                ))}
              </ul>

              {selectedPlan === plan.id && (
                <div className="absolute inset-0 border-2 border-green-500 rounded-2xl pointer-events-none">
                  <div className="absolute top-4 right-4">
                    <CheckCircle className="h-6 w-6 text-green-500 bg-white rounded-full" />
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Subscribe Button */}
        <div className="text-center mb-8">
          <button
            onClick={handleSubscribe}
            className="bg-green-600 hover:bg-green-700 text-white px-12 py-4 rounded-lg font-semibold text-lg transition-colors flex items-center justify-center mx-auto"
          >
            <span>Continue with {plans.find(p => p.id === selectedPlan)?.name}</span>
            <ArrowRight className="h-5 w-5 ml-2" />
          </button>
          <p className="text-gray-500 text-sm mt-3">
            Resume immediately • All your data preserved • Cancel anytime
          </p>
        </div>

        {/* What You'll Keep */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8 mb-8">
          <h3 className="text-xl font-bold text-purple-700 mb-6 text-center">
            What you'll get when you subscribe:
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h4 className="font-semibold text-purple-700 mb-4 flex items-center">
                <Users className="h-5 w-5 mr-2" />
                Your Existing Data
              </h4>
              <ul className="space-y-2">
                <li className="flex items-center text-gray-700">
                  <CheckCircle className="w-4 h-4 text-green-500 mr-3" />
                  <span className="text-sm">All {trialStats.projectsCreated} projects preserved</span>
                </li>
                <li className="flex items-center text-gray-700">
                  <CheckCircle className="w-4 h-4 text-green-500 mr-3" />
                  <span className="text-sm">Your {trialStats.quotesGenerated} generated quotes</span>
                </li>
                <li className="flex items-center text-gray-700">
                  <CheckCircle className="w-4 h-4 text-green-500 mr-3" />
                  <span className="text-sm">Company settings & branding</span>
                </li>
                <li className="flex items-center text-gray-700">
                  <CheckCircle className="w-4 h-4 text-green-500 mr-3" />
                  <span className="text-sm">Paint brand preferences</span>
                </li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold text-purple-700 mb-4 flex items-center">
                <Star className="h-5 w-5 mr-2" />
                New Capabilities
              </h4>
              <ul className="space-y-2">
                <li className="flex items-center text-gray-700">
                  <CheckCircle className="w-4 h-4 text-green-500 mr-3" />
                  <span className="text-sm">Unlimited project creation</span>
                </li>
                <li className="flex items-center text-gray-700">
                  <CheckCircle className="w-4 h-4 text-green-500 mr-3" />
                  <span className="text-sm">Advanced AI analysis features</span>
                </li>
                <li className="flex items-center text-gray-700">
                  <CheckCircle className="w-4 h-4 text-green-500 mr-3" />
                  <span className="text-sm">Custom quote templates</span>
                </li>
                <li className="flex items-center text-gray-700">
                  <CheckCircle className="w-4 h-4 text-green-500 mr-3" />
                  <span className="text-sm">Team collaboration tools</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Special Trial Conversion Offer */}
        <div className="bg-gradient-to-r from-green-500 to-blue-500 rounded-2xl p-8 text-white text-center">
          <h3 className="text-2xl font-bold mb-4">🎉 Special Trial Conversion Offer</h3>
          <p className="text-green-100 mb-6 text-lg">
            Subscribe today and get your first month at 25% off! This offer expires in 48 hours.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={handleSubscribe}
              className="bg-yellow-400 hover:bg-yellow-500 text-blue-900 px-8 py-3 rounded-lg font-semibold transition-colors text-lg"
            >
              Claim 25% Discount
            </button>
            <button
              onClick={() => window.location.href = '/features'}
              className="border-2 border-white text-white hover:bg-white hover:text-blue-700 px-8 py-3 rounded-lg font-semibold transition-colors"
            >
              See All Features
            </button>
          </div>
          <p className="text-green-100 text-sm mt-4">
            Offer code: TRIAL25 • Valid for 48 hours only
          </p>
        </div>

        {/* Support and Options */}
        <div className="mt-8 text-center">
          <p className="text-gray-600 mb-4">Need more time to decide or have questions?</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => window.location.href = '/contact'}
              className="text-purple-600 hover:text-purple-700 font-semibold"
            >
              Talk to Sales
            </button>
            <span className="text-gray-400 hidden sm:block">•</span>
            <button
              onClick={() => window.location.href = '/demo'}
              className="text-purple-600 hover:text-purple-700 font-semibold"
            >
              Schedule a Demo
            </button>
            <span className="text-gray-400 hidden sm:block">•</span>
            <button
              onClick={() => window.location.href = '/case-studies'}
              className="text-purple-600 hover:text-purple-700 font-semibold"
            >
              Read Case Studies
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TrialExpired;