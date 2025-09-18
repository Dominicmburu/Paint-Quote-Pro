import React from 'react';
import { Shield, Lock, Eye, Database, UserCheck, Globe } from 'lucide-react';
import { useTranslation } from '../hooks/useTranslation';

const PrivacyPolicy = () => {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-br from-[#4bb4f5] via-[#4bb4f5] to-[#4bb4f5] py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="flex justify-center mb-6">
              <Shield className="h-16 w-16 text-slate-800" />
            </div>
            <h1 className="text-4xl font-bold text-slate-800 mb-4">{t('Privacy Policy')}</h1>
            <p className="text-lg text-slate-700">
              {t('Your privacy matters to us. Learn how we collect, use, and protect your data.')}
            </p>
            <p className="text-sm text-slate-600 mt-2">{t('Last updated: January 1, 2025')}</p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          
          {/* Introduction */}
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-slate-800 mb-4">{t('Introduction')}</h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              {t('At Flotto, we are committed to protecting your privacy and ensuring the security of your personal information. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our quoting software and related services.')}
            </p>
            <p className="text-gray-600 leading-relaxed">
              {t('By using Flotto, you consent to the data practices described in this policy.')}
            </p>
          </section>

          {/* Information We Collect */}
          <section className="mb-8">
            <div className="flex items-center mb-4">
              <Database className="h-6 w-6 text-[#4bb4f5] mr-3" />
              <h2 className="text-2xl font-bold text-slate-800">{t('Information We Collect')}</h2>
            </div>
            
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-slate-800 mb-2">{t('Personal Information')}</h3>
                <p className="text-gray-600 leading-relaxed mb-2">{t('We may collect the following personal information:')}</p>
                <ul className="list-disc list-inside text-gray-600 space-y-1 ml-4">
                  <li>{t('Name and contact information (email address, phone number)')}</li>
                  <li>{t('Business information (company name, address)')}</li>
                  <li>{t('Payment and billing information')}</li>
                  <li>{t('Account credentials and preferences')}</li>
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-slate-800 mb-2">{t('Usage Information')}</h3>
                <p className="text-gray-600 leading-relaxed mb-2">{t('We automatically collect information about how you use Flotto:')}</p>
                <ul className="list-disc list-inside text-gray-600 space-y-1 ml-4">
                  <li>{t('Log data (IP address, browser type, pages visited)')}</li>
                  <li>{t('Device information (operating system, device type)')}</li>
                  <li>{t('Feature usage and interaction data')}</li>
                  <li>{t('Performance and error information')}</li>
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-slate-800 mb-2">{t('Project Data')}</h3>
                <p className="text-gray-600 leading-relaxed">
                  {t('We store the quotes, invoices, floor plans, and other project-related content you create using our platform to provide and improve our services.')}
                </p>
              </div>
            </div>
          </section>

          {/* How We Use Information */}
          <section className="mb-8">
            <div className="flex items-center mb-4">
              <UserCheck className="h-6 w-6 text-[#4bb4f5] mr-3" />
              <h2 className="text-2xl font-bold text-slate-800">{t('How We Use Your Information')}</h2>
            </div>
            
            <p className="text-gray-600 leading-relaxed mb-4">{t('We use the information we collect to:')}</p>
            <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4">
              <li>{t('Provide, maintain, and improve our quoting software and services')}</li>
              <li>{t('Process transactions and send related information')}</li>
              <li>{t('Send administrative information and updates about our services')}</li>
              <li>{t('Provide customer support and respond to inquiries')}</li>
              <li>{t('Analyze usage patterns to enhance user experience')}</li>
              <li>{t('Detect and prevent fraud and security threats')}</li>
              <li>{t('Comply with legal obligations')}</li>
            </ul>
          </section>

          {/* Information Sharing */}
          <section className="mb-8">
            <div className="flex items-center mb-4">
              <Globe className="h-6 w-6 text-[#4bb4f5] mr-3" />
              <h2 className="text-2xl font-bold text-slate-800">{t('Information Sharing and Disclosure')}</h2>
            </div>
            
            <p className="text-gray-600 leading-relaxed mb-4">
              {t('We do not sell, trade, or otherwise transfer your personal information to third parties except in the following circumstances:')}
            </p>
            
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-slate-800 mb-2">{t('Service Providers')}</h3>
                <p className="text-gray-600 leading-relaxed">
                  {t('We may share information with trusted third-party service providers who help us operate our business, such as payment processors, hosting services, and analytics providers.')}
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-slate-800 mb-2">{t('Legal Requirements')}</h3>
                <p className="text-gray-600 leading-relaxed">
                  {t('We may disclose information if required by law, court order, or government regulation, or to protect our rights, property, or safety.')}
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-slate-800 mb-2">{t('Business Transfers')}</h3>
                <p className="text-gray-600 leading-relaxed">
                  {t('In the event of a merger, acquisition, or sale of assets, user information may be transferred as part of the business transaction.')}
                </p>
              </div>
            </div>
          </section>

          {/* Data Security */}
          <section className="mb-8">
            <div className="flex items-center mb-4">
              <Lock className="h-6 w-6 text-[#4bb4f5] mr-3" />
              <h2 className="text-2xl font-bold text-slate-800">{t('Data Security')}</h2>
            </div>
            
            <p className="text-gray-600 leading-relaxed mb-4">
              {t('We implement appropriate technical and organizational security measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction. These measures include:')}
            </p>
            
            <ul className="list-disc list-inside text-gray-600 space-y-1 ml-4">
              <li>{t('Encryption of data in transit and at rest')}</li>
              <li>{t('Regular security assessments and updates')}</li>
              <li>{t('Access controls and authentication mechanisms')}</li>
              <li>{t('Employee training on data protection practices')}</li>
              <li>{t('Incident response procedures')}</li>
            </ul>
          </section>

          {/* Your Rights */}
          <section className="mb-8">
            <div className="flex items-center mb-4">
              <Eye className="h-6 w-6 text-[#4bb4f5] mr-3" />
              <h2 className="text-2xl font-bold text-slate-800">{t('Your Rights and Choices')}</h2>
            </div>
            
            <p className="text-gray-600 leading-relaxed mb-4">{t('You have the following rights regarding your personal information:')}</p>
            
            <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4">
              <li><strong>{t('Access:')}</strong> {t('Request access to your personal information')}</li>
              <li><strong>{t('Correction:')}</strong> {t('Request correction of inaccurate or incomplete information')}</li>
              <li><strong>{t('Deletion:')}</strong> {t('Request deletion of your personal information')}</li>
              <li><strong>{t('Portability:')}</strong> {t('Request a copy of your data in a machine-readable format')}</li>
              <li><strong>{t('Objection:')}</strong> {t('Object to certain processing of your information')}</li>
              <li><strong>{t('Withdrawal:')}</strong> {t('Withdraw consent where processing is based on consent')}</li>
            </ul>
            
            <p className="text-gray-600 leading-relaxed mt-4">
              {t('To exercise these rights, please contact us at privacy@flotto.com.')}
            </p>
          </section>

          {/* Data Retention */}
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-slate-800 mb-4">{t('Data Retention')}</h2>
            <p className="text-gray-600 leading-relaxed">
              {t('We retain your personal information for as long as necessary to provide our services, comply with legal obligations, resolve disputes, and enforce our agreements. When we no longer need your information, we will securely delete or anonymize it.')}
            </p>
          </section>

          {/* Updates */}
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-slate-800 mb-4">{t('Updates to This Policy')}</h2>
            <p className="text-gray-600 leading-relaxed">
              {t('We may update this Privacy Policy from time to time to reflect changes in our practices or legal requirements. We will notify you of material changes by posting the updated policy on our website and updating the "Last updated" date.')}
            </p>
          </section>

          {/* Contact */}
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-slate-800 mb-4">{t('Contact Us')}</h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              {t('If you have questions about this Privacy Policy or our data practices, please contact us:')}
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

export default PrivacyPolicy;