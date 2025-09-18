import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, ArrowLeft, CheckCircle } from 'lucide-react';
import api from '../../services/api';
import { useTranslation } from '../../hooks/useTranslation';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const { t } = useTranslation();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await api.post('/auth/forgot-password', { email });
      setSent(true);
    } catch (err) {
      setError(err.response?.data?.error || t('Failed to send reset email'));
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-yellow-50 via-white to-purple-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <CheckCircle className="mx-auto h-16 w-16 text-green-500" />
            <h2 className="mt-6 text-3xl font-bold text-purple-700">
              {t('Check your email')}
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              {t('We\'ve sent a password reset link to')} <strong>{email}</strong>
            </p>
            <p className="mt-4 text-sm text-gray-500">
              {t('Didn\'t receive the email? Check your spam folder or')}{' '}
              <button
                onClick={() => setSent(false)}
                className="text-purple-600 hover:text-purple-500 font-medium"
              >
                {t('try again')}
              </button>
            </p>
          </div>
          <div className="text-center">
            <Link
              to="/login"
              className="inline-flex items-center text-purple-600 hover:text-purple-500"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              {t('Back to sign in')}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 via-white to-purple-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-bold text-purple-700">
            {t('Forgot your password?')}
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            {t('Enter your email address and we\'ll send you a link to reset your password.')}
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              {t('Email address')}
            </label>
            <div className="mt-1 relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Mail className="h-5 w-5 text-gray-400" />
              </div>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-10 block w-full border border-gray-300 rounded-md px-3 py-2 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder={t('Enter your email')}
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? t('Sending...') : t('Send reset link')}
            </button>
          </div>

          <div className="text-center">
            <Link
              to="/login"
              className="inline-flex items-center text-purple-600 hover:text-purple-500"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              {t('Back to sign in')}
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ForgotPassword;