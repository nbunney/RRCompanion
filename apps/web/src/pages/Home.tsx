import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import Card from '@/components/Card';
import Footer from '@/components/Footer';
import Header from '@/components/Header';

const Home: React.FC = () => {
  const { isAuthenticated } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header showUserInfo={false} />

      <main className="flex-1 max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Welcome to RRCompanion
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Your intelligent companion for tracking and analyzing RoyalRoad fiction
          </p>
        </div>

        <div className="space-y-8">
          <Card className="p-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              What is RRCompanion?
            </h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              RRCompanion is a powerful web application designed to help RoyalRoad readers
              and authors track, analyze, and manage their favorite fiction. Whether you're
              a reader who wants to keep tabs on your favorite stories or an author looking
              to monitor your work's performance, RRCompanion provides the tools you need.
            </p>
            <p className="text-gray-700 leading-relaxed">
              Our platform collects data from RoyalRoad, including page counts,
              follower numbers, ratings, and more, giving you comprehensive insights into
              fiction performance over time. Sponsorship allows this information to be updated automatically.
            </p>
          </Card>

          <Card className="p-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              Key Features
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <h3 className="text-lg font-medium text-gray-900">📚 Fiction Tracking</h3>
                <p className="text-gray-700">
                  Add your favorite RoyalRoad fiction to your personal library and track
                  their progress.
                </p>
              </div>
              <div className="space-y-3">
                <h3 className="text-lg font-medium text-gray-900">📊 Performance Analytics</h3>
                <p className="text-gray-700">
                  View detailed statistics including page counts, follower growth, ratings,
                  and view counts over time.
                </p>
              </div>
              <div className="space-y-3">
                <h3 className="text-lg font-medium text-gray-900">🌙 Automated Updates</h3>
                <p className="text-gray-700">
                  Our system automatically updates sponsored fiction data daily, ensuring you always
                  have the latest information. Unsponsored fiction must be manually updated.
                </p>
              </div>
              <div className="space-y-3">
                <h3 className="text-lg font-medium text-gray-900">📈 Rising Stars Monitoring</h3>
                <p className="text-gray-900">
                  Any fiction on Rising Stars, whether sponsored or not, will be automatically updated daily.
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              How It Works
            </h2>
            <div className="space-y-4">
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-blue-600 font-semibold">1</span>
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">Connect Your Account</h3>
                  <p className="text-gray-700">
                    Sign up and authenticate with your preferred OAuth provider for secure access.
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-blue-600 font-semibold">2</span>
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">Add Your Fiction</h3>
                  <p className="text-gray-700">
                    Add RoyalRoad fictions to your personal tracking list.
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-blue-600 font-semibold">3</span>
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">Sponsor Your Fiction or Update Daily</h3>
                  <p className="text-gray-700">
                    Either sponsor your fiction (one time fee of $5) or update it every 24 hours to keep your data current.
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-blue-600 font-semibold">4</span>
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">Monitor Progress</h3>
                  <p className="text-gray-700">
                    View detailed analytics, charts, and progress tracking for all your fictions.
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-blue-600 font-semibold">5</span>
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">Download Raw Data</h3>
                  <p className="text-gray-700">
                    Download raw data for sponsored fictions in CSV format.
                  </p>
                </div>
              </div>
            </div>
          </Card>

          <Card className="p-8 text-center">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              Ready to Get Started?
            </h2>
            <p className="text-gray-700 mb-6">
              Join those of us using RRCompanion to track our favorite fictions.
            </p>
            <div className="space-x-4">
              {isAuthenticated ? (
                <Link
                  to="/dashboard"
                  className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 transition-colors"
                >
                  Go to Dashboard
                </Link>
              ) : (
                <Link
                  to="/register"
                  className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 transition-colors"
                >
                  Sign Up Now
                </Link>
              )}
            </div>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Home;
