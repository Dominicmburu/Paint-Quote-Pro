import React from 'react';
import { Loader2 } from 'lucide-react';

const Loading = ({ message = 'Loading...', size = 'default' }) => {
  const sizeClasses = {
    small: 'h-4 w-4',
    default: 'h-8 w-8',
    large: 'h-12 w-12'
  };

  return (
    <div className="flex items-center justify-center min-h-64">
      <div className="flex flex-col items-center space-y-4">
        <Loader2 className={`${sizeClasses[size]} animate-spin text-purple-600`} />
        <p className="text-gray-600 text-sm">{message}</p>
      </div>
    </div>
  );
};

export default Loading;