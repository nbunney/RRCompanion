import React from 'react';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  showText?: boolean;
}

const Logo: React.FC<LogoProps> = ({ size = 'md', className = '', showText = true }) => {
  const sizeClasses = {
    sm: 'h-6 w-6',
    md: 'h-8 w-8',
    lg: 'h-12 w-12',
    xl: 'h-16 w-16'
  };

  const textSizes = {
    sm: 'text-sm',
    md: 'text-lg',
    lg: 'text-xl',
    xl: 'text-2xl'
  };

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <img
        src="/images/logo.png"
        alt="RRCompanion Logo"
        className={`${sizeClasses[size]} object-contain`}
        onError={(e) => {
          // Fallback if logo doesn't exist
          const target = e.target as HTMLImageElement;
          target.style.display = 'none';
        }}
      />
      {showText && (
        <span className={`font-semibold text-gray-900 ${textSizes[size]}`}>
          RRCompanion
        </span>
      )}
    </div>
  );
};

export default Logo; 