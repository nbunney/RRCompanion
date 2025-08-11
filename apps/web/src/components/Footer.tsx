import React from 'react';
import { getCurrentYear } from '@/utils/dateUtils';

interface FooterProps {
  className?: string;
}

const Footer: React.FC<FooterProps> = ({ className = '' }) => {
  return (
    <footer className={`bg-white border-t border-gray-200 ${className}`}>
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="text-sm text-gray-500">
            © {getCurrentYear()} RRCompanion. All rights reserved.
          </div>

        </div>
      </div>
    </footer>
  );
};

export default Footer; 