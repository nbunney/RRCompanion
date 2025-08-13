import React from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Card from '@/components/Card';

const About: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header showUserInfo={true} />

      <main className="flex-1 max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            About
          </h1>
          <Card className="p-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              Founder
            </h2>
            <div className="flex flex-col md:flex-row items-center md:items-start space-y-4 md:space-y-0 md:space-x-6">
              <div className="flex-shrink-0">
                <img
                  src="/images/smoking.png"
                  alt="NateDogg - RRCompanion Founder"
                  className="w-32 h-32 rounded-lg object-cover shadow-md"
                />
              </div>
              <div className="flex-1">
                <p className="text-gray-700 leading-relaxed">
                  <a href="https://www.royalroad.com/profile/373252" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 underline">NateDogg</a> is the founder of RRCompanion. He is a RoyalRoad reader and author, and he is the one who built the system.<br />
                  <br />
                  His new fiction, <a href="https://www.royalroad.com/fiction/122933/prisoner-of-the-system/chapter/2497771" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 underline">Prisoner of the System</a>, is launching on August 28th.
                </p>
              </div>
            </div>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default About;
