import React from 'react';
import type { OAuthProvider } from '@/types';

interface OAuthButtonProps {
  provider: OAuthProvider;
  onClick: () => void;
  disabled?: boolean;
  className?: string;
}

const OAuthButton: React.FC<OAuthButtonProps> = ({
  provider,
  onClick,
  disabled = false,
  className = '',
}) => {
  const isProviderDisabled = provider.enabled === false;
  const isButtonDisabled = disabled || isProviderDisabled;

  return (
    <button
      onClick={onClick}
      disabled={isButtonDisabled}
      className={`w-full flex items-center justify-center px-4 py-3 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
      style={{ borderColor: isProviderDisabled ? '#d1d5db' : provider.color }}
    >
      <span className="text-xl mr-3">{provider.icon}</span>
      <span>
        {isProviderDisabled
          ? `${provider.displayName} (Coming Soon)`
          : `Continue with ${provider.displayName}`
        }
      </span>
    </button>
  );
};

export default OAuthButton; 