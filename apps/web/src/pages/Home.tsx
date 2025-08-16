import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import Card from '@/components/Card';
import Footer from '@/components/Footer';
import Header from '@/components/Header';
import TopFictionsTable from '@/components/TopFictionsTable';

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
              to monitor your work's performance, RRCompanion provides comprehensive tools for data-driven insights.
            </p>
            <p className="text-gray-700 leading-relaxed">
              Our platform automatically collects and analyzes data from RoyalRoad, including page counts,
                              follower numbers, ratings, Rising Stars rankings, and more. With automated daily updates for all fiction
              and Rising Stars entries, you get real-time performance tracking and the ability to export comprehensive datasets
              for further analysis or record-keeping.
            </p>
          </Card>

          {/* Top Fictions Table */}
          <TopFictionsTable />

          <Card className="p-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
              {/* Key Features - Left Side */}
              <div>
                <h2 className="text-2xl font-semibold text-gray-900 mb-6">
                  Key Features
                </h2>
                <div className="space-y-4">
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
                      Our system automatically updates ALL fiction data daily, ensuring you always
                      have the latest information for every fiction in your library.
                    </p>
                  </div>
                  <div className="space-y-3">
                    <h3 className="text-lg font-medium text-gray-900">📈 Rising Stars Monitoring</h3>
                    <p className="text-gray-900">
                      Any fiction on Rising Stars will be automatically updated four times daily.
                    </p>
                  </div>
                  <div className="space-y-3">
                    <h3 className="text-lg font-medium text-gray-900">📦 Downloadable Data</h3>
                    <p className="text-gray-700">
                      Export comprehensive data for all fictions including historical metrics and Rising Stars rankings in organized ZIP files.
                    </p>
                  </div>
                </div>
              </div>

              {/* Platform Showcase Image - Right Side */}
              <div className="flex justify-center lg:justify-end">
                <div className="max-w-md">
                  <img
                    src="/images/detail.png"
                    alt="RRCompanion Fiction Details Page - Showing charts, stats, and analytics for 'Save Scumming' by RavensDagger"
                    className="w-full h-auto rounded-lg shadow-lg border border-gray-200"
                  />
                  <p className="text-sm text-gray-600 text-center mt-3 italic">
                    See the platform in action with detailed analytics and charts
                  </p>
                </div>
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
                  <h3 className="font-medium text-gray-900">Add Your Fiction</h3>
                  <p className="text-gray-700">
                    Simply add RoyalRoad fictions to your tracking list. All fictions are automatically updated daily at 12:24am PST.
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
                  <h3 className="font-medium text-gray-900">Download Comprehensive Data</h3>
                  <p className="text-gray-700">
                    Download organized ZIP files containing historical metrics and Rising Stars rankings for all fictions.
                  </p>
                </div>
              </div>
            </div>
          </Card>

          <Card className="p-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              Data Update Schedule
            </h2>
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <h3 className="text-lg font-medium text-gray-900">⭐ Rising Stars Rankings</h3>
                  <p className="text-gray-700">
                    Updated four times daily at 12:24am, 6:24am, 12:24pm, and 6:24pm PST to keep rankings current throughout the day and night.
                  </p>
                </div>
                <div className="space-y-3">
                  <h3 className="text-lg font-medium text-gray-900">🌙 Comprehensive Updates</h3>
                  <p className="text-gray-700">
                    Complete fiction details and metrics for ALL fictions updated once daily at 12:24am PST for thorough data refresh.
                  </p>
                </div>
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-medium text-blue-900 mb-2">📅 Timezone Information</h4>
                <p className="text-blue-800 text-sm">
                  All times are shown in Pacific Standard Time (PST). For your local timezone,
                  add 3 hours for Eastern Time, 2 hours for Central Time, 1 hour for Mountain Time,
                  or subtract 8 hours for UTC.
                </p>
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
