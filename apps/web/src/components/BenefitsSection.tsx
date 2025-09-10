import React from 'react';

const BenefitsSection: React.FC = () => {
  return (
    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg shadow-lg p-8">
      <div className="text-center mb-6">
        <div className="text-4xl mb-4">🚀</div>
        <h3 className="text-2xl font-bold text-gray-900 mb-2">Benefits to Creating an Account</h3>
        <p className="text-gray-600">Unlock additional features and get the most out of RRCompanion</p>
      </div>

      <div className="grid md:grid-cols-2 gap-6 mb-8">
        <div className="space-y-4">
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
              <span className="text-blue-600 text-sm font-semibold">⭐</span>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900">Favorite Fictions</h4>
              <p className="text-sm text-gray-600">Save your favorite fictions and quickly access them for position calculations</p>
            </div>
          </div>

          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0 w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
              <span className="text-purple-600 text-sm font-semibold">📈</span>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900">Personal Dashboard</h4>
              <p className="text-sm text-gray-600">Get personalized insights and recommendations based on your reading habits</p>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0 w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
              <span className="text-yellow-600 text-sm font-semibold">⚡</span>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900">Faster Access</h4>
              <p className="text-sm text-gray-600">Quick access to position calculations with your saved fictions</p>
            </div>
          </div>

          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0 w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center">
              <span className="text-indigo-600 text-sm font-semibold">🎯</span>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900">Advanced Analytics</h4>
              <p className="text-sm text-gray-600">Access detailed analytics and trends for your favorite fictions</p>
            </div>
          </div>
        </div>
      </div>

      <div className="text-center">
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <a
            href="/register"
            className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            Create Free Account
          </a>
          <a
            href="/login"
            className="bg-white text-blue-600 px-6 py-3 rounded-lg font-medium border border-blue-600 hover:bg-blue-50 transition-colors"
          >
            Sign In
          </a>
        </div>
        <p className="text-xs text-gray-500 mt-4">Free to join • No credit card required • Cancel anytime</p>
      </div>
    </div>
  );
};

export default BenefitsSection;
