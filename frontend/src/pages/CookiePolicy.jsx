import React, { useState } from 'react';
import { Cookie, Settings, BarChart3, Target, Shield, Info } from 'lucide-react';
import { useTranslation } from '../hooks/useTranslation';

const CookiePolicy = () => {
  const [cookiePreferences, setCookiePreferences] = useState({
    necessary: true,
    analytics: false,
    marketing: false,
    functional: false
  });
  const { t } = useTranslation();

  const handlePreferenceChange = (type) => {
    if (type === 'necessary') return; // Can't disable necessary cookies
    setCookiePreferences(prev => ({
      ...prev,
      [type]: !prev[type]
    }));
  };

  const savePreferences = () => {
    // In a real app, this would save to localStorage or send to backend
    alert(t('Cookie preferences saved!'));
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-br from-[#4bb4f5] via-[#4bb4f5] to-[#4bb4f5] py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="flex justify-center mb-6">
              <Cookie className="h-16 w-16 text-slate-800" />
            </div>
            <h1 className="text-4xl font-bold text-slate-800 mb-4">{t('Cookie Policy')}</h1>
            <p className="text-lg text-slate-700">
              {t('Learn about how we use cookies and similar technologies on Flotto.')}
            </p>
            <p className="text-sm text-slate-600 mt-2">{t('Last updated: January 1, 2025')}</p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        
        {/* Cookie Preferences Panel */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
          <div className="flex items-center mb-4">
            <Settings className="h-6 w-6 text-[#4bb4f5] mr-3" />
            <h2 className="text-2xl font-bold text-slate-800">{t('Manage Your Cookie Preferences')}</h2>
          </div>
          
          <p className="text-gray-600 mb-6">
            {t('You can control which types of cookies we use by adjusting the settings below:')}
          </p>

          <div className="space-y-4">
            {/* Necessary Cookies */}
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex-1">
                <div className="flex items-center mb-2">
                  <Shield className="h-5 w-5 text-[#4bb4f5] mr-2" />
                  <h3 className="text-lg font-semibold text-slate-800">{t('Necessary Cookies')}</h3>
                </div>
                <p className="text-gray-600 text-sm">
                  {t('Essential for the website to function properly. Cannot be disabled.')}
                </p>
              </div>
              <div className="ml-4">
                <div className="w-12 h-6 bg-[#4bb4f5] rounded-full flex items-center justify-end px-1">
                  <div className="w-4 h-4 bg-white rounded-full"></div>
                </div>
              </div>
            </div>

            {/* Analytics Cookies */}
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex-1">
                <div className="flex items-center mb-2">
                  <BarChart3 className="h-5 w-5 text-blue-500 mr-2" />
                  <h3 className="text-lg font-semibold text-slate-800">{t('Analytics Cookies')}</h3>
                </div>
                <p className="text-gray-600 text-sm">
                  {t('Help us understand how visitors interact with our website.')}
                </p>
              </div>
              <div className="ml-4">
                <button
                  onClick={() => handlePreferenceChange('analytics')}
                  className={`w-12 h-6 rounded-full flex items-center px-1 transition-colors ${
                    cookiePreferences.analytics 
                      ? 'bg-[#4bb4f5] justify-end' 
                      : 'bg-gray-300 justify-start'
                  }`}
                >
                  <div className="w-4 h-4 bg-white rounded-full"></div>
                </button>
              </div>
            </div>

            {/* Marketing Cookies */}
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex-1">
                <div className="flex items-center mb-2">
                  <Target className="h-5 w-5 text-[#4bb4f5] mr-2" />
                  <h3 className="text-lg font-semibold text-slate-800">{t('Marketing Cookies')}</h3>
                </div>
                <p className="text-gray-600 text-sm">
                  {t('Used to deliver personalized advertisements and measure campaign effectiveness.')}
                </p>
              </div>
              <div className="ml-4">
                <button
                  onClick={() => handlePreferenceChange('marketing')}
                  className={`w-12 h-6 rounded-full flex items-center px-1 transition-colors ${
                    cookiePreferences.marketing 
                      ? 'bg-[#4bb4f5] justify-end' 
                      : 'bg-gray-300 justify-start'
                  }`}
                >
                  <div className="w-4 h-4 bg-white rounded-full"></div>
                </button>
              </div>
            </div>

            {/* Functional Cookies */}
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex-1">
                <div className="flex items-center mb-2">
                  <Settings className="h-5 w-5 text-orange-500 mr-2" />
                  <h3 className="text-lg font-semibold text-slate-800">{t('Functional Cookies')}</h3>
                </div>
                <p className="text-gray-600 text-sm">
                  {t('Enable enhanced functionality and personalized features.')}
                </p>
              </div>
              <div className="ml-4">
                <button
                  onClick={() => handlePreferenceChange('functional')}
                  className={`w-12 h-6 rounded-full flex items-center px-1 transition-colors ${
                    cookiePreferences.functional 
                      ? 'bg-[#4bb4f5] justify-end' 
                      : 'bg-gray-300 justify-start'
                  }`}
                >
                  <div className="w-4 h-4 bg-white rounded-full"></div>
                </button>
              </div>
            </div>
          </div>

          <div className="mt-6">
            <button
              onClick={savePreferences}
              className="bg-[#4bb4f5] hover:bg-[#4bb4f5] text-white px-6 py-2 rounded-lg font-semibold transition-colors"
            >
              {t('Save Preferences')}
            </button>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          
          {/* Introduction */}
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-slate-800 mb-4">{t('What Are Cookies?')}</h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              {t('Cookies are small text files that are stored on your device when you visit our website. They help us provide you with a better experience by remembering your preferences and analyzing how you use our site.')}
            </p>
            <p className="text-gray-600 leading-relaxed">
              {t('This Cookie Policy explains how Flotto uses cookies and similar technologies when you visit our website or use our services.')}
            </p>
          </section>

          {/* Types of Cookies */}
          <section className="mb-8">
            <div className="flex items-center mb-4">
              <Info className="h-6 w-6 text-[#4bb4f5] mr-3" />
              <h2 className="text-2xl font-bold text-slate-800">{t('Types of Cookies We Use')}</h2>
            </div>
            
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-slate-800 mb-2 flex items-center">
                  <Shield className="h-5 w-5 text-[#4bb4f5] mr-2" />
                  {t('Strictly Necessary Cookies')}
                </h3>
                <p className="text-gray-600 leading-relaxed mb-2">
                  {t('These cookies are essential for our website to function properly. They enable core functionality such as security, network management, and accessibility.')}
                </p>
                <p className="text-gray-600 leading-relaxed">
                  <strong>{t('Examples:')}</strong> {t('Session cookies, authentication tokens, security cookies')}
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-slate-800 mb-2 flex items-center">
                  <BarChart3 className="h-5 w-5 text-blue-500 mr-2" />
                  {t('Analytics and Performance Cookies')}
                </h3>
                <p className="text-gray-600 leading-relaxed mb-2">
                  {t('These cookies help us understand how visitors interact with our website by collecting and reporting information anonymously.')}
                </p>
                <p className="text-gray-600 leading-relaxed">
                  <strong>{t('Examples:')}</strong> {t('Google Analytics, page view tracking, user behavior analysis')}
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-slate-800 mb-2 flex items-center">
                  <Settings className="h-5 w-5 text-orange-500 mr-2" />
                  {t('Functional Cookies')}
                </h3>
                <p className="text-gray-600 leading-relaxed mb-2">
                  {t('These cookies allow the website to remember choices you make and provide enhanced, more personal features.')}
                </p>
                <p className="text-gray-600 leading-relaxed">
                  <strong>{t('Examples:')}</strong> {t('Language preferences, theme settings, remembered login details')}
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-slate-800 mb-2 flex items-center">
                  <Target className="h-5 w-5 text-[#4bb4f5] mr-2" />
                  {t('Marketing and Advertising Cookies')}
                </h3>
                <p className="text-gray-600 leading-relaxed mb-2">
                  {t('These cookies are used to deliver advertisements that are relevant to you and your interests. They also help measure the effectiveness of advertising campaigns.')}
                </p>
                <p className="text-gray-600 leading-relaxed">
                  <strong>{t('Examples:')}</strong> {t('Social media pixels, retargeting cookies, conversion tracking')}
                </p>
              </div>
            </div>
          </section>

          {/* Third-Party Cookies */}
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-slate-800 mb-4">{t('Third-Party Cookies')}</h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              {t('We may also use third-party cookies from trusted partners to enhance your experience. These include:')}
            </p>
            
            <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4">
              <li><strong>{t('Google Analytics:')}</strong> {t('For website analytics and performance monitoring')}</li>
              <li><strong>{t('Google Ads:')}</strong> {t('For advertising and conversion tracking')}</li>
              <li><strong>{t('Social Media Platforms:')}</strong> {t('For social sharing and authentication')}</li>
              <li><strong>{t('Customer Support Tools:')}</strong> {t('For chat functionality and support')}</li>
            </ul>
          </section>

          {/* How Long Cookies Last */}
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-slate-800 mb-4">{t('How Long Do Cookies Last?')}</h2>
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-slate-800 mb-2">{t('Session Cookies')}</h3>
                <p className="text-gray-600 leading-relaxed">
                  {t('These are temporary cookies that are deleted when you close your browser. They help maintain your session and ensure security during your visit.')}
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-slate-800 mb-2">{t('Persistent Cookies')}</h3>
                <p className="text-gray-600 leading-relaxed">
                  {t('These cookies remain on your device for a set period (usually 1-2 years) or until you delete them. They remember your preferences between visits.')}
                </p>
              </div>
            </div>
          </section>

          {/* Managing Cookies */}
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-slate-800 mb-4">{t('Managing Your Cookie Settings')}</h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              {t('You have several options for managing cookies:')}
            </p>
            
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-slate-800 mb-2">{t('Browser Settings')}</h3>
                <p className="text-gray-600 leading-relaxed">
                  {t('Most browsers allow you to control cookies through their settings. You can block all cookies, block third-party cookies, or delete cookies after each session.')}
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-slate-800 mb-2">{t('Our Cookie Settings')}</h3>
                <p className="text-gray-600 leading-relaxed">
                  {t('Use the cookie preference panel above to control which types of cookies we use on our website.')}
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-slate-800 mb-2">{t('Opt-Out Links')}</h3>
                <p className="text-gray-600 leading-relaxed mb-2">
                  {t('You can opt out of certain third-party cookies using these links:')}
                </p>
                <ul className="list-disc list-inside text-gray-600 space-y-1 ml-4">
                  <li><a href="https://tools.google.com/dlpage/gaoptout" className="text-[#4bb4f5] hover:underline">{t('Google Analytics Opt-out')}</a></li>
                  <li><a href="https://www.google.com/settings/ads" className="text-[#4bb4f5] hover:underline">{t('Google Ads Settings')}</a></li>
                  <li><a href="http://www.aboutads.info/choices/" className="text-[#4bb4f5] hover:underline">{t('Digital Advertising Alliance')}</a></li>
                </ul>
              </div>
            </div>
          </section>

          {/* Impact of Disabling Cookies */}
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-slate-800 mb-4">{t('What Happens If You Disable Cookies?')}</h2>
            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4">
              <p className="text-gray-700 leading-relaxed">
                <strong>{t('Important:')}</strong> {t('Disabling cookies may affect the functionality of our website.')}
              </p>
            </div>
            <p className="text-gray-600 leading-relaxed mb-4">
              {t('If you choose to disable cookies, you may experience:')}
            </p>
            
            <ul className="list-disc list-inside text-gray-600 space-y-1 ml-4">
              <li>{t('Difficulty logging in or staying logged in')}</li>
              <li>{t('Loss of personalized settings and preferences')}</li>
              <li>{t('Reduced website functionality')}</li>
              <li>{t('Less relevant advertisements')}</li>
              <li>{t('Inability to use certain features')}</li>
            </ul>
          </section>

          {/* Updates to Policy */}
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-slate-800 mb-4">{t('Updates to This Policy')}</h2>
            <p className="text-gray-600 leading-relaxed">
              {t('We may update this Cookie Policy from time to time to reflect changes in our practices or for legal reasons. We will post the updated policy on this page and update the "Last updated" date at the top.')}
            </p>
          </section>

          {/* Contact Information */}
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-slate-800 mb-4">{t('Contact Us')}</h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              {t('If you have questions about our use of cookies, please contact us:')}
            </p>
            
            <div className="bg-gray-50 p-6 rounded-lg">
              <div className="space-y-2">
                <p className="text-gray-600"><strong>{t('Email:')}</strong> privacy@flotto.com</p>
                <p className="text-gray-600"><strong>{t('Address:')}</strong> 123 Business Ave, Suite 100, Business City, BC 12345</p>
                <p className="text-gray-600"><strong>{t('Phone:')}</strong> +1 (555) 123-4567</p>
              </div>
            </div>
          </section>

        </div>
      </div>
    </div>
  );
};

export default CookiePolicy;