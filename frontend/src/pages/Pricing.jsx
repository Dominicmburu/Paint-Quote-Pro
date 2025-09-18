import React, { useState } from 'react';
import { useTranslation } from '../hooks/useTranslation';
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
  Zap,
  Brain,
  PaintBucket,
  Award
} from 'lucide-react';

const Pricing = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isYearly, setIsYearly] = useState(false);
  const { t } = useTranslation();

  const plans = [
    {
      name: t('Pure Invoice'),
      price: 7.50,
      yearlyPrice: 75,
      description: t('More quotes, but not really extensive project management? Then you can quote away'),
      features: [
        t('Send unlimited quotes (with iDEAL link) and estimates'),
        t('Enter 5 expenses per month'),
        t('Hours & project time tracking'),
        t('Send VAT return directly')
      ],
      limitations: [
        t('Advanced project management'),
        t('Team collaboration'),
        t('Custom integrations')
      ],
      popular: false,
      color: 'border-amber-300',
      bgColor: 'bg-amber-50'
    },
    {
      name: t('Basic'),
      price: 12.50,
      yearlyPrice: 125,
      description: t('This is the package for when you have left the starter phase behind you. All the basics for serious project management'),
      features: [
        t('Send 10 quotes (with iDEAL link) and 80 estimates per month'),
        t('Enter 10 expenses per month'),
        t('Hours & project time tracking'),
        t('Send VAT return directly'),
        t('10 Scan & Recognize credits per month')
      ],
      limitations: [
        t('Unlimited projects'),
        t('Advanced team features'),
        t('White-label options')
      ],
      popular: true,
      color: 'border-[#4bb4f5]',
      bgColor: 'bg-blue-50'
    },
    {
      name: t('Professional'),
      price: 25,
      yearlyPrice: 250,
      description: t('The complete package to ensure you have everything in order and can devote maximum attention to your customers'),
      features: [
        t('Everything from Basic, plus:'),
        t('Send unlimited quotes and estimates'),
        t('Enter unlimited expenses'),
        t('SEPA direct debit'),
        t('30 Scan & Recognize credits per month'),
        t('Easy inventory management')
      ],
      limitations: [],
      popular: false,
      color: 'border-blue-500',
      bgColor: 'bg-blue-50'
    }
  ];

  const featureComparison = [
    {
      category: t('Quotes'),
      features: [
        {
          name: t('Create and send quotes'),
          pure: t('Unlimited'),
          basic: t('10 per month'),
          professional: t('Unlimited')
        },
        {
          name: t('Get paid via iDEAL'),
          pure: true,
          basic: true,
          professional: true
        },
        {
          name: t('Send reminders automatically'),
          pure: true,
          basic: true,
          professional: true
        },
        {
          name: t('Custom quote templates'),
          pure: true,
          basic: true,
          professional: true
        }
      ]
    },
    {
      category: t('Project Management'),
      features: [
        {
          name: t('Record expenses'),
          pure: t('5 per month'),
          basic: t('10 per month'),
          professional: t('Unlimited')
        },
        {
          name: t('Digital shoebox'),
          pure: true,
          basic: true,
          professional: true
        },
        {
          name: t('Scan & Recognize'),
          pure: false,
          basic: t('10 credits'),
          professional: t('30 credits')
        }
      ]
    },
    {
      category: t('Team & Collaboration'),
      features: [
        {
          name: t('Team members'),
          pure: t('1 user'),
          basic: t('1 user'),
          professional: t('2 additional users')
        },
        {
          name: t('Mobile app access'),
          pure: true,
          basic: true,
          professional: true
        }
      ]
    }
  ];

  const whyChooseFeatures = [
    {
      icon: <Brain className="h-12 w-12 text-[#4bb4f5]" />,
      title: t("AI-Powered Floor Plan Analysis"),
      description: t("Upload any floor plan and get instant room identification, measurements, and surface area calculations with 95% accuracy.")
    },
    {
      icon: <Clock className="h-8 w-8 text-amber-600" />,
      title: t("5x Faster Quote Creation"),
      description: t("Reduce quote creation time from hours to minutes with automated calculations and professional templates.")
    },
    {
      icon: <PaintBucket className="h-8 w-8 text-blue-600" />,
      title: t("Professional Branded Quotes"),
      description: t("Impress clients with stunning PDF quotes featuring your company branding and detailed breakdowns.")
    },
    {
      icon: <Award className="h-8 w-8 text-[#4bb4f5]" />,
      title: t("Complete Business Management"),
      description: t("Track projects, manage teams, process payments, and grow your painting business all in one platform.")
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section with Why Choose Paint Quote Pro */}
      <section className="bg-gradient-to-br from-[#4bb4f5] via-[#4bb4f5] to-[#4bb4f5] py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h1 className="text-4xl md:text-5xl font-bold text-slate-800 mb-6">
              {t('Why Choose Paint Quote Pro?')}
            </h1>
            <p className="text-xl text-slate-600 max-w-4xl mx-auto">
              {t('Transform your painting business with AI-powered quoting, professional project management, and tools that help you win more jobs faster.')}
            </p>
          </div>
          <div className="text-center mt-12">
            <div className="inline-flex items-center bg-white rounded-full px-6 py-3 shadow-lg">
              <CheckCircle className="h-5 w-5 text-[#4bb4f5] mr-2" />
              <span className="text-slate-700 font-medium">{t('14-day free trial • No credit card required • Cancel anytime')}</span>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Plans */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-800 mb-6">
              {t('Simple, Transparent Pricing')}
            </h2>
            <p className="text-xl text-slate-600 max-w-3xl mx-auto mb-8">
              {t('Choose the perfect plan for your painting business. All plans include a 14-day free trial.')}
            </p>
            
            {/* Billing toggle */}
            <div className="flex items-center justify-center mb-8">
              <span className={`mr-3 ${!isYearly ? 'font-semibold text-slate-800' : 'text-slate-500'}`}>
                {t('Monthly')}
              </span>
              <button
                onClick={() => setIsYearly(!isYearly)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-[#4bb4f5] focus:ring-offset-2 ${
                  isYearly ? 'bg-[#4bb4f5]' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    isYearly ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
              <span className={`ml-3 ${isYearly ? 'font-semibold text-slate-800' : 'text-slate-500'}`}>
                {t('Yearly')}
                <span className="ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-amber-400 text-slate-800">
                  {t('Save 17%')}
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
                    <div className="inline-flex items-center px-4 py-2 rounded-full bg-[#4bb4f5] text-white text-sm font-medium shadow-lg">
                      <Star className="h-4 w-4 mr-1 fill-current" />
                      {t('Most Popular')}
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
                        {t('/p/m')} {isYearly ? t('excl. VAT') : t('excl. VAT')}
                      </span>
                    </div>
                    {isYearly && (
                      <p className="text-sm text-[#4bb4f5] mt-1">
                        {t('Save')} £{(plan.price * 12) - plan.yearlyPrice} {t('per year')}
                      </p>
                    )}
                  </div>
                </div>

                <div className="p-8">
                  <p className="text-slate-600 mb-6 leading-relaxed">{plan.description}</p>
                  <div className="mt-8">
                    <h4 className="text-sm font-semibold text-slate-800 mb-4 uppercase tracking-wide">{t('Main features')}</h4>
                    <ul className="space-y-3">
                      {plan.features.map((feature, featureIndex) => (
                        <li key={featureIndex} className="flex items-start">
                          <CheckCircle className="h-5 w-5 text-[#4bb4f5] flex-shrink-0 mt-0.5" />
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
              {t('View and compare all the features of our packages')}
            </h2>
            <p className="text-lg text-slate-600">
              {t('Do you have a moment? There are quite a few.')}
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full bg-white rounded-2xl shadow-lg overflow-hidden">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-800 w-1/2">{t('Features')}</th>
                  <th className="px-6 py-4 text-center text-sm font-semibold text-slate-800">{t('Pure Invoice')}</th>
                  <th className="px-6 py-4 text-center text-sm font-semibold text-slate-800 bg-blue-50">{t('Basic')}</th>
                  <th className="px-6 py-4 text-center text-sm font-semibold text-slate-800">{t('Professional')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                <tr className="bg-amber-50">
                  <td className="px-6 py-4 text-sm font-semibold text-slate-800">{t('Price')}</td>
                  <td className="px-6 py-4 text-center text-sm text-slate-600">{t('£7.50 p/m excl. VAT')}</td>
                  <td className="px-6 py-4 text-center text-sm text-slate-600 bg-blue-50">{t('£12.50 p/m excl. VAT')}</td>
                  <td className="px-6 py-4 text-center text-sm text-slate-600">{t('£25.- p/m excl. VAT')}</td>
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
                              <CheckCircle className="h-5 w-5 text-[#4bb4f5] mx-auto" />
                            ) : (
                              <X className="h-5 w-5 text-gray-400 mx-auto" />
                            )
                          ) : (
                            <span className="text-sm text-slate-600">{feature.pure}</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-center bg-blue-50">
                          {typeof feature.basic === 'boolean' ? (
                            feature.basic ? (
                              <CheckCircle className="h-5 w-5 text-[#4bb4f5] mx-auto" />
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
                              <CheckCircle className="h-5 w-5 text-[#4bb4f5] mx-auto" />
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
            {t('Frequently Asked Questions')}
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-8">
              <div className="bg-white p-6 rounded-xl shadow-sm">
                <h3 className="text-lg font-bold text-slate-800 mb-3">
                  {t('Can I change plans at any time?')}
                </h3>
                <p className="text-slate-600 leading-relaxed">
                  {t('Yes, you can upgrade or downgrade your plan at any time. Changes take effect immediately, and we\'ll prorate any billing differences.')}
                </p>
              </div>

              <div className="bg-white p-6 rounded-xl shadow-sm">
                <h3 className="text-lg font-bold text-slate-800 mb-3">
                  {t('Is there a free trial?')}
                </h3>
                <p className="text-slate-600 leading-relaxed">
                  {t('Yes! All plans come with a 14-day free trial. No credit card required to start. You can explore all features during your trial period.')}
                </p>
              </div>

              <div className="bg-white p-6 rounded-xl shadow-sm">
                <h3 className="text-lg font-bold text-slate-800 mb-3">
                  {t('Can I cancel at any time?')}
                </h3>
                <p className="text-slate-600 leading-relaxed">
                  {t('Yes, you can cancel your subscription at any time. Your access will continue until the end of your current billing period.')}
                </p>
              </div>
            </div>

            <div className="space-y-8">
              <div className="bg-white p-6 rounded-xl shadow-sm">
                <h3 className="text-lg font-bold text-slate-800 mb-3">
                  {t('What happens if I exceed my project limit?')}
                </h3>
                <p className="text-slate-600 leading-relaxed">
                  {t('If you reach your monthly project limit, you\'ll be prompted to upgrade your plan. You can also wait until the next billing cycle when your limit resets.')}
                </p>
              </div>

              <div className="bg-white p-6 rounded-xl shadow-sm">
                <h3 className="text-lg font-bold text-slate-800 mb-3">
                  {t('Do you offer refunds?')}
                </h3>
                <p className="text-slate-600 leading-relaxed">
                  {t('We offer a 30-day money-back guarantee. If you\'re not satisfied within the first 30 days, we\'ll provide a full refund, no questions asked.')}
                </p>
              </div>

              <div className="bg-white p-6 rounded-xl shadow-sm">
                <h3 className="text-lg font-bold text-slate-800 mb-3">
                  {t('What payment methods do you accept?')}
                </h3>
                <p className="text-slate-600 leading-relaxed">
                  {t('We accept all major credit cards, PayPal, and bank transfers. All payments are processed securely with enterprise-grade encryption.')}
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