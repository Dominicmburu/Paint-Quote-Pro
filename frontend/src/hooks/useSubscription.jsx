import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import api from '../services/api';

const SubscriptionContext = createContext();

export const useSubscription = () => {
  const context = useContext(SubscriptionContext);
  if (!context) {
    throw new Error('useSubscription must be used within a SubscriptionProvider');
  }
  return context;
};

export const SubscriptionProvider = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isAuthenticated && user?.company_id) {
      fetchSubscription();
    }
  }, [isAuthenticated, user]);

  const fetchSubscription = async () => {
    try {
      setLoading(true);
      const response = await api.get('/subscriptions/current');
      setSubscription(response.data.subscription);
    } catch (error) {
      console.error('Failed to fetch subscription:', error);
    } finally {
      setLoading(false);
    }
  };

  const canCreateProject = () => {
    if (!subscription) return false;
    return subscription.is_active && 
           (subscription.max_projects === -1 || 
            subscription.projects_used_this_month < subscription.max_projects);
  };

  const getProjectsRemaining = () => {
    if (!subscription) return 0;
    if (subscription.max_projects === -1) return Infinity;
    return Math.max(0, subscription.max_projects - subscription.projects_used_this_month);
  };

  const value = {
    subscription,
    loading,
    fetchSubscription,
    canCreateProject,
    getProjectsRemaining
  };

  return (
    <SubscriptionContext.Provider value={value}>
      {children}
    </SubscriptionContext.Provider>
  );
};