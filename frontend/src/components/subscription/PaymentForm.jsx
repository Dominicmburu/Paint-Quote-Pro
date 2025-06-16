import React, { useState } from 'react';
import { CreditCard, Lock, AlertCircle, CheckCircle } from 'lucide-react';

const PaymentForm = ({ onSubmit, loading = false, error = '', plan = null }) => {
  const [formData, setFormData] = useState({
    cardNumber: '',
    expiryDate: '',
    cvv: '',
    cardholderName: '',
    billingAddress: {
      line1: '',
      line2: '',
      city: '',
      postalCode: '',
      country: 'GB'
    }
  });

  const [formErrors, setFormErrors] = useState({});

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear error when user starts typing
    if (formErrors[field]) {
      setFormErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  const handleBillingAddressChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      billingAddress: {
        ...prev.billingAddress,
        [field]: value
      }
    }));
  };

  const formatCardNumber = (value) => {
    // Remove all non-digit characters
    const digits = value.replace(/\D/g, '');
    // Add spaces every 4 digits
    const formatted = digits.replace(/(\d{4})(?=\d)/g, '$1 ');
    return formatted.substring(0, 19); // Limit to 16 digits + 3 spaces
  };

  const formatExpiryDate = (value) => {
    // Remove all non-digit characters
    const digits = value.replace(/\D/g, '');
    // Add slash after 2 digits
    if (digits.length >= 2) {
      return `${digits.substring(0, 2)}/${digits.substring(2, 4)}`;
    }
    return digits;
  };

  const validateForm = () => {
    const errors = {};

    // Card number validation (basic)
    const cardDigits = formData.cardNumber.replace(/\D/g, '');
    if (!cardDigits || cardDigits.length < 16) {
      errors.cardNumber = 'Please enter a valid card number';
    }

    // Expiry date validation
    const expiryDigits = formData.expiryDate.replace(/\D/g, '');
    if (!expiryDigits || expiryDigits.length < 4) {
      errors.expiryDate = 'Please enter a valid expiry date';
    } else {
      const month = parseInt(expiryDigits.substring(0, 2));
      const year = parseInt(`20${expiryDigits.substring(2, 4)}`);
      const currentYear = new Date().getFullYear();
      const currentMonth = new Date().getMonth() + 1;
      
      if (month < 1 || month > 12) {
        errors.expiryDate = 'Invalid month';
      } else if (year < currentYear || (year === currentYear && month < currentMonth)) {
        errors.expiryDate = 'Card has expired';
      }
    }

    // CVV validation
    if (!formData.cvv || formData.cvv.length < 3) {
      errors.cvv = 'Please enter a valid CVV';
    }

    // Cardholder name validation
    if (!formData.cardholderName.trim()) {
      errors.cardholderName = 'Please enter the cardholder name';
    }

    // Billing address validation
    if (!formData.billingAddress.line1.trim()) {
      errors.billingAddressLine1 = 'Please enter your address';
    }
    if (!formData.billingAddress.city.trim()) {
      errors.billingAddressCity = 'Please enter your city';
    }
    if (!formData.billingAddress.postalCode.trim()) {
      errors.billingAddressPostalCode = 'Please enter your postal code';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (validateForm()) {
      onSubmit(formData);
    }
  };

  const getCardType = (cardNumber) => {
    const number = cardNumber.replace(/\D/g, '');
    if (number.startsWith('4')) return 'visa';
    if (number.startsWith('5') || number.startsWith('2')) return 'mastercard';
    if (number.startsWith('3')) return 'amex';
    return 'generic';
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex items-center">
            <AlertCircle className="h-5 w-5 text-red-400 mr-3" />
            <p className="text-sm text-red-600">{error}</p>
          </div>
        </div>
      )}

      {plan && (
        <div className="bg-purple-50 border border-purple-200 rounded-md p-4">
          <div className="flex items-center">
            <CheckCircle className="h-5 w-5 text-purple-400 mr-3" />
            <div>
              <p className="text-sm font-medium text-purple-900">
                {plan.name} Plan - {plan.billingCycle}
              </p>
              <p className="text-sm text-purple-700">
                £{plan.price}/{plan.billingCycle === 'yearly' ? 'year' : 'month'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Card Information */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-900 flex items-center">
          <CreditCard className="h-5 w-5 mr-2" />
          Payment Information
        </h3>

        {/* Card Number */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Card Number
          </label>
          <div className="relative">
            <input
              type="text"
              value={formData.cardNumber}
              onChange={(e) => handleInputChange('cardNumber', formatCardNumber(e.target.value))}
              className={`w-full border rounded-md px-3 py-2 pr-10 focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                formErrors.cardNumber ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="1234 5678 9012 3456"
              maxLength="19"
            />
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
              <CreditCard className={`h-5 w-5 ${getCardType(formData.cardNumber) === 'visa' ? 'text-blue-600' : 'text-gray-400'}`} />
            </div>
          </div>
          {formErrors.cardNumber && (
            <p className="mt-1 text-sm text-red-600">{formErrors.cardNumber}</p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          {/* Expiry Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Expiry Date
            </label>
            <input
              type="text"
              value={formData.expiryDate}
              onChange={(e) => handleInputChange('expiryDate', formatExpiryDate(e.target.value))}
              className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                formErrors.expiryDate ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="MM/YY"
              maxLength="5"
            />
            {formErrors.expiryDate && (
              <p className="mt-1 text-sm text-red-600">{formErrors.expiryDate}</p>
            )}
          </div>

          {/* CVV */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              CVV
            </label>
            <input
              type="text"
              value={formData.cvv}
              onChange={(e) => handleInputChange('cvv', e.target.value.replace(/\D/g, '').substring(0, 4))}
              className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                formErrors.cvv ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="123"
              maxLength="4"
            />
            {formErrors.cvv && (
              <p className="mt-1 text-sm text-red-600">{formErrors.cvv}</p>
            )}
          </div>
        </div>

        {/* Cardholder Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Cardholder Name
          </label>
          <input
            type="text"
            value={formData.cardholderName}
            onChange={(e) => handleInputChange('cardholderName', e.target.value)}
            className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 ${
              formErrors.cardholderName ? 'border-red-300' : 'border-gray-300'
            }`}
            placeholder="John Smith"
          />
          {formErrors.cardholderName && (
            <p className="mt-1 text-sm text-red-600">{formErrors.cardholderName}</p>
          )}
        </div>
      </div>

      {/* Billing Address */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-900">Billing Address</h3>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Address Line 1
          </label>
          <input
            type="text"
            value={formData.billingAddress.line1}
            onChange={(e) => handleBillingAddressChange('line1', e.target.value)}
            className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 ${
              formErrors.billingAddressLine1 ? 'border-red-300' : 'border-gray-300'
            }`}
            placeholder="123 Main Street"
          />
          {formErrors.billingAddressLine1 && (
            <p className="mt-1 text-sm text-red-600">{formErrors.billingAddressLine1}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Address Line 2 (Optional)
          </label>
          <input
            type="text"
            value={formData.billingAddress.line2}
            onChange={(e) => handleBillingAddressChange('line2', e.target.value)}
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
            placeholder="Apartment, suite, etc."
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              City
            </label>
            <input
              type="text"
              value={formData.billingAddress.city}
              onChange={(e) => handleBillingAddressChange('city', e.target.value)}
              className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                formErrors.billingAddressCity ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="London"
            />
            {formErrors.billingAddressCity && (
              <p className="mt-1 text-sm text-red-600">{formErrors.billingAddressCity}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Postal Code
            </label>
            <input
              type="text"
              value={formData.billingAddress.postalCode}
              onChange={(e) => handleBillingAddressChange('postalCode', e.target.value.toUpperCase())}
              className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                formErrors.billingAddressPostalCode ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="SW1A 1AA"
            />
            {formErrors.billingAddressPostalCode && (
              <p className="mt-1 text-sm text-red-600">{formErrors.billingAddressPostalCode}</p>
            )}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Country
          </label>
          <select
            value={formData.billingAddress.country}
            onChange={(e) => handleBillingAddressChange('country', e.target.value)}
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            <option value="GB">United Kingdom</option>
            <option value="IE">Ireland</option>
            <option value="US">United States</option>
            <option value="CA">Canada</option>
            <option value="AU">Australia</option>
          </select>
        </div>
      </div>

      {/* Security Notice */}
      <div className="bg-gray-50 border border-gray-200 rounded-md p-4">
        <div className="flex items-center">
          <Lock className="h-5 w-5 text-green-500 mr-3" />
          <div>
            <p className="text-sm font-medium text-gray-900">Secure Payment</p>
            <p className="text-sm text-gray-600">
              Your payment information is encrypted and secure. We use industry-standard SSL encryption.
            </p>
          </div>
        </div>
      </div>

      {/* Submit Button */}
      <div className="pt-4">
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-purple-600 hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-white py-3 px-4 rounded-md font-medium transition-colors flex items-center justify-center"
        >
          {loading ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
              Processing...
            </>
          ) : (
            <>
              <Lock className="h-5 w-5 mr-2" />
              Complete Payment
            </>
          )}
        </button>
      </div>

      {/* Terms */}
      <div className="text-center">
        <p className="text-xs text-gray-500">
          By completing this payment, you agree to our{' '}
          <a href="/terms" className="text-purple-600 hover:text-purple-700">
            Terms of Service
          </a>{' '}
          and{' '}
          <a href="/privacy" className="text-purple-600 hover:text-purple-700">
            Privacy Policy
          </a>
          .
        </p>
      </div>
    </form>
  );
};

export default PaymentForm;