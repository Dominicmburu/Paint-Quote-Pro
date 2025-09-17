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
  const [company, setCompany] = useState(null);
  const [activePurchases, setActivePurchases] = useState([]);
  const [trialDaysRemaining, setTrialDaysRemaining] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isAuthenticated && user?.company_id) {
      fetchSubscription();
    }
  }, [isAuthenticated, user]);

  const fetchSubscription = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get('/subscriptions/current');
      
      // Set data based on backend response structure
      setSubscription(response.data.subscription);
      setCompany(response.data.company);
      setActivePurchases(response.data.active_purchases || []);
      setTrialDaysRemaining(response.data.trial_days_remaining || 0);
    } catch (error) {
      console.error('Failed to fetch subscription:', error);
      setError(error.response?.data?.error || 'Failed to fetch subscription');
    } finally {
      setLoading(false);
    }
  };

  const fetchUsageStats = async () => {
    try {
      const response = await api.get('/subscriptions/usage');
      return response.data;
    } catch (error) {
      console.error('Failed to fetch usage stats:', error);
      throw error;
    }
  };

  const fetchPaymentHistory = async () => {
    try {
      const response = await api.get('/subscriptions/payment-history');
      return response.data;
    } catch (error) {
      console.error('Failed to fetch payment history:', error);
      throw error;
    }
  };

  const fetchActivePurchases = async () => {
    try {
      const response = await api.get('/subscriptions/active-purchases');
      return response.data;
    } catch (error) {
      console.error('Failed to fetch active purchases:', error);
      throw error;
    }
  };

  const createCheckoutSession = async (planName, billingCycle = 'monthly') => {
    try {
      const response = await api.post('/subscriptions/create-checkout-session', {
        plan_name: planName,
        billing_cycle: billingCycle
      });
      return response.data;
    } catch (error) {
      console.error('Failed to create checkout session:', error);
      throw error;
    }
  };

  const getSessionDetails = async (sessionId) => {
    try {
      const response = await api.get(`/subscriptions/session/${sessionId}`);
      return response.data;
    } catch (error) {
      console.error('Failed to get session details:', error);
      throw error;
    }
  };

  const cancelPurchase = async (purchaseId) => {
    try {
      const response = await api.post(`/subscriptions/cancel/${purchaseId}`);
      // Refresh subscription data after cancellation
      await fetchSubscription();
      return response.data;
    } catch (error) {
      console.error('Failed to cancel purchase:', error);
      throw error;
    }
  };

  // Utility functions based on backend data structure
  const canCreateProject = () => {
    if (!subscription) return false;
    
    // Check if subscription is active (not cancelled/expired)
    const isActive = subscription.status === 'active' || subscription.status === 'trial';
    if (!isActive) return false;

    // Check project limits
    if (subscription.total_projects_allowed === -1) return true; // Unlimited
    
    return subscription.projects_used_this_period < subscription.total_projects_allowed;
  };

  const getProjectsRemaining = () => {
    if (!subscription) return 0;
    if (subscription.total_projects_allowed === -1) return Infinity; // Unlimited
    return Math.max(0, subscription.total_projects_allowed - subscription.projects_used_this_period);
  };

  const getStorageRemaining = () => {
    if (!subscription) return 0;
    if (subscription.total_storage_mb_allowed === -1) return Infinity; // Unlimited
    return Math.max(0, subscription.total_storage_mb_allowed - subscription.storage_used_mb);
  };

  const getUsersRemaining = () => {
    if (!subscription) return 0;
    if (subscription.total_users_allowed === -1) return Infinity; // Unlimited
    // Note: You might need to track users_used_this_period in your backend
    return subscription.total_users_allowed;
  };

  const getUsagePercentage = (used, allowed) => {
    if (allowed === -1) return 0; // Unlimited
    if (allowed === 0) return 100;
    return Math.min((used / allowed) * 100, 100);
  };

  const isTrialActive = () => {
    return subscription?.status === 'trial' && trialDaysRemaining > 0;
  };

  const isPastDue = () => {
    return subscription?.status === 'past_due';
  };

  const isCancelled = () => {
    return subscription?.status === 'cancelled';
  };

  const getDaysRemaining = () => {
    if (!subscription) return 0;
    return subscription.days_remaining || 0;
  };

  const getActivePlans = () => {
    if (!subscription) return [];
    return subscription.active_plans || [];
  };

  const hasActiveSubscription = () => {
    return subscription?.status === 'active' || subscription?.status === 'trial';
  };

  // Current usage stats
  const getCurrentUsage = () => {
    if (!subscription) return null;
    
    return {
      projects: {
        used: subscription.projects_used_this_period || 0,
        allowed: subscription.total_projects_allowed || 0,
        percentage: getUsagePercentage(
          subscription.projects_used_this_period || 0, 
          subscription.total_projects_allowed || 0
        )
      },
      storage: {
        used: subscription.storage_used_mb || 0,
        allowed: subscription.total_storage_mb_allowed || 0,
        percentage: getUsagePercentage(
          subscription.storage_used_mb || 0, 
          subscription.total_storage_mb_allowed || 0
        )
      },
      users: {
        used: 0, // You might need to add this to your backend
        allowed: subscription.total_users_allowed || 0,
        percentage: 0
      }
    };
  };

  const value = {
    // State
    subscription,
    company,
    activePurchases,
    trialDaysRemaining,
    loading,
    error,

    // API functions
    fetchSubscription,
    fetchUsageStats,
    fetchPaymentHistory,
    fetchActivePurchases,
    createCheckoutSession,
    getSessionDetails,
    cancelPurchase,

    // Utility functions
    canCreateProject,
    getProjectsRemaining,
    getStorageRemaining,
    getUsersRemaining,
    getCurrentUsage,
    getUsagePercentage,
    isTrialActive,
    isPastDue,
    isCancelled,
    getDaysRemaining,
    getActivePlans,
    hasActiveSubscription,

    // Refresh function
    refresh: fetchSubscription
  };

  return (
    <SubscriptionContext.Provider value={value}>
      {children}
    </SubscriptionContext.Provider>
  );
};