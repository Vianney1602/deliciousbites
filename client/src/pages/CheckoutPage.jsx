import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import CartItem from '../components/CartItem';
import InputField from '../components/InputField';

const CheckoutPage = () => {
  const { items, total } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  // Redirect to login if not authenticated
  React.useEffect(() => {
    if (!user) {
      sessionStorage.setItem('returnTo', '/checkout');
      navigate('/login', { replace: true });
    }
  }, [user, navigate]);

  // Redirect to cart if no items
  React.useEffect(() => {
    if (items.length === 0 && user) {
      navigate('/cart', { replace: true });
    }
  }, [items.length, user, navigate]);

  // If not authenticated or no items, don't render form yet
  if (!user || items.length === 0) {
    return null;
  }

  const [deliveryDetails, setDeliveryDetails] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: '',
    address: '',
    city: '',
    pincode: ''
  });
  const [paymentMethod, setPaymentMethod] = useState('cod');
  const [errors, setErrors] = useState({});

  const deliveryFee = 50;
  const grandTotal = total + deliveryFee;

  const validateForm = () => {
    const newErrors = {};

    if (!deliveryDetails.name.trim()) {
      newErrors.name = 'Full name is required';
    }

    if (!deliveryDetails.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[\w\.-]+@[\w\.-]+\.\w+$/.test(deliveryDetails.email)) {
      newErrors.email = 'Please enter a valid email';
    }

    if (!deliveryDetails.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    } else if (!/^[\d\s\-\+\(\)]{10,}$/.test(deliveryDetails.phone)) {
      newErrors.phone = 'Please enter a valid phone number';
    }

    if (!deliveryDetails.address.trim()) {
      newErrors.address = 'Delivery address is required';
    }

    if (!deliveryDetails.city.trim()) {
      newErrors.city = 'City is required';
    }

    if (!deliveryDetails.pincode.trim()) {
      newErrors.pincode = 'Pincode is required';
    } else if (!/^\d{6}$/.test(deliveryDetails.pincode)) {
      newErrors.pincode = 'Pincode must be 6 digits';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (field) => (e) => {
    setDeliveryDetails({ ...deliveryDetails, [field]: e.target.value });
    if (errors[field]) {
      setErrors({ ...errors, [field]: '' });
    }
  };

  const handlePlaceOrder = () => {
    console.log('=== Place Order Button Clicked ===');
    console.log('Items in cart:', items.length, items);
    console.log('Delivery details:', deliveryDetails);
    console.log('Payment method:', paymentMethod);
    
    if (items.length === 0) {
      console.log('❌ No items in cart, cannot place order');
      navigate('/cart');
      return;
    }

    if (!validateForm()) {
      console.log('❌ Form validation failed');
      console.log('Errors:', errors);
      return;
    }

    console.log('✅ Form validated successfully');
    const stateToPass = { 
      deliveryDetails: { ...deliveryDetails, paymentMethod }
    };
    console.log('Navigating to /payment with state:', stateToPass);
    
    // Store in sessionStorage as backup
    sessionStorage.setItem('checkoutData', JSON.stringify(stateToPass));
    console.log('Stored in sessionStorage');

    // Navigate to payment page with delivery details
    navigate('/payment', { 
      state: stateToPass,
      replace: false
    });
    console.log('Navigation call completed');
  };

  return (
    <main className="max-w-7xl mx-auto px-4 py-8 md:py-12 page-enter">
      {/* Header */}
      <div className="mb-8 animate-slideUp">
        <h1 className="text-3xl md:text-4xl font-bold text-[#4A2C2A] font-['Pacifico',cursive] mb-2">
          Checkout
        </h1>
        <p className="text-[#4A2C2A]/60 font-['Poppins',sans-serif]">
          Complete your order by providing delivery details
        </p>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* LEFT SIDE - Cart Summary */}
        <div className="lg:col-span-1 space-y-4 animate-slideUp delay-100">
          <div className="bg-white rounded-3xl border-2 border-[#FFD6DF] p-6 sticky top-24">
            <h2 className="text-xl font-bold text-[#4A2C2A] font-['Poppins',sans-serif] mb-4">
              Order Summary
            </h2>
            <div className="space-y-3 mb-4">
              {items.map(item => (
                <CartItem key={item.product.id} item={item} compact={true} />
              ))}
            </div>
            
            <div className="border-t-2 border-[#FFD6DF] pt-4 space-y-2">
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
          </div>
        </div>

        {/* RIGHT SIDE - Delivery Form */}
        <div className="lg:col-span-2 space-y-6 animate-slideUp delay-200">
          <div className="bg-white rounded-3xl border-2 border-[#FFD6DF] p-8">
            <h2 className="text-2xl font-bold text-[#4A2C2A] font-['Pacifico',cursive] mb-6">
              Delivery Details
            </h2>
            
            <div className="space-y-4">
              <InputField
                label="Full Name"
                type="text"
                value={deliveryDetails.name}
                onChange={handleChange('name')}
                error={errors.name}
                icon="👤"
                required
              />

              <InputField
                label="Email Address"
                type="email"
                value={deliveryDetails.email}
                onChange={handleChange('email')}
                error={errors.email}
                icon="📧"
                required
              />

              <InputField
                label="Phone Number"
                type="tel"
                value={deliveryDetails.phone}
                onChange={handleChange('phone')}
                error={errors.phone}
                icon="📱"
                required
                placeholder="+91 98765 43210"
              />

              <InputField
                label="Delivery Address"
                type="text"
                value={deliveryDetails.address}
                onChange={handleChange('address')}
                error={errors.address}
                icon="🏠"
                required
                placeholder="House no, Street, Locality"
              />

              <div className="grid md:grid-cols-2 gap-4">
                <InputField
                  label="City"
                  type="text"
                  value={deliveryDetails.city}
                  onChange={handleChange('city')}
                  error={errors.city}
                  icon="🏙️"
                  required
                />

                <InputField
                  label="Pincode"
                  type="text"
                  value={deliveryDetails.pincode}
                  onChange={handleChange('pincode')}
                  error={errors.pincode}
                  icon="📮"
                  required
                  placeholder="123456"
                />
              </div>
            </div>
          </div>

          {/* Payment Method */}
          <div className="bg-white rounded-3xl border-2 border-[#FFD6DF] p-8">
            <h2 className="text-2xl font-bold text-[#4A2C2A] font-['Pacifico',cursive] mb-6">
              Payment Method
            </h2>
            
            <div className="space-y-3">
              <label className="flex items-center gap-4 p-4 rounded-2xl border-2 border-[#FFD6DF] cursor-pointer hover:border-[#F78CA2] transition-colors">
                <input
                  type="radio"
                  name="paymentMethod"
                  value="cod"
                  checked={paymentMethod === 'cod'}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-5 h-5 text-[#F78CA2] focus:ring-[#F78CA2]"
                />
                <div className="flex-1">
                  <p className="font-semibold text-[#4A2C2A] font-['Poppins',sans-serif]">💵 Cash on Delivery</p>
                  <p className="text-sm text-[#4A2C2A]/60 font-['Poppins',sans-serif]">Pay when you receive your order</p>
                </div>
              </label>

              <label className="flex items-center gap-4 p-4 rounded-2xl border-2 border-[#FFD6DF] cursor-pointer hover:border-[#F78CA2] transition-colors">
                <input
                  type="radio"
                  name="paymentMethod"
                  value="online"
                  checked={paymentMethod === 'online'}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-5 h-5 text-[#F78CA2] focus:ring-[#F78CA2]"
                />
                <div className="flex-1">
                  <p className="font-semibold text-[#4A2C2A] font-['Poppins',sans-serif]">💳 Online Payment</p>
                  <p className="text-sm text-[#4A2C2A]/60 font-['Poppins',sans-serif]">Card / UPI / Net Banking</p>
                </div>
              </label>
            </div>
          </div>

          {/* Place Order Button */}
          <button
            onClick={handlePlaceOrder}
            className="
              w-full py-5 rounded-2xl font-bold text-lg font-['Poppins',sans-serif]
              bg-gradient-to-r from-[#F78CA2] to-[#FF6B81]
              text-white shadow-xl shadow-[#F78CA2]/30
              hover:shadow-2xl hover:shadow-[#F78CA2]/40 hover:scale-[1.02]
              active:scale-[0.98] btn-press animate-pulseGlow
              transition-all duration-300
              flex items-center justify-center gap-3
            "
          >
            <span>Place Order</span>
            <span>→</span>
          </button>
        </div>
      </div>
    </main>
  );
};

export default CheckoutPage;
