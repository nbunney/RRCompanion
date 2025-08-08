import React from 'react';
import { clsx } from 'clsx';
import type { CardProps } from '@/types';

const Card: React.FC<CardProps> = ({ children, className = '' }) => {
  return (
    <div className={clsx(
      'rounded-lg border border-gray-200 bg-white text-gray-950 shadow-sm',
      className
    )}>
      {children}
    </div>
  );
};

export default Card; 