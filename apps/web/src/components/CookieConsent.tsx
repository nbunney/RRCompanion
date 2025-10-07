import React, { useState, useEffect } from 'react';
import Button from './Button';

const CookieConsent: React.FC = () => {
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    // Check if user has already made a consent choice
    const consent = localStorage.getItem('cookieConsent');
    if (!consent) {
      setShowBanner(true);
    } else {
      // Apply the user's previous consent choice
      applyConsent(consent);
    }
  }, []);

  const applyConsent = (choice: string) => {
    if (choice === 'accepted') {
      // Enable Google Analytics and GTM tracking
      if (typeof window !== 'undefined' && (window as any).gtag) {
        (window as any).gtag('consent', 'update', {
          analytics_storage: 'granted',
          ad_storage: 'granted',
          ad_user_data: 'granted',
          ad_personalization: 'granted',
        });
      }
    } else if (choice === 'rejected') {
      // Disable tracking
      if (typeof window !== 'undefined' && (window as any).gtag) {
        (window as any).gtag('consent', 'update', {
          analytics_storage: 'denied',
          ad_storage: 'denied',
          ad_user_data: 'denied',
          ad_personalization: 'denied',
        });
      }
    }
  };

  const handleAccept = () => {
    localStorage.setItem('cookieConsent', 'accepted');
    applyConsent('accepted');
    setShowBanner(false);
  };

  const handleReject = () => {
    localStorage.setItem('cookieConsent', 'rejected');
    applyConsent('rejected');
    setShowBanner(false);
  };

  if (!showBanner) {
    return null;
  }

  return (
    <>
      {/* Backdrop overlay */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-40"
        style={{ backdropFilter: 'blur(2px)' }}
      />

      {/* Cookie consent banner */}
      <div className="fixed bottom-0 left-0 right-0 z-50 p-4 sm:p-6">
        <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-2xl border border-gray-200">
          <div className="p-6 sm:p-8">
            <div className="flex items-start mb-4">
              <div className="flex-shrink-0">
                <svg
                  className="h-6 w-6 text-blue-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <div className="ml-3 flex-1">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Cookie Consent
                </h3>
                <div className="text-sm text-gray-600 space-y-2">
                  <p>
                    We use cookies and similar technologies to help personalize content, tailor and measure ads,
                    and provide a better experience. By clicking accept, you agree to this, as outlined in our{' '}
                    <a
                      href="/privacy"
                      className="text-blue-600 hover:text-blue-800 underline"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Privacy Policy
                    </a>.
                  </p>
                  <p>
                    We use Google Analytics and Google Tag Manager to understand how our site is used and to
                    improve your experience. You can choose to accept or reject these cookies.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 mt-6">
              <Button
                onClick={handleAccept}
                variant="primary"
                className="flex-1 sm:flex-none"
              >
                Accept All Cookies
              </Button>
              <Button
                onClick={handleReject}
                variant="secondary"
                className="flex-1 sm:flex-none"
              >
                Reject Non-Essential
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default CookieConsent;

