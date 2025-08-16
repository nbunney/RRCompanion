import React, { useState } from 'react';

import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { stripeAPI } from '../services/api';
import Card from '../components/Card';
import Button from '../components/Button';
import Header from '../components/Header';
import Modal from '../components/Modal';

// Stripe Elements configuration
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

// Payment form component
const PaymentForm: React.FC<{ onSuccess: (paymentIntentId: string) => void; onCancel: () => void }> = ({ onSuccess, onCancel }) => {
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
      // Create payment intent for coffee
      const paymentResponse = await stripeAPI.createCoffeePayment();
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
          {isProcessing ? 'Processing Payment...' : 'Buy Nate Coffee - $5'}
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

const Coffee: React.FC = () => {

  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'success'>('idle');

  const handlePaymentSuccess = async (_paymentIntentId: string) => {
    setPaymentStatus('success');
    setShowPaymentForm(false);
    console.log('✅ Coffee payment successful!');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header
        title="Buy Nate Coffee"
        showBackButton={true}
        backUrl="/dashboard"
        showUserInfo={true}
        showAboutLink={true}
      />

      {/* Main Content */}
      <main className="flex-1 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Coffee Info */}
          <div className="lg:col-span-1">
            <Card>
              <div className="p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  ☕ Support Nate with Coffee
                </h2>

                <div className="space-y-4">
                  <div className="text-center mb-6">
                    <div className="text-6xl mb-4">☕</div>
                    <h3 className="text-2xl font-bold text-gray-900">Buy Nate Coffee</h3>
                    <p className="text-gray-600">Help keep RRCompanion running smoothly!</p>
                  </div>

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h3 className="text-lg font-medium text-blue-900 mb-2">
                      Why Buy Nate Coffee?
                    </h3>
                    <p className="text-blue-800 text-sm leading-relaxed">
                      RRCompanion is a free service that helps authors and readers track fiction performance. 
                      Your coffee purchase helps cover server costs and keeps the service running for everyone.
                    </p>
                  </div>

                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <h3 className="text-lg font-medium text-green-900 mb-2">
                      What You Get
                    </h3>
                    <ul className="text-green-800 text-sm space-y-1">
                      <li>• The satisfaction of supporting a free service</li>
                      <li>• A warm feeling knowing you helped keep RRCompanion alive</li>
                      <li>• Nate's eternal gratitude (and caffeine boost)</li>
                    </ul>
                  </div>

                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <h3 className="text-lg font-medium text-yellow-900 mb-2">
                      How It Works
                    </h3>
                    <p className="text-yellow-800 text-sm leading-relaxed">
                      A one-time payment of $5 buys Nate a coffee. Simple as that! 
                      We use Stripe for secure and trusted payments.
                    </p>
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* Payment Section */}
          <div className="lg:col-span-1">
            <Card>
              <div className="p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  ☕ Buy Coffee
                </h2>

                <div className="space-y-4">
                  {paymentStatus === 'success' ? (
                    <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-center">
                      <div className="text-4xl mb-2">🎉</div>
                      <p className="text-green-800 text-lg font-medium mb-2">
                        Thank you for the coffee!
                      </p>
                      <p className="text-green-700 text-sm">
                        Nate appreciates your support and will enjoy this caffeine boost while working on RRCompanion.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="text-center p-4 bg-gray-50 border border-gray-200 rounded-lg">
                        <p className="text-gray-600 text-sm font-medium mb-2">
                          Ready to buy Nate coffee?
                        </p>
                        <p className="text-gray-500 text-xs">
                          Your $5 will help keep RRCompanion running
                        </p>
                      </div>
                      
                      <Button
                        className="w-full"
                        onClick={() => setShowPaymentForm(true)}
                      >
                        ☕ Buy Nate Coffee - $5
                      </Button>

                      <div className="text-center text-xs text-gray-500">
                        <p>Secure payment powered by Stripe</p>
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
        title="Buy Nate Coffee"
        size="lg"
      >
        <div className="space-y-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="text-lg font-medium text-blue-900 mb-2">Payment Details</h3>
            <p className="text-blue-800 text-sm">
              You're about to buy Nate a coffee for $5. This helps support RRCompanion and keeps it running for everyone.
            </p>
          </div>

          <Elements stripe={stripePromise}>
            <PaymentForm
              onSuccess={handlePaymentSuccess}
              onCancel={() => setShowPaymentForm(false)}
            />
          </Elements>
        </div>
      </Modal>
    </div>
  );
};

export default Coffee;
