import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { fictionAPI, stripeAPI } from '../services/api';
import { Fiction } from '../types';
import Card from '../components/Card';
import Button from '../components/Button';
import Header from '../components/Header';
import Modal from '../components/Modal';
import { useAuth } from '../hooks/useAuth';

// Stripe Elements configuration
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

// Payment form component
const PaymentForm: React.FC<{ fiction: Fiction; onSuccess: (paymentIntentId: string) => void; onCancel: () => void }> = ({ fiction, onSuccess, onCancel }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      // Create payment intent
      const paymentResponse = await stripeAPI.createSponsorshipPayment(fiction.id);
      if (!paymentResponse.success || !paymentResponse.data) {
        throw new Error('Failed to create payment intent');
      }

      const { clientSecret } = paymentResponse.data;

      // Confirm card payment
      const { error: paymentError } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: elements.getElement(CardElement)!,
        },
      });

      if (paymentError) {
        setError(paymentError.message || 'Payment failed');
      } else {
        // Get the payment intent ID from the response
        const paymentIntentId = paymentResponse.data.paymentIntentId;
        onSuccess(paymentIntentId);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Payment failed');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <h3 className="text-lg font-medium text-gray-900 mb-3">Credit Card Information</h3>
        <CardElement
          options={{
            style: {
              base: {
                fontSize: '16px',
                color: '#424770',
                '::placeholder': {
                  color: '#aab7c4',
                },
              },
              invalid: {
                color: '#9e2146',
              },
            },
          }}
        />
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-800 text-sm">{error}</p>
        </div>
      )}

      <div className="flex space-x-3">
        <Button
          type="submit"
          className="flex-1"
          disabled={!stripe || isProcessing}
        >
          {isProcessing ? 'Processing Payment...' : 'Pay $5 once to sponsor'}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isProcessing}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
};

const Sponsor: React.FC = () => {
  console.log('🔗 Sponsor component rendered');
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { checkAuth } = useAuth();
  const [fiction, setFiction] = useState<Fiction | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'success'>('idle');
  const [couponCode, setCouponCode] = useState('');
  const [couponError, setCouponError] = useState<string | null>(null);
  const [couponSuccess, setCouponSuccess] = useState<string | null>(null);
  const [isProcessingCoupon, setIsProcessingCoupon] = useState(false);

  // Check authentication when component mounts
  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    const loadFiction = async () => {
      console.log('🔗 Sponsor page received ID:', id);
      if (!id) {
        setError('No fiction ID provided');
        setLoading(false);
        return;
      }

      try {
        console.log('🔗 Calling fictionAPI.getFictionByRoyalRoadId with:', id);
        const response = await fictionAPI.getFictionByRoyalRoadId(id);
        console.log('🔗 API response:', response);
        if (response.success && response.data) {
          setFiction(response.data);
        } else {
          setError('Fiction not found');
        }
      } catch (err) {
        console.error('Error loading fiction:', err);
        setError('Failed to load fiction');
      } finally {
        setLoading(false);
      }
    };

    loadFiction();

    // Clear coupon messages when fiction changes
    setCouponCode('');
    setCouponError(null);
    setCouponSuccess(null);
  }, [id]);

  // Refresh fiction data when user navigates back to the page
  useEffect(() => {
    const handleFocus = async () => {
      if (id && fiction) {
        console.log('🔗 Page focused, refreshing fiction data...');
        try {
          const response = await fictionAPI.getFictionByRoyalRoadId(id);
          if (response.success && response.data) {
            setFiction(response.data);
            console.log('✅ Fiction data refreshed on page focus');
          }
        } catch (err) {
          console.error('Error refreshing fiction data on focus:', err);
        }
      }
    };

    // Listen for page focus events (when user navigates back)
    window.addEventListener('focus', handleFocus);

    // Also refresh when the page becomes visible (for mobile browsers)
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        handleFocus();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [id, fiction]);

  const handlePaymentSuccess = async (paymentIntentId: string) => {
    setPaymentStatus('success');
    setShowPaymentForm(false);

    // Poll for payment confirmation and fiction update
    let attempts = 0;
    const maxAttempts = 10;
    const pollInterval = 2000; // 2 seconds

    const pollPaymentStatus = async () => {
      try {
        // Check payment status
        const paymentStatus = await stripeAPI.getPaymentStatus(paymentIntentId);

        if (paymentStatus.success && paymentStatus.data.status === 'succeeded') {
          // Payment confirmed, now refresh fiction data
          if (fiction) {
            const fictionResponse = await fictionAPI.getFictionByRoyalRoadId(fiction.royalroad_id);
            if (fictionResponse.success && fictionResponse.data) {
              setFiction(fictionResponse.data);
              console.log('✅ Fiction updated as sponsored');
              return; // Success, stop polling
            }
          }
        }

        // If not successful yet, continue polling
        attempts++;
        if (attempts < maxAttempts) {
          setTimeout(pollPaymentStatus, pollInterval);
        } else {
          console.warn('⚠️ Payment confirmation polling timed out');
          // Still refresh fiction data as fallback
          if (fiction) {
            const fictionResponse = await fictionAPI.getFictionByRoyalRoadId(fiction.royalroad_id);
            if (fictionResponse.success && fictionResponse.data) {
              setFiction(fictionResponse.data);
            }
          }
        }
      } catch (error) {
        console.error('Error polling payment status:', error);
        // Fallback: refresh fiction data
        if (fiction) {
          const fictionResponse = await fictionAPI.getFictionByRoyalRoadId(fiction.royalroad_id);
          if (fictionResponse.success && fictionResponse.data) {
            setFiction(fictionResponse.data);
          }
        }
      }
    };

    // Start polling
    pollPaymentStatus();
  };

  const handleCouponSubmit = async () => {
    if (!couponCode.trim() || !fiction) return;

    try {
      setIsProcessingCoupon(true);
      setCouponError(null);
      setCouponSuccess(null);

      const response = await fetch('/api/coupons/use', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          code: couponCode.trim(),
          fictionId: fiction.id
        })
      });

      const data = await response.json();

      if (data.success) {
        setCouponSuccess('Coupon used successfully! Fiction is now sponsored.');
        setCouponCode('');
        // Refresh fiction data to show as sponsored
        const fictionResponse = await fictionAPI.getFictionByRoyalRoadId(fiction.royalroad_id);
        if (fictionResponse.success && fictionResponse.data) {
          setFiction(fictionResponse.data);
        }
      } else {
        setCouponError(data.error || 'Failed to use coupon');
      }
    } catch (error) {
      console.error('Error using coupon:', error);
      setCouponError('Failed to use coupon. Please try again.');
    } finally {
      setIsProcessingCoupon(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (error || !fiction) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error || 'Fiction not found'}</p>
          <Button onClick={() => navigate('/dashboard')}>
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header
        title={`Sponsor ${fiction.title}`}
        showBackButton={true}
        backUrl="/dashboard"
        showUserInfo={true}
        showAboutLink={true}
      />

      {/* Main Content */}
      <main className="flex-1 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Fiction Info */}
          <div className="lg:col-span-2">
            <Card>
              <div className="p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  About {fiction.title}
                </h2>

                <div className="space-y-4">
                  {/* Fiction Cover Image */}
                  {fiction.image_url && (
                    <div className="flex justify-center mb-4">
                      <img
                        src={fiction.image_url}
                        alt={`Cover for ${fiction.title}`}
                        className="w-48 h-64 object-cover rounded-lg shadow-md"
                        onError={(e) => {
                          // Hide image if it fails to load
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                        }}
                      />
                    </div>
                  )}

                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Author</h3>
                    <p className="text-gray-600">{fiction.author_name}</p>
                  </div>

                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Description</h3>
                    <p className="text-gray-600 leading-relaxed">
                      {fiction.description || 'No description available'}
                    </p>
                  </div>

                  {fiction.tags && fiction.tags.length > 0 && (
                    <div>
                      <h3 className="text-lg font-medium text-gray-900 mb-2">Tags</h3>
                      <div className="flex flex-wrap gap-2">
                        {fiction.tags.map((tag) => (
                          <span
                            key={tag}
                            className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h3 className="text-lg font-medium text-gray-900 mb-2">Followers</h3>
                      <p className="text-2xl font-bold text-blue-600">
                        {typeof fiction.followers === 'number' ? fiction.followers.toLocaleString() : '0'}
                      </p>
                    </div>
                    <div>
                      <h3 className="text-lg font-medium text-gray-900 mb-2">Score</h3>
                      <p className="text-2xl font-bold text-green-600">
                        {typeof fiction.overall_score === 'number' ? fiction.overall_score.toFixed(1) : 'N/A'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* Sponsorship Info */}
          <div className="lg:col-span-1">
            <Card>
              <div className="p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  Sponsorship Information
                </h2>

                <div className="space-y-4">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h3 className="text-lg font-medium text-blue-900 mb-2">
                      Why Sponsor?
                    </h3>
                    <p className="text-blue-800 text-sm leading-relaxed">
                      Sponsoring a fiction makes sure you have data on the fiction daily. Sponsored fictions are treated like fictions that are on Rising Stars which are pulled every night.
                    </p>
                  </div>

                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <h3 className="text-lg font-medium text-green-900 mb-2">
                      Benefits
                    </h3>
                    <ul className="text-green-800 text-sm space-y-1">
                      <li>• Consistent timing for data pulled makes for better graphs and data</li>
                      <li>• No need to remember to log in every day to refresh the data</li>
                      <li>• Fiction is marked as 'Sponsored'</li>
                    </ul>
                  </div>

                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <h3 className="text-lg font-medium text-yellow-900 mb-2">
                      How It Works
                    </h3>
                    <p className="text-yellow-800 text-sm leading-relaxed">
                      A one time payment of $5 will sponsor your fiction forever. Simple as that. We use Stripe for secure and trusted payments.
                    </p>
                  </div>

                  {fiction?.sponsored === 1 ? (
                    <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                      <p className="text-green-800 text-sm font-medium">
                        ✅ This fiction is already sponsored!
                      </p>
                    </div>
                  ) : paymentStatus === 'success' ? (
                    <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                      <p className="text-green-800 text-sm font-medium">
                        ✅ Payment successful! This fiction is now sponsored.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="text-center p-3 bg-gray-50 border border-gray-200 rounded-lg">
                        <p className="text-gray-600 text-sm font-medium mb-2">
                          Current Status: <span className="text-red-600">Not Sponsored</span>
                        </p>
                        <p className="text-gray-500 text-xs">
                          This fiction is not currently receiving daily data updates
                        </p>
                      </div>
                      <Button
                        className="w-full"
                        onClick={() => {
                          setShowPaymentForm(true);
                          setCouponError(null);
                          setCouponSuccess(null);
                        }}
                      >
                        Sponsor This Fiction - $5
                      </Button>

                      {/* Coupon Code Section */}
                      <div className="border-t border-gray-200 pt-4">
                        <div className="text-center mb-3">
                          <p className="text-gray-600 text-sm font-medium">Or use a coupon code for free sponsorship</p>
                        </div>
                        <div className="space-y-3">
                          <input
                            type="text"
                            placeholder="Enter coupon code"
                            value={couponCode}
                            onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                            maxLength={20}
                          />
                          <Button
                            onClick={handleCouponSubmit}
                            disabled={!couponCode.trim() || isProcessingCoupon}
                            className="w-full"
                          >
                            {isProcessingCoupon ? 'Processing...' : 'Use Coupon'}
                          </Button>
                        </div>
                        {couponError && (
                          <p className="text-red-600 text-xs mt-2 text-center">{couponError}</p>
                        )}
                        {couponSuccess && (
                          <p className="text-green-600 text-xs mt-2 text-center">{couponSuccess}</p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          </div>
        </div>
      </main>

      {/* Payment Modal */}
      <Modal
        isOpen={showPaymentForm}
        onClose={() => setShowPaymentForm(false)}
        title={`Sponsor ${fiction.title}`}
        size="lg"
      >
        <div className="space-y-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="text-lg font-medium text-blue-900 mb-2">Payment Details</h3>
            <p className="text-blue-800 text-sm">
              You're about to sponsor <strong>{fiction.title}</strong> by <strong>{fiction.author_name}</strong> for $5.
              This will ensure daily data collection for this fiction.
            </p>
          </div>

          <Elements stripe={stripePromise}>
            <PaymentForm
              fiction={fiction}
              onSuccess={handlePaymentSuccess}
              onCancel={() => setShowPaymentForm(false)}
            />
          </Elements>
        </div>
      </Modal>
    </div>
  );
};

export default Sponsor; 