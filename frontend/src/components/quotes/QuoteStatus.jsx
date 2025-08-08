// components/quotes/QuoteStatus.jsx
import React from 'react';
import { FileCheck, Clock, CheckCircle, AlertCircle, Edit2 } from 'lucide-react';

const QuoteStatus = ({ quote, signatureStatus, compact = false }) => {
  const getStatusInfo = () => {
    if (signatureStatus?.is_signed) {
      return {
        icon: FileCheck,
        text: 'Signed',
        color: 'text-green-600',
        bgColor: 'bg-green-100',
        details: signatureStatus.signature ? `by ${signatureStatus.signature.client_name}` : ''
      };
    }

    switch (quote.status) {
      case 'draft':
        return {
          icon: Clock,
          text: 'Draft',
          color: 'text-gray-600',
          bgColor: 'bg-gray-100'
        };
      case 'sent':
        return {
          icon: Edit2,
          text: 'Awaiting Signature',
          color: 'text-orange-600',
          bgColor: 'bg-orange-100'
        };
      case 'accepted':
        return {
          icon: CheckCircle,
          text: 'Accepted',
          color: 'text-green-600',
          bgColor: 'bg-green-100'
        };
      case 'expired':
        return {
          icon: AlertCircle,
          text: 'Expired',
          color: 'text-red-600',
          bgColor: 'bg-red-100'
        };
      default:
        return {
          icon: Clock,
          text: quote.status,
          color: 'text-gray-600',
          bgColor: 'bg-gray-100'
        };
    }
  };

  const statusInfo = getStatusInfo();
  const Icon = statusInfo.icon;

  if (compact) {
    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${statusInfo.color} ${statusInfo.bgColor}`}>
        <Icon className="h-3 w-3 mr-1" />
        {statusInfo.text}
      </span>
    );
  }

  return (
    <div className={`flex items-center space-x-2 px-3 py-2 rounded-lg ${statusInfo.bgColor}`}>
      <Icon className={`h-5 w-5 ${statusInfo.color}`} />
      <div>
        <span className={`font-medium ${statusInfo.color}`}>
          {statusInfo.text}
        </span>
        {statusInfo.details && (
          <p className="text-sm text-gray-600">{statusInfo.details}</p>
        )}
        {signatureStatus?.signed_at && (
          <p className="text-xs text-gray-500">
            {new Date(signatureStatus.signed_at).toLocaleDateString()}
          </p>
        )}
      </div>
    </div>
  );
};

export default QuoteStatus;