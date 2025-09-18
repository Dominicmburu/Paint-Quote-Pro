import React, { useState } from 'react';
import { AlertCircle, RefreshCw, CreditCard, Phone, Mail, ArrowLeft, CheckCircle } from 'lucide-react';
import { useTranslation } from '../hooks/useTranslation';

const PaymentFailed = () => {
  const [isRetrying, setIsRetrying] = useState(false);
  const { t } = useTranslation();
  
  const handleRetryPayment = () => {
    setIsRetrying(true);
    // Simulate retry process
    setTimeout(() => {
      setIsRetrying(false);
      window.location.href = '/pricing';
    }, 2000);
  };

  const commonIssues = [
    {
      title: t("Insufficient Funds"),
      description: t("Your card may not have enough available balance."),
      solution: t("Check your account balance or try a different payment method.")
    },
    {
      title: t("Card Declined"),
      description: t("Your bank may have declined the transaction for security reasons."),
      solution: t("Contact your bank to authorize the payment or use a different card.")
    },
    {
      title: t("Expired Card"),
      description: t("The payment card may have expired."),
      solution: t("Update your card information with a valid, non-expired card.")
    },
    {
      title: t("Incorrect Details"),
      description: t("Card number, CVV, or billing address may be incorrect."),
      solution: t("Double-check all card details and billing information.")
    }
  ];

  const alternativePaymentMethods = [
    {
      name: t("Different Credit Card"),
      description: t("Try using a different credit or debit card"),
      icon: <CreditCard className="h-6 w-6 text-blue-600" />
    },
    {
      name: t("Contact Your Bank"),
      description: t("Call your bank to authorize the payment"),
      icon: <Phone className="h-6 w-6 text-green-600" />
    },
    {
      name: t("Contact Support"),
      description: t("Our team can help with payment issues"),
      icon: <Mail className="h-6 w-6 text-purple-600" />
    }
  ];

  return (
    <div className="min-h-screen bg-yellow-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-red-500 to-red-600 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center">
            <div className="bg-white rounded-full p-3 mr-4">
              <AlertCircle className="h-8 w-8 text-red-500" />
            </div>
            <h1 className="text-3xl font-bold text-white">{t('Payment Failed')}</h1>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Failed Message */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8 mb-8">
          <div className="text-center mb-8">
            <div className="bg-red-100 rounded-full p-6 w-24 h-24 mx-auto mb-6">
              <AlertCircle className="h-12 w-12 text-red-500 mx-auto" />
            </div>
            <h2 className="text-2xl font-bold text-purple-700 mb-4">
              {t('We couldn\'t process your payment')}
            </h2>
            <p className="text-gray-600 text-lg">
              {t('Don\'t worry - this happens sometimes. Your card was not charged and we can help you resolve this quickly.')}
            </p>
          </div>

          {/* Retry Button */}
          <div className="text-center mb-8">
            <button
              onClick={handleRetryPayment}
              disabled={isRetrying}
              className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-8 py-3 rounded-lg font-semibold transition-colors flex items-center justify-center mx-auto"
            >
              {isRetrying ? (
                <>
                  <RefreshCw className="h-5 w-5 mr-2 animate-spin" />
                  {t('Redirecting to Payment...')}
                </>
              ) : (
                <>
                  <RefreshCw className="h-5 w-5 mr-2" />
                  {t('Try Payment Again')}
                </>
              )}
            </button>
          </div>

          {/* Common Issues */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-purple-700 mb-6 text-center">
              {t('Common payment issues and solutions:')}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {commonIssues.map((issue, index) => (
                <div key={index} className="bg-red-50 border border-red-200 rounded-lg p-6">
                  <h4 className="font-semibold text-red-700 mb-2">{issue.title}</h4>
                  <p className="text-red-600 text-sm mb-3">{issue.description}</p>
                  <div className="flex items-start">
                    <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 mr-2 flex-shrink-0" />
                    <p className="text-green-700 text-sm font-medium">{issue.solution}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Alternative Payment Methods */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-purple-700 mb-6 text-center">
              {t('What you can do next:')}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {alternativePaymentMethods.map((method, index) => (
                <div key={index} className="text-center p-6 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors cursor-pointer">
                  <div className="flex justify-center mb-4">
                    {method.icon}
                  </div>
                  <h4 className="font-semibold text-purple-700 mb-3">{method.name}</h4>
                  <p className="text-gray-600 text-sm">{method.description}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => window.location.href = '/contact'}
              className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-3 rounded-lg font-semibold transition-colors"
            >
              {t('Contact Support')}
            </button>
            
            <button
              onClick={() => window.location.href = '/'}
              className="border-2 border-gray-300 text-gray-700 hover:bg-gray-50 px-8 py-3 rounded-lg font-semibold transition-colors flex items-center justify-center"
            >
              <ArrowLeft className="h-5 w-5 mr-2" />
              {t('Back to Home')}
            </button>
          </div>
        </div>

        {/* Free Trial Option */}
        <div className="bg-gradient-to-r from-green-500 to-blue-500 rounded-2xl p-8 text-white text-center">
          <h3 className="text-xl font-bold mb-4">{t('No Credit Card? No Problem!')}</h3>
          <p className="text-green-100 mb-6">
            {t('Start with our 14-day free trial. You can add payment details later when you\'re ready to continue.')}
          </p>
          <button
            onClick={() => window.location.href = '/register'}
            className="bg-white text-green-700 hover:bg-gray-100 px-8 py-3 rounded-lg font-semibold transition-colors"
          >
            {t('Start Free Trial Instead')}
          </button>
        </div>

        {/* Support Information */}
        <div className="mt-8 bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-purple-700 mb-4 text-center">
            {t('Need immediate assistance?')}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <Mail className="h-8 w-8 text-purple-600 mx-auto mb-3" />
              <h4 className="font-semibold text-purple-700 mb-2">{t('Email Support')}</h4>
              <p className="text-gray-600 text-sm mb-3">{t('Get help within 2 hours')}</p>
              <button
                onClick={() => window.location.href = 'mailto:support@paintquotepro.com'}
                className="text-purple-600 hover:text-purple-700 font-semibold"
              >
                support@paintquotepro.com
              </button>
            </div>
            
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <Phone className="h-8 w-8 text-purple-600 mx-auto mb-3" />
              <h4 className="font-semibold text-purple-700 mb-2">{t('Phone Support')}</h4>
              <p className="text-gray-600 text-sm mb-3">{t('Available Mon-Fri 9AM-6PM')}</p>
              <button
                onClick={() => window.location.href = 'tel:+441234567890'}
                className="text-purple-600 hover:text-purple-700 font-semibold"
              >
                +44 123 456 7890
              </button>
            </div>
          </div>
        </div>

        {/* Error Code Information */}
        <div className="mt-8 text-center">
          <p className="text-gray-500 text-sm">
            {t('If contacting support, please reference error code:')}
            <span className="font-mono bg-gray-100 px-2 py-1 rounded ml-2">
              PAY_FAILED_{Date.now().toString().slice(-6)}
            </span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default PaymentFailed;