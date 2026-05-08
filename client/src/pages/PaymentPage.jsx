import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import CartItem from '../components/CartItem';
import RazorpayPayment from '../components/RazorpayPayment';
import Toast from '../components/Toast';
import api from '../api';

const PaymentPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { items, total, clearCart } = useCart();
  const { user } = useAuth();
  const [toast, setToast] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [orderId, setOrderId] = useState(null);
  const orderCreationRef = React.useRef(false);

  const deliveryDetails = location.state?.deliveryDetails || JSON.parse(sessionStorage.getItem('checkoutData'))?.deliveryDetails || null;
  const paymentMethod = deliveryDetails?.paymentMethod || 'cod';
  const deliveryFee = 50;
  const grandTotal = total + deliveryFee;

  // Protect against accessing payment page without proper data
  useEffect(() => {
    console.log('=== PaymentPage Validation Check ===');
    console.log('User authenticated:', !!user, user?.email);
    console.log('Cart items:', items.length, items);
    console.log('Delivery details from state:', location.state?.deliveryDetails);
    console.log('Delivery details from sessionStorage:', JSON.parse(sessionStorage.getItem('checkoutData'))?.deliveryDetails);
    console.log('Final delivery details:', deliveryDetails);
    
    // Check if user is authenticated
    if (!user) {
      console.log('❌ No user found, redirecting to login');
      navigate('/login', { replace: true });
      return;
    }

    // Check if cart is empty
    if (items.length === 0) {
      console.log('❌ No items in cart, redirecting to cart');
      navigate('/cart', { replace: true });
      return;
    }

    // Check if delivery details have required name field
    if (!deliveryDetails || !deliveryDetails.name) {
      console.log('❌ Missing delivery details or name, redirecting to checkout');
      console.log('Delivery details value:', deliveryDetails);
      navigate('/checkout', { replace: true });
      return;
    }

    console.log('✅ PaymentPage validation passed');
    // Clear sessionStorage after successful validation
    sessionStorage.removeItem('checkoutData');
  }, [items.length, user, navigate]);

  // Create order ONCE when page loads (for both COD and Razorpay)
  useEffect(() => {
    if (!orderCreationRef.current && !orderId && user && items.length > 0 && deliveryDetails?.name) {
      orderCreationRef.current = true;
      createOrder();
    }
  }, [user, items.length]);

  const createOrder = async () => {
    try {
      console.log('=== Creating Order ===');
      console.log('User data:', user);
      console.log('Token:', localStorage.getItem('token') ? 'EXISTS' : 'MISSING');
      console.log('Items:', items);
      console.log('Delivery details:', deliveryDetails);
      console.log('Request payload:', { 
        items, 
        deliveryDetails, 
        totalAmount: grandTotal, 
        paymentStatus: 'pending', 
        paymentMethod 
      });
      
      const orderResponse = await api.post('/orders', {
        items: items,
        deliveryDetails: deliveryDetails,
        totalAmount: grandTotal,
        paymentStatus: 'pending',
        paymentMethod: paymentMethod
      });

      if (orderResponse.status === 201) {
        const orderData = orderResponse.data;
        console.log('✅ Order created successfully:', orderData);
        setOrderId(orderData.id);
      }
    } catch (err) {
      console.error('❌ Order creation error:', err);
      if (err.response) {
        console.error('Response status:', err.response.status);
        console.error('Response data:', err.response.data);
        console.error('Response headers:', err.response.headers);
      }
      setToast({ message: '❌ Failed to create order. Please try again.', type: 'error' });
    }
  };

  const handleCODOrder = async () => {
    if (isProcessing || !orderId) return;
    setIsProcessing(true);

    try {
      // Order is already created, just confirm it
      clearCart();
      setToast({ message: '✅ Order placed successfully!', type: 'success' });
      setTimeout(() => {
        navigate('/payment-success', {
          state: {
            id: orderId,
            orderId: orderId,
            paymentMethod: 'cod',
            items,
            total: grandTotal,
            deliveryDetails
          },
          replace: true
        });
      }, 500);
    } catch (error) {
      console.error('Order completion error:', error);
      setToast({ message: '❌ Failed to complete order. Please try again.', type: 'error' });
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePaymentSuccess = async (paymentData) => {
    // Clear cart and redirect to success page
    clearCart();
    navigate('/payment-success', {
      state: {
        ...paymentData,
        paymentMethod: 'online',
        items,
        total: grandTotal,
        deliveryDetails
      },
      replace: true
    });
  };

  const handlePaymentFailure = (error) => {
    console.error('Payment failed:', error);
    setToast({ message: '❌ Payment failed. Please try again.', type: 'error' });
  };

  return (
    <main className="max-w-4xl mx-auto px-4 py-8 md:py-12">
      {toast && <Toast message={toast.message} type={toast.type} />}
      
      {/* Header */}
      <div className="mb-8 animate-fadeIn">
        <h1 className="text-3xl md:text-4xl font-bold text-[#4A2C2A] font-['Pacifico',cursive] mb-2">
          Complete Payment
        </h1>
        <p className="text-[#4A2C2A]/60 font-['Poppins',sans-serif]">
          Review your order and complete payment
        </p>
      </div>

      <div className="space-y-6">
        {/* Order Summary */}
        <div className="bg-white rounded-3xl border-2 border-[#FFD6DF] p-6 animate-fadeIn">
          <h2 className="text-xl font-bold text-[#4A2C2A] font-['Poppins',sans-serif] mb-4">
            Order Summary
          </h2>
          <div className="space-y-3">
            {items.map(item => (
              <CartItem key={item.product.id} item={item} compact={true} />
            ))}
          </div>
        </div>

        {/* Delivery Details */}
        {deliveryDetails.name && (
          <div className="bg-white rounded-3xl border-2 border-[#FFD6DF] p-6 animate-fadeIn">
            <h2 className="text-xl font-bold text-[#4A2C2A] font-['Poppins',sans-serif] mb-4">
              Delivery Address
            </h2>
            <div className="space-y-2 text-[#4A2C2A]/70 font-['Poppins',sans-serif]">
              <p><span className="font-semibold">Name:</span> {deliveryDetails.name}</p>
              <p><span className="font-semibold">Phone:</span> {deliveryDetails.phone}</p>
              <p><span className="font-semibold">Address:</span> {deliveryDetails.address}</p>
              <p><span className="font-semibold">City:</span> {deliveryDetails.city}</p>
              <p><span className="font-semibold">Pincode:</span> {deliveryDetails.pincode}</p>
            </div>
          </div>
        )}

        {/* Payment Summary */}
        <div className="bg-gradient-to-br from-[#FFF7F9] to-[#FFD6DF]/30 rounded-3xl border-2 border-[#FFD6DF] p-6 animate-fadeIn">
          <h2 className="text-xl font-bold text-[#4A2C2A] font-['Poppins',sans-serif] mb-4">
            Payment Details
          </h2>
          <div className="space-y-3">
            <div className="flex justify-between text-[#4A2C2A]/70 font-['Poppins',sans-serif]">
              <span>Subtotal</span>
              <span>₹{total.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-[#4A2C2A]/70 font-['Poppins',sans-serif]">
              <span>Delivery Fee</span>
              <span>₹{deliveryFee.toFixed(2)}</span>
            </div>
            <div className="border-t-2 border-[#FFD6DF] pt-3 flex justify-between text-2xl font-bold text-[#4A2C2A] font-['Poppins',sans-serif]">
              <span>Total Amount</span>
              <span className="text-[#F78CA2]">₹{grandTotal.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Payment Method */}
        <div className="bg-white rounded-3xl border-2 border-[#FFD6DF] p-6 animate-fadeIn">
          <h2 className="text-xl font-bold text-[#4A2C2A] font-['Poppins',sans-serif] mb-4">
            Payment Method
          </h2>
          <div className="bg-gradient-to-r from-[#FFF7F9] to-[#FFD6DF]/30 rounded-2xl p-4 flex items-center gap-3">
            <span className="text-3xl">{paymentMethod === 'cod' ? '💵' : '💳'}</span>
            <div>
              <p className="font-semibold text-[#4A2C2A] font-['Poppins',sans-serif]">
                {paymentMethod === 'cod' ? 'Cash on Delivery' : 'Secure Online Payment'}
              </p>
              <p className="text-sm text-[#4A2C2A]/60 font-['Poppins',sans-serif]">
                {paymentMethod === 'cod' ? 'Pay when you receive your order' : 'Card / UPI / Net Banking'}
              </p>
            </div>
          </div>
        </div>

        {/* Payment Button */}
        {paymentMethod === 'cod' ? (
          // Cash on Delivery Button
          <button
            onClick={handleCODOrder}
            disabled={isProcessing || !orderId}
            className="
              w-full py-5 rounded-2xl font-bold text-lg font-['Poppins',sans-serif]
              bg-gradient-to-r from-[#F78CA2] to-[#FF6B81]
              text-white shadow-xl shadow-[#F78CA2]/30
              hover:shadow-2xl hover:shadow-[#F78CA2]/40 hover:scale-[1.02]
              active:scale-[0.98]
              transition-all duration-300
              flex items-center justify-center gap-3
              disabled:opacity-60 disabled:cursor-not-allowed
            "
          >
            <span>{isProcessing ? '⏳' : '💵'}</span>
            <span>{isProcessing ? 'Processing...' : 'Confirm Order (Pay on Delivery)'}</span>
          </button>
        ) : orderId ? (
          // Razorpay Payment Button
          <RazorpayPayment
            orderId={orderId}
            amount={Math.round(grandTotal)}
            userEmail={user?.email}
            userName={user?.name}
            onSuccess={handlePaymentSuccess}
            onFailure={handlePaymentFailure}
          />
        ) : (
          // Loading state
          <button disabled className="w-full py-5 rounded-2xl font-bold text-lg bg-gray-300 text-gray-500 cursor-not-allowed">
            ⏳ Preparing payment...
          </button>
        )}

        {/* Security Notice */}
        <div className="text-center text-xs text-[#4A2C2A]/50 font-['Poppins',sans-serif]">
          <p>🔒 Your payment information is secure and encrypted</p>
        </div>
      </div>
    </main>
  );
};

export default PaymentPage;
