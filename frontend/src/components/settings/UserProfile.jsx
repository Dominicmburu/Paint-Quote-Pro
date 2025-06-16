import React, { useState, useEffect } from 'react';
import { 
  Save, 
  User, 
  Mail, 
  Phone, 
  Lock, 
  Eye, 
  EyeOff, 
  Shield,
  Bell,
  Globe,
  Palette,
  ArrowLeft
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';

const UserProfile = () => {
  const { user, refreshAuth } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('profile');
  
  // Profile form state
  const [profileData, setProfileData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: ''
  });

  // Password form state
  const [passwordData, setPasswordData] = useState({
    current_password: '',
    new_password: '',
    confirm_password: ''
  });

  // Preferences state
  const [preferences, setPreferences] = useState({
    email_notifications: true,
    quote_reminders: true,
    project_updates: true,
    marketing_emails: false,
    language: 'en',
    timezone: 'Europe/London',
    date_format: 'DD/MM/YYYY',
    currency: 'GBP',
    theme: 'light'
  });

  const [loading, setLoading] = useState({
    profile: false,
    password: false,
    preferences: false
  });

  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });

  const [errors, setErrors] = useState({});
  const [successMessages, setSuccessMessages] = useState({});

  useEffect(() => {
    if (user) {
      setProfileData({
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        email: user.email || '',
        phone: user.phone || ''
      });
    }
    loadUserPreferences();
  }, [user]);

  const loadUserPreferences = async () => {
    try {
      const response = await api.get('/user/preferences');
      if (response.data.preferences) {
        setPreferences({ ...preferences, ...response.data.preferences });
      }
    } catch (err) {
      console.log('No saved preferences found, using defaults');
    }
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setLoading(prev => ({ ...prev, profile: true }));
    setErrors(prev => ({ ...prev, profile: '' }));
    setSuccessMessages(prev => ({ ...prev, profile: '' }));

    try {
      await api.put('/auth/update-profile', profileData);
      setSuccessMessages(prev => ({ 
        ...prev, 
        profile: 'Profile updated successfully!' 
      }));
      
      if (refreshAuth) {
        await refreshAuth();
      }
      
      setTimeout(() => {
        setSuccessMessages(prev => ({ ...prev, profile: '' }));
      }, 3000);
    } catch (err) {
      setErrors(prev => ({ 
        ...prev, 
        profile: err.response?.data?.error || 'Failed to update profile' 
      }));
    } finally {
      setLoading(prev => ({ ...prev, profile: false }));
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setLoading(prev => ({ ...prev, password: true }));
    setErrors(prev => ({ ...prev, password: '' }));
    setSuccessMessages(prev => ({ ...prev, password: '' }));

    // Validate passwords match
    if (passwordData.new_password !== passwordData.confirm_password) {
      setErrors(prev => ({ ...prev, password: 'New passwords do not match' }));
      setLoading(prev => ({ ...prev, password: false }));
      return;
    }

    try {
      await api.post('/auth/change-password', {
        current_password: passwordData.current_password,
        new_password: passwordData.new_password
      });
      
      setSuccessMessages(prev => ({ 
        ...prev, 
        password: 'Password changed successfully!' 
      }));
      
      // Clear form
      setPasswordData({
        current_password: '',
        new_password: '',
        confirm_password: ''
      });
      
      setTimeout(() => {
        setSuccessMessages(prev => ({ ...prev, password: '' }));
      }, 3000);
    } catch (err) {
      setErrors(prev => ({ 
        ...prev, 
        password: err.response?.data?.error || 'Failed to change password' 
      }));
    } finally {
      setLoading(prev => ({ ...prev, password: false }));
    }
  };

  const handlePreferencesSubmit = async (e) => {
    e.preventDefault();
    setLoading(prev => ({ ...prev, preferences: true }));
    setErrors(prev => ({ ...prev, preferences: '' }));
    setSuccessMessages(prev => ({ ...prev, preferences: '' }));

    try {
      await api.put('/user/preferences', preferences);
      setSuccessMessages(prev => ({ 
        ...prev, 
        preferences: 'Preferences saved successfully!' 
      }));
      
      setTimeout(() => {
        setSuccessMessages(prev => ({ ...prev, preferences: '' }));
      }, 3000);
    } catch (err) {
      setErrors(prev => ({ 
        ...prev, 
        preferences: err.response?.data?.error || 'Failed to save preferences' 
      }));
    } finally {
      setLoading(prev => ({ ...prev, preferences: false }));
    }
  };

  const togglePasswordVisibility = (field) => {
    setShowPasswords(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  const tabs = [
    { id: 'profile', name: 'Profile', icon: User },
    { id: 'security', name: 'Security', icon: Shield },
    { id: 'preferences', name: 'Preferences', icon: Bell }
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center mb-4">
          <button
            onClick={() => navigate('/settings')}
            className="text-gray-500 hover:text-gray-700 mr-4"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="text-3xl font-bold text-purple-700 flex items-center">
            <User className="h-8 w-8 mr-3" />
            User Profile
          </h1>
        </div>
        <p className="text-gray-600 mt-2">
          Manage your personal information and account preferences
        </p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-8">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap flex items-center space-x-2 ${
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

      {/* Profile Tab */}
      {activeTab === 'profile' && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-medium text-purple-700 mb-6">Personal Information</h3>
          
          {errors.profile && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
              <p className="text-sm text-red-600">{errors.profile}</p>
            </div>
          )}

          {successMessages.profile && (
            <div className="bg-green-50 border border-green-200 rounded-md p-4 mb-6">
              <p className="text-sm text-green-600">{successMessages.profile}</p>
            </div>
          )}

          <form onSubmit={handleProfileSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  First Name *
                </label>
                <input
                  type="text"
                  required
                  value={profileData.first_name}
                  onChange={(e) => setProfileData(prev => ({ 
                    ...prev, 
                    first_name: e.target.value 
                  }))}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="John"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Last Name *
                </label>
                <input
                  type="text"
                  required
                  value={profileData.last_name}
                  onChange={(e) => setProfileData(prev => ({ 
                    ...prev, 
                    last_name: e.target.value 
                  }))}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Smith"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address *
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="email"
                    required
                    value={profileData.email}
                    onChange={(e) => setProfileData(prev => ({ 
                      ...prev, 
                      email: e.target.value 
                    }))}
                    className="w-full border border-gray-300 rounded-md pl-10 pr-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="john@example.com"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="tel"
                    value={profileData.phone}
                    onChange={(e) => setProfileData(prev => ({ 
                      ...prev, 
                      phone: e.target.value 
                    }))}
                    className="w-full border border-gray-300 rounded-md pl-10 pr-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="+44 7700 900123"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={loading.profile}
                className="inline-flex items-center px-6 py-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white rounded-md font-medium transition-colors"
              >
                {loading.profile ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save Changes
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Security Tab */}
      {activeTab === 'security' && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-medium text-purple-700 mb-6">Change Password</h3>
          
          {errors.password && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
              <p className="text-sm text-red-600">{errors.password}</p>
            </div>
          )}

          {successMessages.password && (
            <div className="bg-green-50 border border-green-200 rounded-md p-4 mb-6">
              <p className="text-sm text-green-600">{successMessages.password}</p>
            </div>
          )}

          <form onSubmit={handlePasswordSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Current Password *
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type={showPasswords.current ? 'text' : 'password'}
                  required
                  value={passwordData.current_password}
                  onChange={(e) => setPasswordData(prev => ({ 
                    ...prev, 
                    current_password: e.target.value 
                  }))}
                  className="w-full border border-gray-300 rounded-md pl-10 pr-10 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Enter current password"
                />
                <button
                  type="button"
                  onClick={() => togglePasswordVisibility('current')}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPasswords.current ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                New Password *
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type={showPasswords.new ? 'text' : 'password'}
                  required
                  value={passwordData.new_password}
                  onChange={(e) => setPasswordData(prev => ({ 
                    ...prev, 
                    new_password: e.target.value 
                  }))}
                  className="w-full border border-gray-300 rounded-md pl-10 pr-10 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Enter new password"
                />
                <button
                  type="button"
                  onClick={() => togglePasswordVisibility('new')}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPasswords.new ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Confirm New Password *
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type={showPasswords.confirm ? 'text' : 'password'}
                  required
                  value={passwordData.confirm_password}
                  onChange={(e) => setPasswordData(prev => ({ 
                    ...prev, 
                    confirm_password: e.target.value 
                  }))}
                  className="w-full border border-gray-300 rounded-md pl-10 pr-10 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Confirm new password"
                />
                <button
                  type="button"
                  onClick={() => togglePasswordVisibility('confirm')}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPasswords.confirm ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={loading.password}
                className="inline-flex items-center px-6 py-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white rounded-md font-medium transition-colors"
              >
                {loading.password ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Updating...
                  </>
                ) : (
                  <>
                    <Lock className="h-4 w-4 mr-2" />
                    Change Password
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Password Requirements */}
          <div className="mt-6 bg-gray-50 border border-gray-200 rounded-md p-4">
            <h4 className="text-sm font-medium text-gray-900 mb-2">Password Requirements:</h4>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• At least 8 characters long</li>
              <li>• Contains uppercase and lowercase letters</li>
              <li>• Contains at least one number</li>
              <li>• Contains at least one special character</li>
            </ul>
          </div>
        </div>
      )}

      {/* Preferences Tab */}
      {activeTab === 'preferences' && (
        <div className="space-y-6">
          {errors.preferences && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4">
              <p className="text-sm text-red-600">{errors.preferences}</p>
            </div>
          )}

          {successMessages.preferences && (
            <div className="bg-green-50 border border-green-200 rounded-md p-4">
              <p className="text-sm text-green-600">{successMessages.preferences}</p>
            </div>
          )}

          <form onSubmit={handlePreferencesSubmit} className="space-y-6">
            {/* Notification Preferences */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-medium text-purple-700 mb-6 flex items-center">
                <Bell className="h-5 w-5 mr-2" />
                Notifications
              </h3>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-medium text-gray-900">Email Notifications</h4>
                    <p className="text-sm text-gray-500">Receive email updates about your account</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={preferences.email_notifications}
                    onChange={(e) => setPreferences(prev => ({
                      ...prev,
                      email_notifications: e.target.checked
                    }))}
                    className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-medium text-gray-900">Quote Reminders</h4>
                    <p className="text-sm text-gray-500">Get reminded about pending quotes and follow-ups</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={preferences.quote_reminders}
                    onChange={(e) => setPreferences(prev => ({
                      ...prev,
                      quote_reminders: e.target.checked
                    }))}
                    className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-medium text-gray-900">Project Updates</h4>
                    <p className="text-sm text-gray-500">Notifications when projects are analyzed or completed</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={preferences.project_updates}
                    onChange={(e) => setPreferences(prev => ({
                      ...prev,
                      project_updates: e.target.checked
                    }))}
                    className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-medium text-gray-900">Marketing Emails</h4>
                    <p className="text-sm text-gray-500">Receive tips, updates, and promotional content</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={preferences.marketing_emails}
                    onChange={(e) => setPreferences(prev => ({
                      ...prev,
                      marketing_emails: e.target.checked
                    }))}
                    className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                  />
                </div>
              </div>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default UserProfile;