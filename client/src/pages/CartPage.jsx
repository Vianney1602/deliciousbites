import React, { useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import CartItem from '../components/CartItem';

const CartPage = () => {
  const { items, total, clearCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  const deliveryFee = items.length > 0 ? 50 : 0;
  const grandTotal = total + deliveryFee;

  const handleCheckout = useCallback(() => {
    if (!user) {
      // Store the intended destination in sessionStorage
      sessionStorage.setItem('returnTo', '/checkout');
      navigate('/login', { replace: false });
      return;
    }
    navigate('/checkout', { replace: false });
  }, [user, navigate]);

  if (items.length === 0) {
    return (
      <main className="min-h-[70vh] flex items-center justify-center px-4">
        <div className="text-center space-y-6 max-w-md animate-fadeIn">
          <div className="text-8xl mb-4">🛒</div>
          <h1 className="text-3xl font-bold text-[#4A2C2A] font-['Pacifico',cursive]">
            Your Cart is Empty
          </h1>
          <p className="text-[#4A2C2A]/60 font-['Poppins',sans-serif]">
            Looks like you haven't added any delicious treats yet. Browse our menu and discover amazing bakery items!
          </p>
          <Link 
            to="/menu"
            className="
              inline-block px-8 py-4 rounded-2xl font-semibold font-['Poppins',sans-serif]
              bg-gradient-to-r from-[#F78CA2] to-[#FF6B81]
              text-white shadow-lg shadow-[#F78CA2]/30
              hover:shadow-xl hover:shadow-[#F78CA2]/40 hover:scale-[1.02]
              transition-all duration-300
            "
          >
            Browse Menu
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="max-w-7xl mx-auto px-4 py-8 md:py-12">
      {/* Header */}
      <div className="mb-8 animate-fadeIn">
        <h1 className="text-3xl md:text-4xl font-bold text-[#4A2C2A] font-['Pacifico',cursive] mb-2">
          Shopping Cart
        </h1>
        <p className="text-[#4A2C2A]/60 font-['Poppins',sans-serif]">
          {items.length} {items.length === 1 ? 'item' : 'items'} in your cart
        </p>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* LEFT SIDE - Cart Items */}
        <div className="lg:col-span-2 space-y-4 animate-fadeIn">
          {items.map(item => (
            <CartItem key={item.product.id} item={item} />
          ))}

          {/* Clear Cart Button */}
          <button
            onClick={clearCart}
            className="
              w-full mt-4 py-3 rounded-2xl font-semibold font-['Poppins',sans-serif]
              border-2 border-red-300 text-red-600
              hover:bg-red-50 transition-all duration-300
            "
          >
            Clear Cart
          </button>
        </div>

        {/* RIGHT SIDE - Cart Summary */}
        <div className="lg:col-span-1 animate-fadeIn" style={{ animationDelay: '0.1s' }}>
          <div className="bg-white rounded-3xl border-2 border-[#FFD6DF] p-6 sticky top-24 space-y-6">
            <h2 className="text-xl font-bold text-[#4A2C2A] font-['Poppins',sans-serif]">
              Cart Summary
            </h2>

            {/* Price Breakdown */}
            <div className="space-y-3 py-4 border-y-2 border-[#FFD6DF]">
              <div className="flex justify-between text-[#4A2C2A]/70 font-['Poppins',sans-serif]">
                <span>Subtotal</span>
                <span>₹{total.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-[#4A2C2A]/70 font-['Poppins',sans-serif]">
                <span>Delivery Fee</span>
                <span>₹{deliveryFee.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-xl font-bold text-[#4A2C2A] font-['Poppins',sans-serif]">
                <span>Total</span>
                <span className="text-[#F78CA2]">₹{grandTotal.toFixed(2)}</span>
              </div>
            </div>

            {/* Delivery Info */}
            <div className="bg-gradient-to-r from-[#FFF7F9] to-[#FFD6DF]/30 rounded-2xl p-4">
              <div className="flex items-start gap-3">
                <span className="text-xl">🚚</span>
                <div>
                  <p className="font-semibold text-sm text-[#4A2C2A] font-['Poppins',sans-serif]">
                    Free Delivery
                  </p>
                  <p className="text-xs text-[#4A2C2A]/60 mt-1 font-['Poppins',sans-serif]">
                    On orders above ₹500
                  </p>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              <button
                onClick={handleCheckout}
                className="
                  w-full py-4 rounded-2xl font-bold font-['Poppins',sans-serif]
                  bg-gradient-to-r from-[#F78CA2] to-[#FF6B81]
                  text-white shadow-lg shadow-[#F78CA2]/30
                  hover:shadow-xl hover:shadow-[#F78CA2]/40 hover:scale-[1.02]
                  active:scale-[0.98]
                  transition-all duration-300
                  flex items-center justify-center gap-2
                "
              >
                <span>Proceed to Checkout</span>
                <span>→</span>
              </button>

              <Link
                to="/menu"
                className="
                  w-full block text-center py-3 rounded-2xl font-semibold font-['Poppins',sans-serif]
                  border-2 border-[#F78CA2] text-[#F78CA2]
                  hover:bg-[#F78CA2] hover:text-white
                  transition-all duration-300
                "
              >
                Continue Shopping
              </Link>
            </div>

            {/* Trust Badges */}
            <div className="pt-4 border-t-2 border-[#FFD6DF]">
              <div className="flex items-center justify-around text-xs text-[#4A2C2A]/60 font-['Poppins',sans-serif]">
                <div className="text-center">
                  <div className="text-2xl mb-1">🔒</div>
                  <div>Secure</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl mb-1">✓</div>
                  <div>Verified</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl mb-1">⚡</div>
                  <div>Fast</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
};

export default CartPage;
