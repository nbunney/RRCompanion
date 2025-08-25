import React from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import RisingStarsAnimation from '@/components/RisingStarsAnimation';

const RisingStarsAnimationPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header
        title="Rising Stars Animation"
        showBackButton={true}
        backUrl="/dashboard"
        showUserInfo={false}
        showAboutLink={true}
      />

      <main className="flex-1 max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <RisingStarsAnimation />
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default RisingStarsAnimationPage;
