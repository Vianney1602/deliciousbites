import React, { useState } from 'react';
import api from '../api';
import Toast from './Toast';

const RazorpayPayment = ({ orderId, amount, userEmail, userName, onSuccess, onFailure }) => {
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);

  const handlePayment = async () => {
    try {
      setLoading(true);

      // Step 1: Create Razorpay order on backend
      console.log('Creating Razorpay order...');
      const orderResponse = await api.post('/payments/create-order', {
        orderId,
        amount // in rupees
      });

      const { razorpayOrderId, razorpayKeyId } = orderResponse.data;

      console.log('Order created:', razorpayOrderId);

      // Step 2: Initialize Razorpay checkout
      const options = {
        key: razorpayKeyId, // Get from backend for security
        amount: amount * 100, // Convert to paise
        currency: 'INR',
        name: 'Delicious Bites',
        description: `Order #${orderId}`,
        order_id: razorpayOrderId,
        prefill: {
          name: userName,
          email: userEmail
        },
        handler: async (response) => {
          try {
            // Step 3: Verify payment on backend
            console.log('Verifying payment...');
            const verifyResponse = await api.post('/payments/verify-payment', {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              orderId: orderId
            });

            if (verifyResponse.data.success) {
              setToast({ 
                message: '✅ Payment successful! Redirecting...', 
                type: 'success' 
              });
              console.log('Payment verified successfully');
              
              // Call success callback
              if (onSuccess) {
                setTimeout(() => {
                  onSuccess(verifyResponse.data);
                }, 1500);
              }
            }
          } catch (error) {
            console.error('Payment verification error:', error);
            const errorMessage = error.response?.data?.message || 'Payment verification failed';
            setToast({ message: errorMessage, type: 'error' });
            if (onFailure) {
              onFailure(error);
            }
          }
        },
        modal: {
          ondismiss: () => {
            setToast({ 
              message: '❌ Payment cancelled', 
              type: 'error' 
            });
            if (onFailure) {
              onFailure(new Error('Payment cancelled'));
            }
          }
        }
      };

      // Step 4: Open Razorpay checkout
      const razorpay = new window.Razorpay(options);
      razorpay.open();

    } catch (error) {
      console.error('Payment error:', error);
      const errorMessage = error.response?.data?.message || 'Payment initialization failed';
      setToast({ message: errorMessage, type: 'error' });
      if (onFailure) {
        onFailure(error);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      <button
        onClick={handlePayment}
        disabled={loading || !orderId}
        className="
          w-full py-4 rounded-2xl font-semibold font-['Poppins',sans-serif]
          bg-gradient-to-r from-[#F78CA2] to-[#FF6B81]
          text-white shadow-lg shadow-[#F78CA2]/30
          hover:shadow-xl hover:shadow-[#F78CA2]/40 hover:scale-[1.02]
          active:scale-[0.98]
          disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none
          transition-all duration-300
          flex items-center justify-center gap-2
        "
      >
        {loading ? (
          <>
            <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            <span>Processing...</span>
          </>
        ) : (
          <>
            <span>💳 Pay ₹{amount}</span>
          </>
        )}
      </button>
    </>
  );
};

export default RazorpayPayment;
