import React from 'react';
import { FileText, CheckCircle, TrendingUp, Clock, Users, DollarSign } from 'lucide-react';

const QuickStats = ({ stats, subscription }) => {
  const statCards = [
    {
      title: 'Total Projects',
      value: stats.total_projects || 0,
      icon: <FileText className="h-6 w-6 text-yellow-400" />,
      color: 'bg-purple-50 border-purple-200',
      change: '+12%',
      changeType: 'increase'
    },
    {
      title: 'Ready for Quote',
      value: stats.ready_projects || 0,
      icon: <CheckCircle className="h-6 w-6 text-[#4bb4f5]" />,
      color: 'bg-green-50 border-green-200',
      change: '+8%',
      changeType: 'increase'
    },
    {
      title: 'This Month',
      value: `${stats.projects_this_month || 0}${subscription?.max_projects > 0 ? `/${subscription.max_projects}` : ''}`,
      icon: <TrendingUp className="h-6 w-6 text-blue-600" />,
      color: 'bg-blue-50 border-blue-200',
      change: subscription?.projects_used_this_month > (subscription?.max_projects * 0.8) ? 'Near limit' : 'On track',
      changeType: subscription?.projects_used_this_month > (subscription?.max_projects * 0.8) ? 'warning' : 'neutral'
    },
    {
      title: 'Days Remaining',
      value: subscription?.days_remaining || 0,
      icon: <Clock className="h-6 w-6 text-yellow-600" />,
      color: 'bg-yellow-50 border-yellow-200',
      change: subscription?.status === 'trial' ? 'Trial' : subscription?.plan_name,
      changeType: 'neutral'
    }
  ];

  const getChangeColor = (type) => {
    switch (type) {
      case 'increase':
        return 'text-green-600';
      case 'decrease':
        return 'text-red-600';
      case 'warning':
        return 'text-yellow-600';
      default:
        return 'text-gray-600';
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {statCards.map((stat, index) => (
        <div key={index} className={`bg-white rounded-lg border p-6 ${stat.color} hover:shadow-md transition-shadow`}>
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-600 mb-1">{stat.title}</p>
              <p className="text-2xl font-bold text-gray-900 mb-2">{stat.value}</p>
              {stat.change && (
                <p className={`text-xs ${getChangeColor(stat.changeType)}`}>
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