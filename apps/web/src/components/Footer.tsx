import React from 'react';
import { Link } from 'react-router-dom';
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

          <div className="flex items-center space-x-6 mt-4 md:mt-0">
            <Link
              to="/privacy"
              className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
            >
              Privacy Policy
            </Link>
            <Link
              to="/terms"
              className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
            >
              Terms of Service
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer; 