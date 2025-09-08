import React, { useEffect, useState } from 'react';
import { CheckCircle, ArrowRight, Calendar, Users, Briefcase, AlertCircle } from 'lucide-react';
import api from '../services/api';


const PaymentSuccess = () => {
  const [sessionDetails, setSessionDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

useEffect(() => {
  const fetchSessionDetails = async () => {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const sessionId = urlParams.get('session_id');
      
      if (!sessionId) {
        setError('No session ID found in URL');
        setLoading(false);
        return;
      }

      const response = await api.get(`/subscriptions/session/${sessionId}`);
      setSessionDetails(response.data);

    } catch (error) {
      console.error('Error fetching session details:', error);
      setError(error.response?.data?.message || error.message);
    } finally {
      setLoading(false);
    }
  };

  fetchSessionDetails();
}, []);


  if (loading) {
    return (
      <div className="min-h-screen bg-yellow-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#4bb4f5] mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your subscription details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-yellow-50 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8 max-w-md">
          <div className="text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-red-700 mb-2">Unable to Load Details</h2>
            <p className="text-gray-600 mb-6">{error}</p>
            <button
              onClick={() => window.location.href = '/dashboard'}
              className="bg-[#4bb4f5] hover:bg-[#4bb4f5] text-white px-6 py-2 rounded-lg font-semibold transition-colors"
            >
              Go to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-GB', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const planFeatures = {
    starter: [
      'Up to 5 projects per month',
      'Basic AI analysis',
      'PDF quote generation',
      '2 team members',
      'Email support'
    ],
    professional: [
      'Up to 25 projects per month',
      'Advanced AI analysis',
      'Custom templates',
      '10 team members',
      'Priority support',
      'Custom branding'
    ],
    enterprise: [
      'Unlimited projects',
      'Unlimited team members',
      'Advanced AI analysis',
      'White-label options',
      'API access',
      'Dedicated support'
    ]
  };

  const currentPlanFeatures = planFeatures[sessionDetails?.plan_name?.toLowerCase()] || planFeatures.professional;

  return (
    <div className="min-h-screen bg-yellow-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#4bb4f5] to-[#4bb4f5] py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center">
            <div className="bg-white rounded-full p-3 mr-4">
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
            <h1 className="text-3xl font-bold text-white">Payment Successful!</h1>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Success Message */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8 mb-8">
          <div className="text-center mb-8">
            <div className="bg-green-100 rounded-full p-6 w-24 h-24 mx-auto mb-6">
              <CheckCircle className="h-12 w-12 text-green-500 mx-auto" />
            </div>
            <h2 className="text-2xl font-bold text-[#4bb4f5] mb-4">
              Welcome to Paint Quote Pro!
            </h2>
            <p className="text-gray-600 text-lg">
              Your {sessionDetails?.plan_name?.toLowerCase() === 'professional' ? 'Professional' : sessionDetails?.plan_name?.charAt(0).toUpperCase() + sessionDetails?.plan_name?.slice(1)} subscription is now active. 
              You're ready to create professional paint quotes in minutes!
            </p>
          </div>

          {/* Plan Details */}
          <div className="bg-green-50 rounded-xl p-6 mb-8">
            <h3 className="text-lg font-semibold text-[#4bb4f5] mb-4 flex items-center">
              <Briefcase className="h-5 w-5 mr-2" />
              Subscription Details
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <span className="text-gray-600">Plan:</span>
                <span className="font-semibold text-[#4bb4f5] ml-2">
                  {sessionDetails?.plan_name?.charAt(0).toUpperCase() + sessionDetails?.plan_name?.slice(1)}
                </span>
              </div>
              <div>
                <span className="text-gray-600">Billing:</span>
                <span className="font-semibold text-[#4bb4f5] ml-2">
                  £{sessionDetails?.amount}/{sessionDetails?.billing_cycle}
                </span>
              </div>
              <div>
                <span className="text-gray-600">Email:</span>
                <span className="font-semibold text-[#4bb4f5] ml-2 text-sm">
                  {sessionDetails?.customer_email}
                </span>
              </div>
              <div className="flex items-center">
                <Calendar className="h-4 w-4 text-gray-500 mr-1" />
                <span className="text-gray-600">Next billing:</span>
                <span className="font-semibold text-[#4bb4f5] ml-2 text-sm">
                  {formatDate(sessionDetails?.next_billing_date)}
                </span>
              </div>
            </div>
          </div>

          {/* Plan Features */}
          <div className="bg-purple-50 rounded-xl p-6 mb-8">
            <h3 className="text-lg font-semibold text-[#4bb4f5] mb-4 flex items-center">
              <Users className="h-5 w-5 mr-2" />
              What's Included in Your Plan
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {currentPlanFeatures.map((feature, index) => (
                <div key={index} className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-[#4bb4f5] mr-3 flex-shrink-0" />
                  <span className="text-gray-700 text-sm">{feature}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => window.location.href = '/dashboard'}
              className="bg-[#4bb4f5] hover:bg-[#4bb4f5] text-white px-8 py-3 rounded-lg font-semibold transition-colors flex items-center justify-center"
            >
              <span>Go to Dashboard</span>
              <ArrowRight className="h-5 w-5 ml-2" />
            </button>
          </div>
        </div>

        {/* Quick Start Guide */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8 mb-8">
          <h3 className="text-xl font-bold text-[#4bb4f5] mb-6 text-center">
            Get Started in 3 Easy Steps
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="bg-purple-100 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-4">
                <span className="text-[#4bb4f5] font-bold text-lg">1</span>
              </div>
              <h4 className="font-semibold text-[#4bb4f5] mb-2">Upload Floor Plan</h4>
              <p className="text-gray-600 text-sm">Upload your project's floor plan and let our AI analyze it</p>
            </div>
            <div className="text-center">
              <div className="bg-purple-100 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-4">
                <span className="text-[#4bb4f5] font-bold text-lg">2</span>
              </div>
              <h4 className="font-semibold text-[#4bb4f5] mb-2">Review Analysis</h4>
              <p className="text-gray-600 text-sm">Check surface areas and measurements calculated by AI</p>
            </div>
            <div className="text-center">
              <div className="bg-purple-100 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-4">
                <span className="text-[#4bb4f5] font-bold text-lg">3</span>
              </div>
              <h4 className="font-semibold text-[#4bb4f5] mb-2">Generate Quote</h4>
              <p className="text-gray-600 text-sm">Create professional PDF quotes in seconds</p>
            </div>
          </div>
        </div>        

        {/* Receipt Information */}
        <div className="mt-8 text-center">
          <p className="text-gray-600 text-sm">
            A receipt has been sent to {sessionDetails?.customer_email}.
          </p>
        </div>
      </div>
    </div>
  );
};

export default PaymentSuccess;