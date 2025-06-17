import React, { useState, useEffect } from 'react';
import {
    User,
    Mail,
    Phone,
    Building,
    Lock,
    Shield,
    Key,
    Save,
    Edit,
    CheckCircle,
    AlertTriangle,
    Eye,
    EyeOff,
    Activity,
    Calendar,
    Globe,
    Settings,
    Bell,
    Smartphone,
    Clock,
    RefreshCw
} from 'lucide-react';
import api from '../../services/api';
import Loading from '../common/Loading';

const AdminProfile = () => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('profile');
    const [isEditing, setIsEditing] = useState(false);
    const [saving, setSaving] = useState(false);

    // Form states
    const [profileForm, setProfileForm] = useState({
        first_name: '',
        last_name: '',
        email: '',
        phone: ''
    });

    const [passwordForm, setPasswordForm] = useState({
        current_password: '',
        new_password: '',
        confirm_password: ''
    });

    const [securitySettings, setSecuritySettings] = useState({
        two_factor_enabled: false,
        email_notifications: true,
        login_alerts: true,
        session_timeout: 30
    });

    const [showPasswords, setShowPasswords] = useState({
        current: false,
        new: false,
        confirm: false
    });

    const [passwordStrength, setPasswordStrength] = useState(0);

    useEffect(() => {
        loadUserProfile();
    }, []);

    const loadUserProfile = async () => {
        try {
            setLoading(true);
            const response = await api.get('/auth/me');
            const userData = response.data.user;

            setUser(userData);
            setProfileForm({
                first_name: userData.first_name || '',
                last_name: userData.last_name || '',
                email: userData.email || '',
                phone: userData.phone || ''
            });

            // Load security settings (these would come from the API in a real app)
            setSecuritySettings({
                two_factor_enabled: userData.two_factor_enabled || false,
                email_notifications: userData.email_notifications !== false,
                login_alerts: userData.login_alerts !== false,
                session_timeout: userData.session_timeout || 30
            });

        } catch (error) {
            console.error('Failed to load user profile:', error);
        } finally {
            setLoading(false);
        }
    };

    const updateProfile = async () => {
        try {
            setSaving(true);
            await api.put('/auth/update-profile', profileForm);

            setUser(prev => ({ ...prev, ...profileForm }));
            setIsEditing(false);

            alert('Profile updated successfully!');
        } catch (error) {
            console.error('Failed to update profile:', error);
            alert('Failed to update profile. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    const changePassword = async () => {
        try {
            if (passwordForm.new_password !== passwordForm.confirm_password) {
                alert('New passwords do not match');
                return;
            }

            if (passwordStrength < 3) {
                alert('Password is too weak. Please choose a stronger password.');
                return;
            }

            setSaving(true);
            await api.post('/auth/change-password', {
                current_password: passwordForm.current_password,
                new_password: passwordForm.new_password
            });

            setPasswordForm({
                current_password: '',
                new_password: '',
                confirm_password: ''
            });

            alert('Password changed successfully!');
        } catch (error) {
            console.error('Failed to change password:', error);
            alert(error.response?.data?.error || 'Failed to change password. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    const calculatePasswordStrength = (password) => {
        let strength = 0;
        if (password.length >= 8) strength++;
        if (/[a-z]/.test(password)) strength++;
        if (/[A-Z]/.test(password)) strength++;
        if (/[0-9]/.test(password)) strength++;
        if (/[^A-Za-z0-9]/.test(password)) strength++;
        return strength;
    };

    const getPasswordStrengthColor = (strength) => {
        switch (strength) {
            case 0:
            case 1:
                return 'bg-red-500';
            case 2:
                return 'bg-yellow-500';
            case 3:
                return 'bg-blue-500';
            case 4:
            case 5:
                return 'bg-green-500';
            default:
                return 'bg-gray-300';
        }
    };

    const getPasswordStrengthText = (strength) => {
        switch (strength) {
            case 0:
            case 1:
                return 'Very Weak';
            case 2:
                return 'Weak';
            case 3:
                return 'Medium';
            case 4:
                return 'Strong';
            case 5:
                return 'Very Strong';
            default:
                return '';
        }
    };

    useEffect(() => {
        setPasswordStrength(calculatePasswordStrength(passwordForm.new_password));
    }, [passwordForm.new_password]);

    if (loading) {
        return <Loading message="Loading profile..." />;
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-purple-700">Admin Profile</h1>
                    <p className="text-gray-600">Manage your account settings and security preferences</p>
                </div>
                <div className="flex items-center space-x-2">
                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                        <Activity className="h-4 w-4" />
                        <span>Last login: {user?.last_login ? new Date(user.last_login).toLocaleString() : 'Never'}</span>
                    </div>
                </div>
            </div>

            {/* Profile Overview Card */}
            <div className="bg-white rounded-lg border p-6">
                <div className="flex items-center space-x-4">
                    <div className="h-16 w-16 bg-purple-600 rounded-full flex items-center justify-center">
                        <User className="h-8 w-8 text-white" />
                    </div>
                    <div className="flex-1">
                        <h2 className="text-xl font-semibold text-gray-900">
                            {user?.first_name} {user?.last_name}
                        </h2>
                        <p className="text-gray-600">{user?.email}</p>
                        <div className="flex items-center space-x-4 mt-2">
                            <span className="inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Admin
                            </span>
                            <span className="text-sm text-gray-500">
                                Member since {user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'Unknown'}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="border-b border-gray-200">
                <nav className="-mb-px flex space-x-8">
                    {[
                        { id: 'profile', name: 'Profile', icon: User },
                        { id: 'security', name: 'Security', icon: Shield }
                    ].map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`${activeTab === tab.id
                                ? 'border-purple-500 text-purple-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2`}
                        >
                            <tab.icon className="h-4 w-4" />
                            <span>{tab.name}</span>
                        </button>
                    ))}
                </nav>
            </div>

            {/* Tab Content */}
            <div className="bg-white rounded-lg border">
                {/* Profile Tab */}
                {activeTab === 'profile' && (
                    <div className="p-6">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-lg font-medium text-gray-900">Personal Information</h3>
                            <button
                                onClick={() => setIsEditing(!isEditing)}
                                className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                            >
                                <Edit className="h-4 w-4 mr-2" />
                                {isEditing ? 'Cancel' : 'Edit'}
                            </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">First Name</label>
                                <div className="relative">
                                    <User className="h-4 w-4 absolute left-3 top-3 text-gray-400" />
                                    <input
                                        type="text"
                                        value={profileForm.first_name}
                                        onChange={(e) => setProfileForm(prev => ({ ...prev, first_name: e.target.value }))}
                                        disabled={!isEditing}
                                        className={`pl-10 w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 ${!isEditing ? 'bg-gray-50' : ''
                                            }`}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Last Name</label>
                                <div className="relative">
                                    <User className="h-4 w-4 absolute left-3 top-3 text-gray-400" />
                                    <input
                                        type="text"
                                        value={profileForm.last_name}
                                        onChange={(e) => setProfileForm(prev => ({ ...prev, last_name: e.target.value }))}
                                        disabled={!isEditing}
                                        className={`pl-10 w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 ${!isEditing ? 'bg-gray-50' : ''
                                            }`}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
                                <div className="relative">
                                    <Mail className="h-4 w-4 absolute left-3 top-3 text-gray-400" />
                                    <input
                                        type="email"
                                        value={profileForm.email}
                                        onChange={(e) => setProfileForm(prev => ({ ...prev, email: e.target.value }))}
                                        disabled={!isEditing}
                                        className={`pl-10 w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 ${!isEditing ? 'bg-gray-50' : ''
                                            }`}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
                                <div className="relative">
                                    <Phone className="h-4 w-4 absolute left-3 top-3 text-gray-400" />
                                    <input
                                        type="tel"
                                        value={profileForm.phone}
                                        onChange={(e) => setProfileForm(prev => ({ ...prev, phone: e.target.value }))}
                                        disabled={!isEditing}
                                        className={`pl-10 w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 ${!isEditing ? 'bg-gray-50' : ''
                                            }`}
                                    />
                                </div>
                            </div>
                        </div>

                        {isEditing && (
                            <div className="mt-6 flex justify-end space-x-3">
                                <button
                                    onClick={() => setIsEditing(false)}
                                    className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={updateProfile}
                                    disabled={saving}
                                    className="inline-flex items-center px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 disabled:opacity-50"
                                >
                                    {saving ? (
                                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                                    ) : (
                                        <Save className="h-4 w-4 mr-2" />
                                    )}
                                    Save Changes
                                </button>
                            </div>
                        )}
                    </div>
                )}

                {/* Security Tab */}
                {activeTab === 'security' && (
                    <div className="p-6 space-y-8">
                        {/* Change Password */}
                        <div>
                            <h3 className="text-lg font-medium text-gray-900 mb-4">Change Password</h3>
                            <div className="space-y-4 max-w-md">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Current Password</label>
                                    <div className="relative">
                                        <Lock className="h-4 w-4 absolute left-3 top-3 text-gray-400" />
                                        <input
                                            type={showPasswords.current ? 'text' : 'password'}
                                            value={passwordForm.current_password}
                                            onChange={(e) => setPasswordForm(prev => ({ ...prev, current_password: e.target.value }))}
                                            className="pl-10 pr-10 w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPasswords(prev => ({ ...prev, current: !prev.current }))}
                                            className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                                        >
                                            {showPasswords.current ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                        </button>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">New Password</label>
                                    <div className="relative">
                                        <Key className="h-4 w-4 absolute left-3 top-3 text-gray-400" />
                                        <input
                                            type={showPasswords.new ? 'text' : 'password'}
                                            value={passwordForm.new_password}
                                            onChange={(e) => setPasswordForm(prev => ({ ...prev, new_password: e.target.value }))}
                                            className="pl-10 pr-10 w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPasswords(prev => ({ ...prev, new: !prev.new }))}
                                            className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                                        >
                                            {showPasswords.new ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                        </button>
                                    </div>
                                    {passwordForm.new_password && (
                                        <div className="mt-2">
                                            <div className="flex items-center space-x-2 mb-1">
                                                <div className="flex-1 bg-gray-200 rounded-full h-2">
                                                    <div
                                                        className={`h-2 rounded-full ${getPasswordStrengthColor(passwordStrength)} transition-all duration-300`}
                                                        style={{ width: `${(passwordStrength / 5) * 100}%` }}
                                                    />
                                                </div>
                                                <span className="text-xs text-gray-600">{getPasswordStrengthText(passwordStrength)}</span>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Confirm New Password</label>
                                    <div className="relative">
                                        <Key className="h-4 w-4 absolute left-3 top-3 text-gray-400" />
                                        <input
                                            type={showPasswords.confirm ? 'text' : 'password'}
                                            value={passwordForm.confirm_password}
                                            onChange={(e) => setPasswordForm(prev => ({ ...prev, confirm_password: e.target.value }))}
                                            className="pl-10 pr-10 w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPasswords(prev => ({ ...prev, confirm: !prev.confirm }))}
                                            className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                                        >
                                            {showPasswords.confirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                        </button>
                                    </div>
                                    {passwordForm.confirm_password && passwordForm.new_password !== passwordForm.confirm_password && (
                                        <p className="mt-1 text-sm text-red-600">Passwords do not match</p>
                                    )}
                                </div>

                                <button
                                    onClick={changePassword}
                                    disabled={saving || !passwordForm.current_password || !passwordForm.new_password || passwordForm.new_password !== passwordForm.confirm_password}
                                    className="inline-flex items-center px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 disabled:opacity-50"
                                >
                                    {saving ? (
                                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                                    ) : (
                                        <Lock className="h-4 w-4 mr-2" />
                                    )}
                                    Change Password
                                </button>
                            </div>
                        </div>                                               
                    </div>
                )}                
            </div>
        </div>
    );

}

export default AdminProfile;



