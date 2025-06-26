import React, { useState } from 'react';
import { 
  Check, 
  X, 
  Star, 
  Menu, 
  ArrowRight,
  CheckCircle,
  Users,
  FileText,
  Smartphone,
  Shield,
  Clock,
  Calculator,
  Target,
  Zap
} from 'lucide-react';

const Pricing = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isYearly, setIsYearly] = useState(false);

  const plans = [
    {
      name: 'Pure Invoice',
      price: 7.50,
      yearlyPrice: 75,
      description: 'More quotes, but not really extensive project management? Then you can quote away',
      features: [
        'Send unlimited quotes (with iDEAL link) and estimates',
        'Enter 5 expenses per month',
        'Hours & project time tracking',
        'Send VAT return directly'
      ],
      limitations: [
        'Advanced project management',
        'Team collaboration',
        'Custom integrations'
      ],
      popular: false,
      color: 'border-amber-300',
      bgColor: 'bg-amber-50'
    },
    {
      name: 'Basic',
      price: 12.50,
      yearlyPrice: 125,
      description: 'This is the package for when you have left the starter phase behind you. All the basics for serious project management',
      features: [
        'Send 10 quotes (with iDEAL link) and 80 estimates per month',
        'Enter 10 expenses per month',
        'Hours & project time tracking',
        'Send VAT return directly',
        '10 Scan & Recognize credits per month'
      ],
      limitations: [
        'Unlimited projects',
        'Advanced team features',
        'White-label options'
      ],
      popular: true,
      color: 'border-emerald-500',
      bgColor: 'bg-emerald-50'
    },
    {
      name: 'Professional',
      price: 25,
      yearlyPrice: 250,
      description: 'The complete package to ensure you have everything in order and can devote maximum attention to your customers',
      features: [
        'Everything from Basic, plus:',
        'Send unlimited quotes and estimates',
        'Enter unlimited expenses',
        'SEPA direct debit',
        '30 Scan & Recognize credits per month',
        'Easy inventory management'
      ],
      limitations: [],
      popular: false,
      color: 'border-blue-500',
      bgColor: 'bg-blue-50'
    }
  ];

  const featureComparison = [
    {
      category: 'Quotes',
      features: [
        {
          name: 'Create and send quotes',
          pure: 'Unlimited',
          basic: '10 per month',
          professional: 'Unlimited'
        },
        {
          name: 'Get paid via iDEAL',
          pure: true,
          basic: true,
          professional: true
        },
        {
          name: 'Send reminders automatically',
          pure: true,
          basic: true,
          professional: true
        },
        {
          name: 'Custom quote templates',
          pure: true,
          basic: true,
          professional: true
        }
      ]
    },
    {
      category: 'Project Management',
      features: [
        {
          name: 'Record expenses',
          pure: '5 per month',
          basic: '10 per month',
          professional: 'Unlimited'
        },
        {
          name: 'Digital shoebox',
          pure: true,
          basic: true,
          professional: true
        },
        {
          name: 'Scan & Recognize',
          pure: false,
          basic: '10 credits',
          professional: '30 credits'
        }
      ]
    },
    {
      category: 'Team & Collaboration',
      features: [
        {
          name: 'Team members',
          pure: '1 user',
          basic: '1 user',
          professional: '2 additional users'
        },
        {
          name: 'Mobile app access',
          pure: true,
          basic: true,
          professional: true
        }
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      {/* <nav className="bg-white border-b border-gray-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0 flex items-center">
                <div className="w-8 h-8 bg-gradient-to-br from-amber-400 to-amber-500 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">PQ</span>
                </div>
                <span className="ml-2 text-xl font-semibold text-slate-800">Paint Quote Pro</span>
              </div>
            </div>
            
            <div className="hidden md:block">
              <div className="ml-10 flex items-baseline space-x-8">
                <a href="#features" className="text-slate-600 hover:text-slate-900 px-3 py-2 text-sm font-medium transition-colors">Features</a>
                <a href="#pricing" className="text-emerald-600 px-3 py-2 text-sm font-medium">Pricing</a>
                <a href="#support" className="text-slate-600 hover:text-slate-900 px-3 py-2 text-sm font-medium transition-colors">Support</a>
                <a href="#contact" className="text-slate-600 hover:text-slate-900 px-3 py-2 text-sm font-medium transition-colors">Contact</a>
              </div>
            </div>

            <div className="hidden md:flex items-center space-x-4">
              <button className="bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-2 rounded-lg font-medium text-sm transition-colors">
                Try it for free
              </button>
            </div>

            <div className="md:hidden">
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="text-slate-600 hover:text-slate-900"
              >
                {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
            </div>
          </div>
        </div>
      </nav> */}

      {/* Package Selection Helper */}
      <section className="bg-gradient-to-br from-amber-400 via-amber-300 to-yellow-400 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold text-slate-800 mb-6">
              Which quoting package suits you?
            </h1>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="text-slate-700 space-y-6">
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <CheckCircle className="h-6 w-6 text-emerald-600" />
                  <span className="text-lg font-medium">8 short questions</span>
                </div>
                <div className="flex items-center space-x-3">
                  <CheckCircle className="h-6 w-6 text-emerald-600" />
                  <span className="text-lg font-medium">Quickly find the package that suits you</span>
                </div>
                <div className="flex items-center space-x-3">
                  <CheckCircle className="h-6 w-6 text-emerald-600" />
                  <span className="text-lg font-medium">All features and prices are clearly indicated</span>
                </div>
                <div className="flex items-center space-x-3">
                  <CheckCircle className="h-6 w-6 text-emerald-600" />
                  <span className="text-lg font-medium">Want to compare for yourself? Take a look at our comparison table ↓</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-8 shadow-xl">
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-3">
                    How many quotes do you send per month?*
                  </label>
                  <div className="space-y-2">
                    <label className="flex items-center">
                      <input type="radio" name="quotes" className="mr-3" />
                      <span className="text-slate-600">Less than 5 quotes</span>
                    </label>
                    <label className="flex items-center">
                      <input type="radio" name="quotes" className="mr-3" />
                      <span className="text-slate-600">Between 5 and 10</span>
                    </label>
                    <label className="flex items-center">
                      <input type="radio" name="quotes" className="mr-3" />
                      <span className="text-slate-600">More than 10</span>
                    </label>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-3">
                    Do you want iDEAL payment links with your quotes so customers can pay easily?*
                  </label>
                  <div className="space-y-2">
                    <label className="flex items-center">
                      <input type="radio" name="ideal" className="mr-3" />
                      <span className="text-slate-600">Yes</span>
                    </label>
                    <label className="flex items-center">
                      <input type="radio" name="ideal" className="mr-3" />
                      <span className="text-slate-600">No</span>
                    </label>
                  </div>
                </div>

                <div className="pt-4">
                  <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
                    <div className="bg-amber-400 h-2 rounded-full" style={{ width: '25%' }}></div>
                  </div>
                  <button className="w-full bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-3 rounded-lg font-semibold transition-colors">
                    Continue
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Starter Package Banner */}
      {/* <section className="bg-slate-700 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Just getting started? Get the free Starter package!
          </h2>
          <p className="text-xl text-gray-300 mb-6 max-w-4xl mx-auto">
            The Paint Quote Pro Starter package contains everything you need for a flying start. Send 5 quotes monthly including iDEAL 
            payment link and manage your first expenses. Do your own VAT return with the handy VAT overview. Free of charge.
          </p>
          <button className="bg-emerald-500 hover:bg-emerald-600 text-white px-8 py-3 rounded-lg font-semibold transition-colors">
            Read more about Starter
          </button>
        </div>
      </section> */}

      {/* Pricing Plans */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-800 mb-6">
              Simple, Transparent Pricing
            </h2>
            <p className="text-xl text-slate-600 max-w-3xl mx-auto mb-8">
              Choose the perfect plan for your painting business. All plans include a 14-day free trial.
            </p>
            
            {/* Billing toggle */}
            <div className="flex items-center justify-center mb-8">
              <span className={`mr-3 ${!isYearly ? 'font-semibold text-slate-800' : 'text-slate-500'}`}>
                Monthly
              </span>
              <button
                onClick={() => setIsYearly(!isYearly)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 ${
                  isYearly ? 'bg-emerald-500' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    isYearly ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
              <span className={`ml-3 ${isYearly ? 'font-semibold text-slate-800' : 'text-slate-500'}`}>
                Yearly
                <span className="ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-amber-400 text-slate-800">
                  Save 17%
                </span>
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {plans.map((plan, index) => (
              <div
                key={plan.name}
                className={`relative bg-white rounded-2xl shadow-lg border-2 ${plan.color} ${
                  plan.popular ? 'transform scale-105' : ''
                } hover:shadow-xl transition-all duration-300`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <div className="inline-flex items-center px-4 py-2 rounded-full bg-emerald-500 text-white text-sm font-medium shadow-lg">
                      <Star className="h-4 w-4 mr-1 fill-current" />
                      Most Popular
                    </div>
                  </div>
                )}

                <div className={`${plan.bgColor} rounded-t-2xl p-8 text-center`}>
                  <h3 className="text-2xl font-bold text-slate-800 mb-2">{plan.name}</h3>
                  <div className="mb-6">
                    <div className="flex items-baseline justify-center">
                      <span className="text-4xl font-bold text-slate-800">
                        £{isYearly ? plan.yearlyPrice : plan.price}
                      </span>
                      <span className="text-slate-600 ml-2">
                        /p/m {isYearly ? 'excl. VAT' : 'excl. VAT'}
                      </span>
                    </div>
                    {isYearly && (
                      <p className="text-sm text-emerald-600 mt-1">
                        Save £{(plan.price * 12) - plan.yearlyPrice} per year
                      </p>
                    )}
                  </div>
                </div>

                <div className="p-8">
                  <p className="text-slate-600 mb-6 leading-relaxed">{plan.description}</p>

                  <button
                    className={`w-full py-3 px-4 rounded-xl shadow-sm text-sm font-semibold transition-all ${
                      plan.popular
                        ? 'bg-emerald-500 hover:bg-emerald-600 text-white'
                        : 'bg-gray-100 hover:bg-gray-200 text-slate-700'
                    }`}
                  >
                    {index === 0 ? 'Read more about Pure Invoice' : 
                     index === 1 ? 'Read more about Basic' : 
                     'Read more about Professional'}
                  </button>

                  <div className="mt-8">
                    <h4 className="text-sm font-semibold text-slate-800 mb-4 uppercase tracking-wide">Main features</h4>
                    <ul className="space-y-3">
                      {plan.features.map((feature, featureIndex) => (
                        <li key={featureIndex} className="flex items-start">
                          <CheckCircle className="h-5 w-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                          <span className="ml-3 text-sm text-slate-700 leading-relaxed">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Feature Comparison Table */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-800 mb-6">
              View and compare all the features of our packages
            </h2>
            <p className="text-lg text-slate-600">
              Do you have a moment? There are quite a few.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full bg-white rounded-2xl shadow-lg overflow-hidden">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-800 w-1/2">Features</th>
                  <th className="px-6 py-4 text-center text-sm font-semibold text-slate-800">Pure Invoice</th>
                  <th className="px-6 py-4 text-center text-sm font-semibold text-slate-800 bg-emerald-50">Basic</th>
                  <th className="px-6 py-4 text-center text-sm font-semibold text-slate-800">Professional</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                <tr className="bg-amber-50">
                  <td className="px-6 py-4 text-sm font-semibold text-slate-800">Price</td>
                  <td className="px-6 py-4 text-center text-sm text-slate-600">£7.50 p/m excl. VAT</td>
                  <td className="px-6 py-4 text-center text-sm text-slate-600 bg-emerald-50">£12.50 p/m excl. VAT</td>
                  <td className="px-6 py-4 text-center text-sm text-slate-600">£25.- p/m excl. VAT</td>
                </tr>
                {featureComparison.map((category, categoryIndex) => (
                  <React.Fragment key={categoryIndex}>
                    <tr className="bg-gray-50">
                      <td colSpan={4} className="px-6 py-4 text-sm font-bold text-slate-800 uppercase tracking-wide">
                        {category.category}
                      </td>
                    </tr>
                    {category.features.map((feature, featureIndex) => (
                      <tr key={featureIndex} className="hover:bg-gray-50">
                        <td className="px-6 py-4 text-sm text-slate-700">{feature.name}</td>
                        <td className="px-6 py-4 text-center">
                          {typeof feature.pure === 'boolean' ? (
                            feature.pure ? (
                              <CheckCircle className="h-5 w-5 text-emerald-500 mx-auto" />
                            ) : (
                              <X className="h-5 w-5 text-gray-400 mx-auto" />
                            )
                          ) : (
                            <span className="text-sm text-slate-600">{feature.pure}</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-center bg-emerald-50">
                          {typeof feature.basic === 'boolean' ? (
                            feature.basic ? (
                              <CheckCircle className="h-5 w-5 text-emerald-500 mx-auto" />
                            ) : (
                              <X className="h-5 w-5 text-gray-400 mx-auto" />
                            )
                          ) : (
                            <span className="text-sm text-slate-600">{feature.basic}</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-center">
                          {typeof feature.professional === 'boolean' ? (
                            feature.professional ? (
                              <CheckCircle className="h-5 w-5 text-emerald-500 mx-auto" />
                            ) : (
                              <X className="h-5 w-5 text-gray-400 mx-auto" />
                            )
                          ) : (
                            <span className="text-sm text-slate-600">{feature.professional}</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl md:text-4xl font-bold text-slate-800 text-center mb-16">
            Frequently Asked Questions
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-8">
              <div className="bg-white p-6 rounded-xl shadow-sm">
                <h3 className="text-lg font-bold text-slate-800 mb-3">
                  Can I change plans at any time?
                </h3>
                <p className="text-slate-600 leading-relaxed">
                  Yes, you can upgrade or downgrade your plan at any time. Changes take effect immediately, 
                  and we'll prorate any billing differences.
                </p>
              </div>

              <div className="bg-white p-6 rounded-xl shadow-sm">
                <h3 className="text-lg font-bold text-slate-800 mb-3">
                  Is there a free trial?
                </h3>
                <p className="text-slate-600 leading-relaxed">
                  Yes! All plans come with a 14-day free trial. No credit card required to start. 
                  You can explore all features during your trial period.
                </p>
              </div>

              <div className="bg-white p-6 rounded-xl shadow-sm">
                <h3 className="text-lg font-bold text-slate-800 mb-3">
                  Can I cancel at any time?
                </h3>
                <p className="text-slate-600 leading-relaxed">
                  Yes, you can cancel your subscription at any time. Your access will continue until 
                  the end of your current billing period.
                </p>
              </div>
            </div>

            <div className="space-y-8">
              <div className="bg-white p-6 rounded-xl shadow-sm">
                <h3 className="text-lg font-bold text-slate-800 mb-3">
                  What happens if I exceed my project limit?
                </h3>
                <p className="text-slate-600 leading-relaxed">
                  If you reach your monthly project limit, you'll be prompted to upgrade your plan. 
                  You can also wait until the next billing cycle when your limit resets.
                </p>
              </div>

              <div className="bg-white p-6 rounded-xl shadow-sm">
                <h3 className="text-lg font-bold text-slate-800 mb-3">
                  Do you offer refunds?
                </h3>
                <p className="text-slate-600 leading-relaxed">
                  We offer a 30-day money-back guarantee. If you're not satisfied within the first 30 days, 
                  we'll provide a full refund, no questions asked.
                </p>
              </div>

              <div className="bg-white p-6 rounded-xl shadow-sm">
                <h3 className="text-lg font-bold text-slate-800 mb-3">
                  What payment methods do you accept?
                </h3>
                <p className="text-slate-600 leading-relaxed">
                  We accept all major credit cards, PayPal, and bank transfers. All payments are processed 
                  securely with enterprise-grade encryption.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Pricing;