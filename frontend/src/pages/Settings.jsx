import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Building, 
  User, 
  Palette, 
  Settings as SettingsIcon,
  ChevronRight
} from 'lucide-react';
import { useTranslation } from '../hooks/useTranslation';

const Settings = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const settingsSections = [
    {
      id: 'company',
      name: t('Company Settings'),
      description: t('Manage company information, contact details, and business registration'),
      icon: Building,
      path: '/settings/company'
    },
    {
      id: 'profile',
      name: t('User Profile'),
      description: t('Update personal information, password, and account preferences'),
      icon: User,
      path: '/settings/profile'
    },
    // {
    //   id: 'paint',
    //   name: t('Paint & Materials'),
    //   description: t('Configure paint brands, products, pricing, and material costs'),
    //   icon: Palette,
    //   path: '/settings/paint'
    // }
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center mb-4">
          <button
            onClick={() => navigate('/dashboard')}
            className="text-gray-500 hover:text-gray-700 mr-4"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="text-3xl font-bold text-purple-700 flex items-center">
            <SettingsIcon className="h-8 w-8 mr-3" />
            {t('Settings')}
          </h1>
        </div>
        <p className="text-gray-600">
          {t('Manage your account, company information, and application preferences')}
        </p>
      </div>

      {/* Settings Cards */}
      <div className="space-y-4">
        {settingsSections.map((section) => {
          const Icon = section.icon;
          return (
            <div
              key={section.id}
              onClick={() => navigate(section.path)}
              className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow cursor-pointer group"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <Icon className="h-8 w-8 text-purple-600" />
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-medium text-gray-900 group-hover:text-purple-700 transition-colors">
                      {section.name}
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">
                      {section.description}
                    </p>
                  </div>
                </div>
                <ChevronRight className="h-5 w-5 text-gray-400 group-hover:text-purple-600 transition-colors" />
              </div>
            </div>
          );
        })}
      </div>

      {/* Quick Links */}
      <div className="mt-12 bg-gray-50 rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">{t('Quick Links')}</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button
            onClick={() => navigate('/subscription')}
            className="text-left p-4 bg-white rounded-md border border-gray-200 hover:border-purple-300 transition-colors"
          >
            <h4 className="font-medium text-gray-900">{t('Subscription & Billing')}</h4>
            <p className="text-sm text-gray-500 mt-1">{t('Manage your subscription plan and billing information')}</p>
          </button>
          
          <button
            onClick={() => navigate('/quotes/settings')}
            className="text-left p-4 bg-white rounded-md border border-gray-200 hover:border-purple-300 transition-colors"
          >
            <h4 className="font-medium text-gray-900">{t('Quote Settings')}</h4>
            <p className="text-sm text-gray-500 mt-1">{t('Configure default values for quote generation')}</p>
          </button>
        </div>
      </div>

      {/* Help Section */}
      <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h4 className="text-sm font-medium text-blue-900 mb-3">💡 {t('Settings Help:')}</h4>
        <ul className="text-sm text-blue-800 space-y-2">
          <li>• <strong>{t('Company Settings:')}</strong> {t('Keep your business information up-to-date for professional quotes')}</li>
          <li>• <strong>{t('User Profile:')}</strong> {t('Manage your personal account and notification preferences')}</li>
          {/* <li>• <strong>{t('Paint & Materials:')}</strong> {t('Configure accurate pricing for precise quote generation')}</li> */}
          <li>• {t('Changes are saved automatically and apply to all future quotes and projects')}</li>
        </ul>
      </div>
    </div>
  );
};

export default Settings;