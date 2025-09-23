import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { Eye, EyeOff, Loader2, Mail, Lock, User, Building, Phone, Globe, Hash, Percent, Image } from 'lucide-react';
import { useTranslation } from '../../hooks/useTranslation';

const Register = () => {
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    password: '',
    confirm_password: '',
    phone: '',
    company_name: '',
    company_email: '',
    company_phone: '',
    company_address: '',
    company_website: '',
    logo_url: '', // Ensure this is in the initial state
    preferred_paint_brand: 'Dulux',
    vat_number: '',
    vat_rate: 0.20
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { t } = useTranslation();

  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Validate passwords match
    if (formData.password !== formData.confirm_password) {
      setError(t('Passwords do not match'));
      setLoading(false);
      return;
    }

    // Prepare data for backend - explicitly ensure logo_url is included
    const { confirm_password, ...submitData } = formData;
    
    // Explicitly ensure logo_url is included and not undefined/null
    const finalSubmitData = {
      ...submitData,
      logo_url: submitData.logo_url || '' // Ensure it's at least an empty string, not undefined
    };
    
    console.log('Submitting data:', finalSubmitData); // Debug log to verify logo_url is included
    
    const result = await register(finalSubmitData);
    
    if (result.success) {
      navigate('/dashboard');
    } else {
      setError(result.error);
    }
    
    setLoading(false);
  };

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    setFormData(prevFormData => ({
      ...prevFormData,
      [name]: type === 'number' ? parseFloat(value) : value
    }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 via-white to-purple-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-bold text-slate-800">
            {t('Start your free trial')}
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            {t('Already have an account?')}{' '}
            <Link to="/login" className="font-medium text-[#4bb4f5] hover:text-[#4bb4f5]">
              {t('Sign in')}
            </Link>
          </p>
        </div>

        <div className="mt-8 bg-white shadow-lg rounded-lg p-8">
          <form onSubmit={handleSubmit} className="space-y-8">
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-md p-4">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            {/* Personal Information */}
            <div>
              <h3 className="text-lg font-medium text-slate-800 mb-6 pb-2 border-b border-purple-100">
                {t('Personal Information')}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="first_name" className="block text-sm font-medium text-gray-700 mb-2">
                    {t('First Name *')}
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <User className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      id="first_name"
                      name="first_name"
                      type="text"
                      required
                      value={formData.first_name}
                      onChange={handleChange}
                      className="pl-10 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#4bb4f5] focus:border-transparent"
                      placeholder={t('John')}
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="last_name" className="block text-sm font-medium text-gray-700 mb-2">
                    {t('Last Name *')}
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <User className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      id="last_name"
                      name="last_name"
                      type="text"
                      required
                      value={formData.last_name}
                      onChange={handleChange}
                      className="pl-10 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#4bb4f5] focus:border-transparent"
                      placeholder={t('Smith')}
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                    {t('Email Address *')}
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Mail className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      required
                      value={formData.email}
                      onChange={handleChange}
                      className="pl-10 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#4bb4f5] focus:border-transparent"
                      placeholder="john@example.com"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                    {t('Personal Phone')}
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Phone className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      id="phone"
                      name="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={handleChange}
                      className="pl-10 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#4bb4f5] focus:border-transparent"
                      placeholder="+44 7700 900123"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                    {t('Password *')}
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Lock className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      id="password"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={formData.password}
                      onChange={handleChange}
                      className="pl-10 pr-10 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#4bb4f5] focus:border-transparent"
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="h-5 w-5 text-gray-400" />
                      ) : (
                        <Eye className="h-5 w-5 text-gray-400" />
                      )}
                    </button>
                  </div>
                </div>

                <div>
                  <label htmlFor="confirm_password" className="block text-sm font-medium text-gray-700 mb-2">
                    {t('Confirm Password *')}
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Lock className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      id="confirm_password"
                      name="confirm_password"
                      type={showConfirmPassword ? 'text' : 'password'}
                      required
                      value={formData.confirm_password}
                      onChange={handleChange}
                      className="pl-10 pr-10 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#4bb4f5] focus:border-transparent"
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-5 w-5 text-gray-400" />
                      ) : (
                        <Eye className="h-5 w-5 text-gray-400" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Company Information */}
            <div>
              <h3 className="text-lg font-medium text-slate-800 mb-6 pb-2 border-b border-purple-100">
                {t('Company Information')}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label htmlFor="company_name" className="block text-sm font-medium text-gray-700 mb-2">
                    {t('Company Name *')}
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Building className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      id="company_name"
                      name="company_name"
                      type="text"
                      required
                      value={formData.company_name}
                      onChange={handleChange}
                      className="pl-10 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#4bb4f5] focus:border-transparent"
                      placeholder={t('Smith Painting Services')}
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="company_email" className="block text-sm font-medium text-gray-700 mb-2">
                    {t('Company Email')}
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Mail className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      id="company_email"
                      name="company_email"
                      type="email"
                      value={formData.company_email}
                      onChange={handleChange}
                      className="pl-10 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#4bb4f5] focus:border-transparent"
                      placeholder="info@smithpainting.com"
                    />
                  </div>
                  <p className="mt-1 text-xs text-gray-500">{t('Leave blank to use your personal email')}</p>
                </div>

                <div>
                  <label htmlFor="company_phone" className="block text-sm font-medium text-gray-700 mb-2">
                    {t('Company Phone')}
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Phone className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      id="company_phone"
                      name="company_phone"
                      type="tel"
                      value={formData.company_phone}
                      onChange={handleChange}
                      className="pl-10 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#4bb4f5] focus:border-transparent"
                      placeholder="+44 20 7123 4567"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="company_website" className="block text-sm font-medium text-gray-700 mb-2">
                    {t('Company Website')}
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Globe className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      id="company_website"
                      name="company_website"
                      type="url"
                      value={formData.company_website}
                      onChange={handleChange}
                      className="pl-10 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#4bb4f5] focus:border-transparent"
                      placeholder="https://www.smithpainting.com"
                    />
                  </div>
                </div>

                {/* Logo URL Field - This is the key addition */}
                <div>
                  <label htmlFor="logo_url" className="block text-sm font-medium text-gray-700 mb-2">
                    {t('Company Logo URL')}
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Image className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      id="logo_url"
                      name="logo_url"
                      type="url"
                      value={formData.logo_url}
                      onChange={handleChange}
                      className="pl-10 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#4bb4f5] focus:border-transparent"
                      placeholder="https://example.com/logo.png"
                    />
                  </div>
                  <p className="mt-1 text-xs text-gray-500">{t('URL to your company logo image (PNG, JPG, SVG supported)')}</p>
                </div>

                <div>
                  <label htmlFor="preferred_paint_brand" className="block text-sm font-medium text-gray-700 mb-2">
                    {t('Preferred Paint Brand')}
                  </label>
                  <select
                    id="preferred_paint_brand"
                    name="preferred_paint_brand"
                    value={formData.preferred_paint_brand}
                    onChange={handleChange}
                    className="block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#4bb4f5] focus:border-transparent"
                  >
                    <option value="Dulux">{t('Dulux')}</option>
                    <option value="Farrow & Ball">{t('Farrow & Ball')}</option>
                    <option value="Crown">{t('Crown')}</option>
                    <option value="Little Greene">{t('Little Greene')}</option>
                    <option value="Benjamin Moore">{t('Benjamin Moore')}</option>
                    <option value="Sherwin-Williams">{t('Sherwin-Williams')}</option>
                    <option value="Other">{t('Other')}</option>
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label htmlFor="company_address" className="block text-sm font-medium text-gray-700 mb-2">
                    {t('Company Address')}
                  </label>
                  <textarea
                    id="company_address"
                    name="company_address"
                    rows={3}
                    value={formData.company_address}
                    onChange={handleChange}
                    className="block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#4bb4f5] focus:border-transparent"
                    placeholder={t('123 High Street, London, SW1A 1AA')}
                  />
                </div>
              </div>
            </div>

            {/* VAT Information */}
            <div>
              <h3 className="text-lg font-medium text-slate-800 mb-6 pb-2 border-b border-purple-100">
                {t('VAT Information')}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="vat_number" className="block text-sm font-medium text-gray-700 mb-2">
                    {t('VAT Number')}
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Hash className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      id="vat_number"
                      name="vat_number"
                      type="text"
                      value={formData.vat_number}
                      onChange={handleChange}
                      className="pl-10 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#4bb4f5] focus:border-transparent"
                      placeholder="GB123456789"
                    />
                  </div>
                  <p className="mt-1 text-xs text-gray-500">{t('Optional - for VAT registered businesses')}</p>
                </div>

                <div>
                  <label htmlFor="vat_rate" className="block text-sm font-medium text-gray-700 mb-2">
                    {t('VAT Rate (%)')}
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Percent className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      id="vat_rate"
                      name="vat_rate"
                      type="number"
                      min="0"
                      max="1"
                      step="0.01"
                      value={formData.vat_rate}
                      onChange={handleChange}
                      className="pl-10 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#4bb4f5] focus:border-transparent"
                      placeholder="0.20"
                    />
                  </div>
                  <p className="mt-1 text-xs text-gray-500">{t('Standard UK VAT rate is 0.20 (20%)')}</p>
                </div>
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[#4bb4f5] hover:bg-[#4bb4f5] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#4bb4f5] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {t('Start Free Trial')}
              </button>
            </div>

            <div className="text-center">
              <p className="text-xs text-gray-500">
                {t('By creating an account, you agree to our')}{' '}
                <Link to="/terms-of-service" className="text-[#4bb4f5] hover:text-green-200">{t('Terms of Service')}</Link>
                {' '}{t('and')}{' '}
                <Link to="/privacy-policy" className="text-[#4bb4f5] hover:text-green-200">{t('Privacy Policy')}</Link>
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Register;