import React, { useState, useEffect } from 'react';
import { 
  Settings, 
  Save, 
  RefreshCw,
  Database,
  Mail,
  Shield,
  Server,
  Globe,
  Zap,
  AlertTriangle,
  CheckCircle,
  Eye,
  EyeOff,
  Key,
  Bell,
  Palette
} from 'lucide-react';
import api from '../../services/api';
import Loading from '../common/Loading';

const SystemSettings = () => {
  const [settings, setSettings] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('general');
  const [showApiKey, setShowApiKey] = useState(false);
  const [testingEmail, setTestingEmail] = useState(false);
  const [emailTestResult, setEmailTestResult] = useState(null);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const response = await api.get('/admin/settings');
      setSettings(response.data);
    } catch (error) {
      console.error('Failed to load settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    try {
      setSaving(true);
      await api.put('/admin/settings', settings);
      // Show success message
    } catch (error) {
      console.error('Failed to save settings:', error);
    } finally {
      setSaving(false);
    }
  };

  const testEmailSettings = async () => {
    try {
      setTestingEmail(true);
      setEmailTestResult(null);
      const response = await api.post('/admin/settings/test-email');
      setEmailTestResult({ success: true, message: response.data.message });
    } catch (error) {
      setEmailTestResult({ success: false, message: error.response?.data?.message || 'Email test failed' });
    } finally {
      setTestingEmail(false);
    }
  };

  const updateSetting = (category, key, value) => {
    setSettings(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [key]: value
      }
    }));
  };

  const tabs = [
    { id: 'general', name: 'General', icon: Settings },
    { id: 'email', name: 'Email', icon: Mail },
    { id: 'security', name: 'Security', icon: Shield },
    { id: 'api', name: 'API', icon: Key },
    { id: 'notifications', name: 'Notifications', icon: Bell },
    { id: 'appearance', name: 'Appearance', icon: Palette },
    { id: 'performance', name: 'Performance', icon: Zap },
    { id: 'database', name: 'Database', icon: Database }
  ];

  if (loading) {
    return <Loading message="Loading system settings..." />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-purple-700">System Settings</h1>
          <p className="text-gray-600">Configure system-wide settings and preferences</p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={loadSettings}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Reload
          </button>
          <button
            onClick={saveSettings}
            disabled={saving}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 disabled:opacity-50"
          >
            {saving ? (
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6" aria-label="Tabs">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                    activeTab === tab.id
                      ? 'border-purple-500 text-purple-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{tab.name}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {/* General Settings */}
          {activeTab === 'general' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">General Settings</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Site Name</label>
                    <input
                      type="text"
                      value={settings.general?.site_name || ''}
                      onChange={(e) => updateSetting('general', 'site_name', e.target.value)}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Site URL</label>
                    <input
                      type="url"
                      value={settings.general?.site_url || ''}
                      onChange={(e) => updateSetting('general', 'site_url', e.target.value)}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Admin Email</label>
                    <input
                      type="email"
                      value={settings.general?.admin_email || ''}
                      onChange={(e) => updateSetting('general', 'admin_email', e.target.value)}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Timezone</label>
                    <select
                      value={settings.general?.timezone || ''}
                      onChange={(e) => updateSetting('general', 'timezone', e.target.value)}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    >
                      <option value="UTC">UTC</option>
                      <option value="America/New_York">Eastern Time</option>
                      <option value="America/Chicago">Central Time</option>
                      <option value="America/Denver">Mountain Time</option>
                      <option value="America/Los_Angeles">Pacific Time</option>
                      <option value="Europe/London">London</option>
                      <option value="Europe/Paris">Paris</option>
                      <option value="Asia/Tokyo">Tokyo</option>
                    </select>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-md font-medium text-gray-900 mb-4">Registration Settings</h4>
                <div className="space-y-4">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      checked={settings.general?.allow_registration || false}
                      onChange={(e) => updateSetting('general', 'allow_registration', e.target.checked)}
                      className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                    />
                    <label className="ml-2 block text-sm text-gray-900">Allow new user registration</label>
                  </div>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      checked={settings.general?.require_email_verification || false}
                      onChange={(e) => updateSetting('general', 'require_email_verification', e.target.checked)}
                      className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                    />
                    <label className="ml-2 block text-sm text-gray-900">Require email verification</label>
                  </div>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      checked={settings.general?.auto_approve_users || false}
                      onChange={(e) => updateSetting('general', 'auto_approve_users', e.target.checked)}
                      className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                    />
                    <label className="ml-2 block text-sm text-gray-900">Auto-approve new users</label>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Email Settings */}
          {activeTab === 'email' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Email Configuration</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">SMTP Host</label>
                    <input
                      type="text"
                      value={settings.email?.smtp_host || ''}
                      onChange={(e) => updateSetting('email', 'smtp_host', e.target.value)}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">SMTP Port</label>
                    <input
                      type="number"
                      value={settings.email?.smtp_port || ''}
                      onChange={(e) => updateSetting('email', 'smtp_port', e.target.value)}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">SMTP Username</label>
                    <input
                      type="text"
                      value={settings.email?.smtp_username || ''}
                      onChange={(e) => updateSetting('email', 'smtp_username', e.target.value)}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">SMTP Password</label>
                    <input
                      type="password"
                      value={settings.email?.smtp_password || ''}
                      onChange={(e) => updateSetting('email', 'smtp_password', e.target.value)}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">From Email</label>
                    <input
                      type="email"
                      value={settings.email?.from_email || ''}
                      onChange={(e) => updateSetting('email', 'from_email', e.target.value)}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">From Name</label>
                    <input
                      type="text"
                      value={settings.email?.from_name || ''}
                      onChange={(e) => updateSetting('email', 'from_name', e.target.value)}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-md font-medium text-gray-900 mb-4">Email Options</h4>
                <div className="space-y-4">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      checked={settings.email?.use_tls || false}
                      onChange={(e) => updateSetting('email', 'use_tls', e.target.checked)}
                      className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                    />
                    <label className="ml-2 block text-sm text-gray-900">Use TLS</label>
                  </div>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      checked={settings.email?.send_notifications || false}
                      onChange={(e) => updateSetting('email', 'send_notifications', e.target.checked)}
                      className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                    />
                    <label className="ml-2 block text-sm text-gray-900">Send email notifications</label>
                  </div>
                </div>
              </div>

              <div>
                <button
                  onClick={testEmailSettings}
                  disabled={testingEmail}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                >
                  {testingEmail ? (
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Mail className="h-4 w-4 mr-2" />
                  )}
                  {testingEmail ? 'Testing...' : 'Test Email Settings'}
                </button>
                
                {emailTestResult && (
                  <div className={`mt-4 p-4 rounded-md ${
                    emailTestResult.success ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                  }`}>
                    <div className="flex">
                      {emailTestResult.success ? (
                        <CheckCircle className="h-5 w-5 mr-2" />
                      ) : (
                        <AlertTriangle className="h-5 w-5 mr-2" />
                      )}
                      <span className="text-sm">{emailTestResult.message}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Security Settings */}
          {activeTab === 'security' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Security Configuration</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Session Timeout (minutes)</label>
                    <input
                      type="number"
                      value={settings.security?.session_timeout || ''}
                      onChange={(e) => updateSetting('security', 'session_timeout', e.target.value)}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Max Login Attempts</label>
                    <input
                      type="number"
                      value={settings.security?.max_login_attempts || ''}
                      onChange={(e) => updateSetting('security', 'max_login_attempts', e.target.value)}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Lockout Duration (minutes)</label>
                    <input
                      type="number"
                      value={settings.security?.lockout_duration || ''}
                      onChange={(e) => updateSetting('security', 'lockout_duration', e.target.value)}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Password Min Length</label>
                    <input
                      type="number"
                      value={settings.security?.password_min_length || ''}
                      onChange={(e) => updateSetting('security', 'password_min_length', e.target.value)}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-md font-medium text-gray-900 mb-4">Password Requirements</h4>
                <div className="space-y-4">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      checked={settings.security?.require_uppercase || false}
                      onChange={(e) => updateSetting('security', 'require_uppercase', e.target.checked)}
                      className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                    />
                    <label className="ml-2 block text-sm text-gray-900">Require uppercase letters</label>
                  </div>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      checked={settings.security?.require_numbers || false}
                      onChange={(e) => updateSetting('security', 'require_numbers', e.target.checked)}
                      className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                    />
                    <label className="ml-2 block text-sm text-gray-900">Require numbers</label>
                  </div>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      checked={settings.security?.require_special_chars || false}
                      onChange={(e) => updateSetting('security', 'require_special_chars', e.target.checked)}
                      className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                    />
                    <label className="ml-2 block text-sm text-gray-900">Require special characters</label>
                  </div>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      checked={settings.security?.enable_2fa || false}
                      onChange={(e) => updateSetting('security', 'enable_2fa', e.target.checked)}
                      className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                    />
                    <label className="ml-2 block text-sm text-gray-900">Enable two-factor authentication</label>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* API Settings */}
          {activeTab === 'api' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">API Configuration</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">API Key</label>
                    <div className="flex space-x-2">
                      <input
                        type={showApiKey ? 'text' : 'password'}
                        value={settings.api?.api_key || ''}
                        onChange={(e) => updateSetting('api', 'api_key', e.target.value)}
                        className="flex-1 border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                      <button
                        onClick={() => setShowApiKey(!showApiKey)}
                        className="px-3 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
                      >
                        {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Rate Limit (requests/minute)</label>
                    <input
                      type="number"
                      value={settings.api?.rate_limit || ''}
                      onChange={(e) => updateSetting('api', 'rate_limit', e.target.value)}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-md font-medium text-gray-900 mb-4">API Options</h4>
                <div className="space-y-4">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      checked={settings.api?.enable_cors || false}
                      onChange={(e) => updateSetting('api', 'enable_cors', e.target.checked)}
                      className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                    />
                    <label className="ml-2 block text-sm text-gray-900">Enable CORS</label>
                  </div>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      checked={settings.api?.require_https || false}
                      onChange={(e) => updateSetting('api', 'require_https', e.target.checked)}
                      className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                    />
                    <label className="ml-2 block text-sm text-gray-900">Require HTTPS</label>
                  </div>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      checked={settings.api?.log_requests || false}
                      onChange={(e) => updateSetting('api', 'log_requests', e.target.checked)}
                      className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                    />
                    <label className="ml-2 block text-sm text-gray-900">Log API requests</label>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Notifications Settings */}
          {activeTab === 'notifications' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Notification Settings</h3>
                <div className="space-y-4">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      checked={settings.notifications?.user_registration || false}
                      onChange={(e) => updateSetting('notifications', 'user_registration', e.target.checked)}
                      className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                    />
                    <label className="ml-2 block text-sm text-gray-900">New user registrations</label>
                  </div>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      checked={settings.notifications?.project_created || false}
                      onChange={(e) => updateSetting('notifications', 'project_created', e.target.checked)}
                      className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                    />
                    <label className="ml-2 block text-sm text-gray-900">New projects created</label>
                  </div>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      checked={settings.notifications?.subscription_changes || false}
                      onChange={(e) => updateSetting('notifications', 'subscription_changes', e.target.checked)}
                      className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                    />
                    <label className="ml-2 block text-sm text-gray-900">Subscription changes</label>
                  </div>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      checked={settings.notifications?.payment_failures || false}
                      onChange={(e) => updateSetting('notifications', 'payment_failures', e.target.checked)}
                      className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                    />
                    <label className="ml-2 block text-sm text-gray-900">Payment failures</label>
                  </div>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      checked={settings.notifications?.system_errors || false}
                      onChange={(e) => updateSetting('notifications', 'system_errors', e.target.checked)}
                      className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                    />
                    <label className="ml-2 block text-sm text-gray-900">System errors</label>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Appearance Settings */}
          {activeTab === 'appearance' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Appearance Settings</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Brand Name</label>
                    <input
                      type="text"
                      value={settings.appearance?.brand_name || ''}
                      onChange={(e) => updateSetting('appearance', 'brand_name', e.target.value)}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Primary Color</label>
                    <input
                      type="color"
                      value={settings.appearance?.primary_color || '#7C3AED'}
                      onChange={(e) => updateSetting('appearance', 'primary_color', e.target.value)}
                      className="w-full h-10 border border-gray-300 rounded-md px-1 py-1 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Logo URL</label>
                    <input
                      type="url"
                      value={settings.appearance?.logo_url || ''}
                      onChange={(e) => updateSetting('appearance', 'logo_url', e.target.value)}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Favicon URL</label>
                    <input
                      type="url"
                      value={settings.appearance?.favicon_url || ''}
                      onChange={(e) => updateSetting('appearance', 'favicon_url', e.target.value)}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-md font-medium text-gray-900 mb-4">Theme Options</h4>
                <div className="space-y-4">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      checked={settings.appearance?.dark_mode || false}
                      onChange={(e) => updateSetting('appearance', 'dark_mode', e.target.checked)}
                      className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                    />
                    <label className="ml-2 block text-sm text-gray-900">Enable dark mode</label>
                  </div>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      checked={settings.appearance?.custom_css || false}
                      onChange={(e) => updateSetting('appearance', 'custom_css', e.target.checked)}
                      className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                    />
                    <label className="ml-2 block text-sm text-gray-900">Allow custom CSS</label>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Performance Settings */}
          {activeTab === 'performance' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Performance Settings</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Cache Duration (minutes)</label>
                    <input
                      type="number"
                      value={settings.performance?.cache_duration || ''}
                      onChange={(e) => updateSetting('performance', 'cache_duration', e.target.value)}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Max File Size (MB)</label>
                    <input
                      type="number"
                      value={settings.performance?.max_file_size || ''}
                      onChange={(e) => updateSetting('performance', 'max_file_size', e.target.value)}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Request Timeout (seconds)</label>
                    <input
                      type="number"
                      value={settings.performance?.request_timeout || ''}
                      onChange={(e) => updateSetting('performance', 'request_timeout', e.target.value)}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Max Concurrent Users</label>
                    <input
                      type="number"
                      value={settings.performance?.max_concurrent_users || ''}
                      onChange={(e) => updateSetting('performance', 'max_concurrent_users', e.target.value)}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-md font-medium text-gray-900 mb-4">Optimization Options</h4>
                <div className="space-y-4">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      checked={settings.performance?.enable_compression || false}
                      onChange={(e) => updateSetting('performance', 'enable_compression', e.target.checked)}
                      className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                    />
                    <label className="ml-2 block text-sm text-gray-900">Enable compression</label>
                  </div>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      checked={settings.performance?.enable_cdn || false}
                      onChange={(e) => updateSetting('performance', 'enable_cdn', e.target.checked)}
                      className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                    />
                    <label className="ml-2 block text-sm text-gray-900">Enable CDN</label>
                  </div>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      checked={settings.performance?.lazy_loading || false}
                      onChange={(e) => updateSetting('performance', 'lazy_loading', e.target.checked)}
                      className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                    />
                    <label className="ml-2 block text-sm text-gray-900">Enable lazy loading</label>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Database Settings */}
          {activeTab === 'database' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Database Configuration</h3>
                <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 mb-6">
                  <div className="flex">
                    <AlertTriangle className="h-5 w-5 text-yellow-400 mr-2" />
                    <div className="text-sm text-yellow-700">
                      <p className="font-medium">Warning</p>
                      <p>Changing database settings may require system restart and could affect system stability.</p>
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Backup Frequency</label>
                    <select
                      value={settings.database?.backup_frequency || ''}
                      onChange={(e) => updateSetting('database', 'backup_frequency', e.target.value)}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    >
                      <option value="daily">Daily</option>
                      <option value="weekly">Weekly</option>
                      <option value="monthly">Monthly</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Backup Retention (days)</label>
                    <input
                      type="number"
                      value={settings.database?.backup_retention || ''}
                      onChange={(e) => updateSetting('database', 'backup_retention', e.target.value)}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Connection Pool Size</label>
                    <input
                      type="number"
                      value={settings.database?.connection_pool_size || ''}
                      onChange={(e) => updateSetting('database', 'connection_pool_size', e.target.value)}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Query Timeout (seconds)</label>
                    <input
                      type="number"
                      value={settings.database?.query_timeout || ''}
                      onChange={(e) => updateSetting('database', 'query_timeout', e.target.value)}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-md font-medium text-gray-900 mb-4">Database Options</h4>
                <div className="space-y-4">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      checked={settings.database?.auto_backup || false}
                      onChange={(e) => updateSetting('database', 'auto_backup', e.target.checked)}
                      className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                    />
                    <label className="ml-2 block text-sm text-gray-900">Enable automatic backups</label>
                  </div>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      checked={settings.database?.enable_logging || false}
                      onChange={(e) => updateSetting('database', 'enable_logging', e.target.checked)}
                      className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                    />
                    <label className="ml-2 block text-sm text-gray-900">Enable query logging</label>
                  </div>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      checked={settings.database?.optimize_tables || false}
                      onChange={(e) => updateSetting('database', 'optimize_tables', e.target.checked)}
                      className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                    />
                    <label className="ml-2 block text-sm text-gray-900">Auto-optimize tables</label>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SystemSettings;