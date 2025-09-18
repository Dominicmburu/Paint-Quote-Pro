import React, { useEffect, useState } from 'react';
import {
    XCircle,
    ArrowLeft,
    HelpCircle,
    CreditCard,
    MessageSquare,
    Clock,
    Star,
    Users
} from 'lucide-react';
import api from '../services/api';
import { useTranslation } from '../hooks/useTranslation';

const PaymentCancelled = () => {
    const [userInfo, setUserInfo] = useState(null);
    const [loading, setLoading] = useState(true);
    const { t } = useTranslation();

    useEffect(() => {
        const fetchUserInfo = async () => {
            try {
                const response = await api.fetch('/auth/me', {
                    headers: {
                        Authorization: `Bearer ${authToken}`,
                        'Content-Type': 'application/json'
                    }
                });

                if (response.ok) {
                    const userData = await response.json();
                    setUserInfo(userData);
                }
            } catch (error) {
                console.error('Error fetching user info:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchUserInfo();
    }, []);

    const firstName = userInfo?.first_name || t('there');

    const reasons = [
        {
            icon: <CreditCard className="h-6 w-6 text-blue-600" />,
            title: t('Payment Method Issues'),
            description: t('Check if your card details are correct or try a different payment method.'),
            action: t('Update Payment Info'),
            redirect: '/subscription/billing'
        },
        {
            icon: <HelpCircle className="h-6 w-6 text-yellow-600" />,
            title: t('Need More Information'),
            description: t('Want to learn more about our features before subscribing?'),
            action: t('View Features'),
            redirect: '/features'
        },
        {
            icon: <MessageSquare className="h-6 w-6 text-green-600" />,
            title: t('Have Questions'),
            description: t('Our support team is here to help with any concerns you might have.'),
            action: t('Contact Support'),
            redirect: '/contact'
        }
    ];

    const plans = [
        {
            id: 'starter',
            name: t('Starter'),
            price: 29,
            yearlyPrice: 290,
            description: t('Perfect for small painting businesses'),
            features: [
                t('Up to 5 projects/month'),
                t('Basic AI analysis'),
                t('PDF quotes'),
                t('2 team members')
            ],
            savings: 58
        },
        {
            id: 'professional',
            name: t('Professional'),
            price: 79,
            yearlyPrice: 790,
            description: t('Most popular for growing businesses'),
            features: [
                t('Up to 25 projects/month'),
                t('Advanced AI analysis'),
                t('Custom templates'),
                t('10 team members')
            ],
            popular: true,
            savings: 158
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
                t('White-label options'),
                t('API access')
            ],
            savings: 398
        }
    ];

    const handleNavigate = (url) => {
        window.location.href = url;
    };

    return (
        <div className="min-h-screen bg-yellow-50">
            {/* Header */}
            <div className="bg-gradient-to-r from-orange-500 to-red-500 py-8">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-center">
                    <div className="bg-white rounded-full p-3 mr-4">
                        <XCircle className="h-8 w-8 text-orange-500" />
                    </div>
                    <h1 className="text-3xl font-bold text-white">{t('Payment Cancelled')}</h1>
                </div>
            </div>

            {/* Main */}
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                {/* Cancel Message */}
                <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8 mb-8">
                    <div className="text-center mb-8">
                        <div className="bg-orange-100 rounded-full p-6 w-24 h-24 mx-auto mb-6">
                            <XCircle className="h-12 w-12 text-orange-500 mx-auto" />
                        </div>
                        <h2 className="text-2xl font-bold text-purple-700 mb-4">
                            {t('No worries')}{firstName !== t('there') ? `, ${firstName}` : ''}!
                        </h2>
                        <p className="text-gray-600 text-lg">
                            {t('Your payment was cancelled and you haven\'t been charged. We understand that sometimes you need more time to decide.')}
                        </p>
                    </div>

                    {/* Retry CTA */}
                    <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 mb-8 text-center">
                        <h3 className="text-lg font-semibold text-blue-800 mb-3">{t('Ready to try again?')}</h3>
                        <p className="text-blue-700 mb-4">
                            {t('If it was just a temporary issue, you can retry now.')}
                        </p>
                        <button
                            onClick={() => handleNavigate('/pricing')}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-semibold transition-colors"
                        >
                            <CreditCard className="h-5 w-5 mr-2 inline" />
                            {t('Try Payment Again')}
                        </button>
                    </div>

                    {/* Reasons Grid */}
                    <div className="mb-8">
                        <h3 className="text-lg font-semibold text-purple-700 mb-6 text-center">
                            {t('Common reasons people cancel and how we can help:')}
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {reasons.map((reason, index) => (
                                <div
                                    key={index}
                                    className="text-center p-6 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors cursor-pointer"
                                    onClick={() => handleNavigate(reason.redirect)}
                                >
                                    <div className="flex justify-center mb-4">{reason.icon}</div>
                                    <h4 className="font-semibold text-purple-700 mb-3">{reason.title}</h4>
                                    <p className="text-gray-600 text-sm mb-4">{reason.description}</p>
                                    <span className="text-purple-600 hover:text-purple-700 font-semibold text-sm">
                                        {reason.action} →
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <button
                            onClick={() => handleNavigate('/pricing')}
                            className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 rounded-lg font-semibold transition-colors"
                        >
                            {t('Try Again')}
                        </button>
                        <button
                            onClick={() => handleNavigate('/')}
                            className="border-2 border-purple-600 text-purple-600 hover:bg-purple-600 hover:text-white px-8 py-3 rounded-lg font-semibold transition-colors flex items-center justify-center"
                        >
                            <ArrowLeft className="h-5 w-5 mr-2" />
                            {t('Back to Home')}
                        </button>
                    </div>
                </div>

                {/* Plan Overview */}
                <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8 mb-8">
                    <h3 className="text-xl font-bold text-purple-700 mb-6 text-center">
                        {t('Choose the plan that\'s right for you')}
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {plans.map((plan) => (
                            <div
                                key={plan.id}
                                onClick={() => handleNavigate(`/pricing?plan=${plan.id}&retry=true`)}
                                className={`relative border-2 rounded-xl p-6 cursor-pointer transition-all hover:shadow-lg ${plan.popular ? 'border-green-500 bg-green-50' : 'border-gray-200 hover:border-purple-300'
                                    }`}
                            >
                                {plan.popular && (
                                    <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                                        <span className="bg-green-500 text-white px-3 py-1 rounded-full text-sm font-medium flex items-center">
                                            <Star className="h-3 w-3 mr-1" />
                                            {t('Most Popular')}
                                        </span>
                                    </div>
                                )}

                                <div className="text-center mb-4">
                                    <h4 className="text-lg font-bold text-purple-700">{plan.name}</h4>
                                    <div className="text-3xl font-bold text-purple-700 mt-2">
                                        £{plan.price}
                                        <span className="text-sm text-gray-500 font-normal">/{t('month')}</span>
                                    </div>
                                    <p className="text-green-600 text-xs font-medium mt-1">{t('Save')} £{plan.savings}/{t('yr')}</p>
                                    <p className="text-gray-600 text-sm mt-2">{plan.description}</p>
                                </div>

                                <ul className="space-y-2 mb-6">
                                    {plan.features.map((feature, i) => (
                                        <li key={i} className="text-sm text-gray-600 flex items-center">
                                            <div className="w-1.5 h-1.5 bg-green-500 rounded-full mr-2" />
                                            {feature}
                                        </li>
                                    ))}
                                </ul>

                                <button
                                    className={`w-full py-2 px-4 rounded-lg font-semibold transition-colors ${plan.popular
                                            ? 'bg-green-600 hover:bg-green-700 text-white'
                                            : 'bg-purple-600 hover:bg-purple-700 text-white'
                                        }`}
                                >
                                    {t('Choose')} {plan.name}
                                </button>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Free Trial CTA */}
                <div className="bg-gradient-to-r from-purple-600 to-green-600 rounded-2xl p-8 text-white text-center mb-8">
                    <div className="flex items-center justify-center mb-4">
                        <Clock className="h-8 w-8 mr-3" />
                        <h3 className="text-xl font-bold">{t('Remember: 14-Day Free Trial')}</h3>
                    </div>
                    <p className="text-purple-100 mb-6">
                        {t('You can try Paint Quote Pro free for 14 days. No credit card needed to start.')}
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <button
                            onClick={() => handleNavigate('/register')}
                            className="bg-yellow-400 hover:bg-yellow-500 text-purple-900 px-6 py-3 rounded-lg font-semibold transition-colors"
                        >
                            {t('Start Free Trial')}
                        </button>
                        <button
                            onClick={() => handleNavigate('/contact')}
                            className="border-2 border-white text-white hover:bg-white hover:text-purple-700 px-6 py-3 rounded-lg font-semibold transition-colors"
                        >
                            {t('Contact Sales')}
                        </button>
                    </div>
                </div>

                {/* Testimonials */}
                <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8 mb-8">
                    <h3 className="text-xl font-bold text-purple-700 mb-6 text-center">
                        {t('Why customers love Paint Quote Pro')}
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {[
                            {
                                icon: <Clock className="h-8 w-8 text-purple-600" />,
                                title: t('Save Time'),
                                desc: t('Create quotes 10x faster with AI-powered floor plan analysis')
                            },
                            {
                                icon: <Star className="h-8 w-8 text-green-600" />,
                                title: t('Look Professional'),
                                desc: t('Impress clients with beautifully formatted PDF quotes')
                            },
                            {
                                icon: <Users className="h-8 w-8 text-blue-600" />,
                                title: t('Scale Business'),
                                desc: t('Handle more projects with team collaboration tools')
                            }
                        ].map((item, i) => (
                            <div key={i} className="text-center">
                                <div className="rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: 'rgba(0,0,0,0.05)' }}>
                                    {item.icon}
                                </div>
                                <h4 className="font-semibold text-purple-700 mb-2">{item.title}</h4>
                                <p className="text-gray-600 text-sm">{item.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Final Help */}
                <div className="mt-8 text-center">
                    <p className="text-gray-600 mb-4">{t('Still have questions or concerns?')}</p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center text-sm">
                        <button
                            onClick={() => handleNavigate('/contact')}
                            className="text-purple-600 hover:text-purple-700 font-semibold"
                        >
                            {t('Contact our support team')}
                        </button>
                        <span className="text-gray-400 hidden sm:block">•</span>
                        <button
                            onClick={() => handleNavigate('/features')}
                            className="text-purple-600 hover:text-purple-700 font-semibold"
                        >
                            {t('Learn more about features')}
                        </button>
                        <span className="text-gray-400 hidden sm:block">•</span>
                        <button
                            onClick={() => handleNavigate('/demo')}
                            className="text-purple-600 hover:text-purple-700 font-semibold"
                        >
                            {t('Watch a demo')}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PaymentCancelled;