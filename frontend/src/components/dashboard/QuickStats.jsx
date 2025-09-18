import React from 'react';
import { FileText, CheckCircle, TrendingUp, Clock, Users, DollarSign, AlertTriangle } from 'lucide-react';
import { useTranslation } from '../../hooks/useTranslation';

const QuickStats = ({ stats, subscription }) => {
  const { t } = useTranslation();
  
  // Helper function to format project usage display
  const getProjectUsageDisplay = () => {
    if (!subscription) return '0/0'; 
    
    const used = subscription.projects_used_this_period || 0;
    const allowed = subscription.total_projects_allowed || 0;
    
    if (allowed === -1) return `${used}`;  // Unlimited
    return `${used}/${allowed}`;
  };

  console.log('Subscription in QuickStats:', subscription);

  // Helper function to get usage percentage
  const getUsagePercentage = () => {
    if (!subscription) return 0;
    
    const used = subscription.projects_used_this_period || 0;
    const allowed = subscription.total_projects_allowed || 0;
    
    if (allowed === -1 || allowed === 0) return 0;
    return Math.min((used / allowed) * 100, 100);
  };

  // Helper function to get remaining days display with proper logic
  const getRemainingDaysDisplay = () => {
    if (!subscription) return 0;
    
    // Always show total access remaining days
    return subscription.days_remaining || 0;
  };

  // Helper function to get expiry details
  const getExpiryInfo = () => {
    if (!subscription) return { text: t('No Plan'), type: 'error' };
    
    const daysRemaining = subscription.days_remaining || 0;
    
    // Check what's expiring next
    if (subscription.status === 'trial') {
      const trialDays = subscription.trial_days_remaining || 0;
      if (trialDays <= 0) {
        return { text: t('Trial Expired'), type: 'error' };
      }
      return { text: t('Trial Active'), type: 'trial' };
    }
    
    // For active subscriptions
    if (subscription.status === 'active') {
      if (daysRemaining <= 3) {
        return { text: t('Expires Soon'), type: 'warning' };
      }
      if (daysRemaining <= 7) {
        return { text: t('Expires This Week'), type: 'warning' };
      }
      return { text: subscription.plan_name?.charAt(0)?.toUpperCase() + subscription.plan_name?.slice(1) || t('Active'), type: 'active' };
    }
    
    if (subscription.status === 'expired') {
      return { text: t('Subscription Expired'), type: 'error' };
    }
    
    return { text: t('Unknown Status'), type: 'neutral' };
  };

  // Helper function to get usage status
  const getUsageStatus = () => {
    const percentage = getUsagePercentage();
    
    if (!subscription || !subscription.can_create_project) {
      return { text: t('Limit Reached'), type: 'error' };
    }
    
    if (percentage >= 90) {
      return { text: t('Nearly Full'), type: 'warning' };
    }
    
    if (percentage >= 70) {
      return { text: t('Getting Full'), type: 'caution' };
    }
    
    return { text: t('Available'), type: 'success' };
  };

  const expiryInfo = getExpiryInfo();
  const usageStatus = getUsageStatus();

  const statCards = [
    {
      title: t('Total Projects'),
      value: stats?.total_projects || 0,
      icon: <FileText className="h-6 w-6 text-purple-600" />,
      color: 'bg-purple-50 border-purple-200',
      change: `${stats?.draft_projects || 0} ${t('draft')}, ${stats?.ready_projects || 0} ${t('ready')}`,
      changeType: 'neutral'
    },
    {
      title: t('Ready for Quote'),
      value: stats?.ready_projects || 0,
      icon: <CheckCircle className="h-6 w-6 text-green-600" />,
      color: 'bg-green-50 border-green-200',
      change: `${stats?.completed_projects || 0} ${t('completed')}`,
      changeType: 'success'
    },
    {
      title: t('Projects This Period'),
      value: getProjectUsageDisplay(),
      icon: subscription?.total_projects_allowed === -1 ? 
        <TrendingUp className="h-6 w-6 text-blue-600" /> : 
        <TrendingUp className="h-6 w-6 text-blue-600" />,
      color: usageStatus.type === 'error' ? 'bg-red-50 border-red-200' : 
             usageStatus.type === 'warning' ? 'bg-yellow-50 border-yellow-200' :
             'bg-blue-50 border-blue-200',
      change: usageStatus.text,
      changeType: usageStatus.type,
      showProgress: subscription?.total_projects_allowed > 0,
      progressPercentage: getUsagePercentage()
    },
    {
      title: t('Access Remaining'),
      value: getRemainingDaysDisplay(),
      icon: expiryInfo.type === 'warning' || expiryInfo.type === 'error' ? 
        <AlertTriangle className="h-6 w-6 text-red-600" /> :
        <Clock className="h-6 w-6 text-yellow-600" />,
      color: expiryInfo.type === 'error' ? 'bg-red-50 border-red-200' :
             expiryInfo.type === 'warning' ? 'bg-yellow-50 border-yellow-200' :
             expiryInfo.type === 'trial' ? 'bg-blue-50 border-blue-200' :
             'bg-green-50 border-green-200',
      change: expiryInfo.text,
      changeType: expiryInfo.type,
      subtitle: getRemainingDaysDisplay() === 1 ? t('day') : t('days')
    }
  ];

  const getChangeColor = (type) => {
    switch (type) {
      case 'success':
        return 'text-green-600';
      case 'error':
        return 'text-red-600';
      case 'warning':
        return 'text-yellow-600';
      case 'caution':
        return 'text-orange-600';
      case 'trial':
        return 'text-blue-600';
      case 'active':
        return 'text-green-600';
      default:
        return 'text-gray-600';
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {statCards.map((stat, index) => (
        <div key={index} className={`bg-white rounded-lg border p-6 ${stat.color} hover:shadow-md transition-shadow`}>
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-600 mb-1">{stat.title}</p>
              <div className="flex items-baseline gap-1 mb-2">
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                {stat.subtitle && (
                  <span className="text-sm text-gray-500">{stat.subtitle}</span>
                )}
              </div>
              
              {/* Progress bar for usage */}
              {stat.showProgress && (
                <div className="mb-2">
                  <div className="w-full bg-gray-200 rounded-full h-1.5">
                    <div 
                      className={`h-1.5 rounded-full transition-all duration-300 ${
                        stat.progressPercentage >= 90 ? 'bg-red-500' :
                        stat.progressPercentage >= 70 ? 'bg-yellow-500' :
                        'bg-blue-500'
                      }`}
                      style={{ width: `${Math.min(stat.progressPercentage, 100)}%` }}
                    />
                  </div>
                </div>
              )}
              
              {stat.change && (
                <p className={`text-xs ${getChangeColor(stat.changeType)} font-medium`}>
                  {stat.change}
                </p>
              )}
            </div>
            <div className="flex-shrink-0 ml-4">
              {stat.icon}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default QuickStats;