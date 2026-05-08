# Frontend Integration Guide - Razorpay & Google OAuth

## Part 1: Razorpay Payment Integration

### Step 1: Install Razorpay SDK
Add to your HTML (in `client/index.html`):
```html
<script src="https://checkout.razorpay.com/v1/checkout.js"></script>
```

### Step 2: Create Payment Service
Create `client/src/services/paymentService.js`:
```javascript
import axios from 'axios';

const API_BASE = 'http://localhost:5000/api';

export const createPaymentOrder = async (orderId) => {
  try {
    const response = await axios.post(
      `${API_BASE}/payments/create-order`,
      { orderId },
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      }
    );
    return response.data;
  } catch (error) {
    console.error('Failed to create payment order:', error);
    throw error;
  }
};

export const verifyPayment = async (paymentData) => {
  try {
    const response = await axios.post(
      `${API_BASE}/payments/verify-payment`,
      paymentData,
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      }
    );
    return response.data;
  } catch (error) {
    console.error('Payment verification failed:', error);
    throw error;
  }
};

export const getUserPayments = async () => {
  try {
    const response = await axios.get(
      `${API_BASE}/payments`,
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      }
    );
    return response.data;
  } catch (error) {
    console.error('Failed to fetch payments:', error);
    throw error;
  }
};
```

### Step 3: Create Payment Component
Create `client/src/components/PaymentCheckout.jsx`:
```jsx
import React, { useState } from 'react';
import { createPaymentOrder, verifyPayment } from '../services/paymentService';

const PaymentCheckout = ({ orderId, amount, onSuccess, onError }) => {
  const [loading, setLoading] = useState(false);

  const handlePayment = async () => {
    setLoading(true);
    try {
      // Step 1: Create payment order
      const orderData = await createPaymentOrder(orderId);

      // Step 2: Initialize Razorpay checkout
      const options = {
        key: orderData.key,
        amount: orderData.orderAmount * 100, // Convert to paise
        currency: orderData.currency,
        name: 'Delicious Bites',
        description: `Order #${orderId}`,
        order_id: orderData.orderId,
        handler: async (response) => {
          try {
            // Step 3: Verify payment on backend
            const verifyData = await verifyPayment({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              orderId: orderId
            });

            if (verifyData.success) {
              onSuccess(verifyData);
            } else {
              onError('Payment verification failed');
            }
          } catch (error) {
            console.error('Verification error:', error);
            onError(error.message || 'Payment verification failed');
          }
        },
        prefill: {
          name: localStorage.getItem('userName') || '',
          email: localStorage.getItem('email') || ''
        },
        theme: {
          color: '#8B4513' // Bakery brown color
        },
        modal: {
          ondismiss: () => {
            setLoading(false);
            onError('Payment cancelled');
          }
        }
      };

      // Open Razorpay checkout
      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (error) {
      console.error('Payment error:', error);
      onError(error.message || 'Failed to initiate payment');
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handlePayment}
      disabled={loading}
      className="btn btn-primary w-full"
    >
      {loading ? 'Processing...' : `Pay ₹${amount}`}
    </button>
  );
};

export default PaymentCheckout;
```

### Step 4: Use in Checkout Page
Update `client/src/pages/CheckoutPage.jsx`:
```jsx
import PaymentCheckout from '../components/PaymentCheckout';

const CheckoutPage = () => {
  const handlePaymentSuccess = (data) => {
    // Order is confirmed and paid
    console.log('Payment successful:', data);
    
    // Redirect to success page
    window.location.href = '/payment-success';
  };

  const handlePaymentError = (error) => {
    // Show error toast
    alert(`Payment failed: ${error}`);
  };

  return (
    <div className="checkout-container">
      {/* Other checkout details... */}
      
      <PaymentCheckout
        orderId={orderId}
        amount={totalAmount}
        onSuccess={handlePaymentSuccess}
        onError={handlePaymentError}
      />
    </div>
  );
};
```

---

## Part 2: Google OAuth Integration

### Step 1: Create Google Login Button
Create `client/src/components/GoogleLoginButton.jsx`:
```jsx
import React from 'react';
import { FaGoogle } from 'react-icons/fa'; // or your icon library

const GoogleLoginButton = ({ className = '' }) => {
  const handleGoogleLogin = () => {
    // Redirect to backend OAuth endpoint
    window.location.href = 'http://localhost:5000/api/auth/google';
  };

  return (
    <button
      onClick={handleGoogleLogin}
      className={`btn btn-outline-primary flex items-center gap-2 ${className}`}
    >
      <FaGoogle size={20} />
      Continue with Google
    </button>
  );
};

export default GoogleLoginButton;
```

### Step 2: Handle OAuth Callback
Create `client/src/pages/AuthCallbackPage.jsx`:
```jsx
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const AuthCallbackPage = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    
    const token = params.get('token');
    const email = params.get('email');
    const name = params.get('name');
    const error = params.get('error');

    if (error) {
      alert(`Authentication failed: ${error}`);
      navigate('/login');
      return;
    }

    if (token) {
      // Save authentication details
      localStorage.setItem('token', token);
      localStorage.setItem('email', decodeURIComponent(email));
      localStorage.setItem('userName', decodeURIComponent(name));

      // Redirect to dashboard or home
      navigate('/dashboard');
    } else {
      navigate('/login');
    }
  }, [navigate]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <h2>Authenticating...</h2>
        <p>Please wait while we process your login.</p>
      </div>
    </div>
  );
};

export default AuthCallbackPage;
```

### Step 3: Update Login Page
Update `client/src/pages/LoginPage.jsx`:
```jsx
import GoogleLoginButton from '../components/GoogleLoginButton';
import { useState } from 'react';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleEmailLogin = async (e) => {
    e.preventDefault();
    // Existing email/password login logic
  };

  return (
    <div className="login-container">
      {/* Existing login form */}
      <form onSubmit={handleEmailLogin}>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <button type="submit">Login</button>
      </form>

      {/* Divider */}
      <div className="divider">OR</div>

      {/* Google Login Button */}
      <GoogleLoginButton className="w-full" />
    </div>
  );
};

export default LoginPage;
```

### Step 4: Create User Profile Service
Create `client/src/services/authService.js`:
```javascript
import axios from 'axios';

const API_BASE = 'http://localhost:5000/api';

export const getCurrentUser = async () => {
  try {
    const response = await axios.get(`${API_BASE}/auth/me`);
    return response.data;
  } catch (error) {
    console.error('Failed to fetch user:', error);
    return null;
  }
};

export const logout = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('email');
  localStorage.removeItem('userName');
  window.location.href = '/login';
};

export const getStoredToken = () => {
  return localStorage.getItem('token');
};

export const isAuthenticated = () => {
  return !!localStorage.getItem('token');
};
```

---

## Part 3: Auth Context Setup

Update `client/src/contexts/AuthContext.jsx`:
```jsx
import React, { createContext, useState, useEffect } from 'react';
import { getCurrentUser } from '../services/authService';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if token exists in localStorage
    const token = localStorage.getItem('token');
    
    if (token) {
      // Fetch user details from backend
      getCurrentUser()
        .then(userData => {
          setUser(userData);
        })
        .catch(err => {
          console.error('Failed to fetch user:', err);
          localStorage.removeItem('token');
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, []);

  const value = {
    user,
    loading,
    isAuthenticated: !!user,
    setUser
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
```

---

## Part 4: Protected Route Wrapper

Create `client/src/components/ProtectedRoute.jsx`:
```jsx
import React, { useContext } from 'react';
import { Navigate } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useContext(AuthContext);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  return children;
};

export default ProtectedRoute;
```

---

## Part 5: Router Configuration

Update `client/src/main.jsx`:
```jsx
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import AuthCallbackPage from './pages/AuthCallbackPage';
import CheckoutPage from './pages/CheckoutPage';
import PaymentSuccessPage from './pages/PaymentSuccessPage';
import ProtectedRoute from './components/ProtectedRoute';

const router = createBrowserRouter([
  // ... other routes ...
  
  {
    path: '/auth/callback',
    element: <AuthCallbackPage />
  },
  {
    path: '/checkout',
    element: (
      <ProtectedRoute>
        <CheckoutPage />
      </ProtectedRoute>
    )
  },
  {
    path: '/payment-success',
    element: (
      <ProtectedRoute>
        <PaymentSuccessPage />
      </ProtectedRoute>
    )
  }
]);

export default function App() {
  return (
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  );
}
```

---

## Part 6: Payment Success Page

Create `client/src/pages/PaymentSuccessPage.jsx`:
```jsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const PaymentSuccessPage = () => {
  const navigate = useNavigate();
  const [orderDetails, setOrderDetails] = useState(null);

  useEffect(() => {
    // Fetch latest order details
    const fetchOrderDetails = async () => {
      try {
        const response = await fetch('/api/orders/my-orders', {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        });
        const orders = await response.json();
        if (orders.length > 0) {
          setOrderDetails(orders[0]); // Latest order
        }
      } catch (error) {
        console.error('Failed to fetch order:', error);
      }
    };

    fetchOrderDetails();
  }, []);

  return (
    <div className="payment-success-container text-center py-12">
      <div className="success-icon mb-4">
        <svg className="w-16 h-16 text-green-500 mx-auto" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
        </svg>
      </div>
      
      <h1 className="text-3xl font-bold mb-2">Payment Successful!</h1>
      <p className="text-gray-600 mb-6">Your order has been confirmed and is being prepared.</p>

      {orderDetails && (
        <div className="order-details bg-gray-50 p-6 rounded-lg mb-6 inline-block">
          <p><strong>Order ID:</strong> {orderDetails.id}</p>
          <p><strong>Total Amount:</strong> ₹{orderDetails.totalAmount}</p>
          <p><strong>Status:</strong> {orderDetails.status}</p>
        </div>
      )}

      <div className="actions space-x-4">
        <button
          onClick={() => navigate('/orders')}
          className="btn btn-primary"
        >
          View Orders
        </button>
        <button
          onClick={() => navigate('/menu')}
          className="btn btn-outline"
        >
          Continue Shopping
        </button>
      </div>
    </div>
  );
};

export default PaymentSuccessPage;
```

---

## Part 7: Environment Setup

Make sure your `client/.env` has:
```env
VITE_API_URL=http://localhost:5000/api
VITE_RAZORPAY_KEY=your_razorpay_key_id
```

---

## Testing Checklist

### Razorpay Testing
- [ ] Enter valid test card: 4111111111111111
- [ ] Enter any future expiry date
- [ ] Enter any 3-digit CVV
- [ ] Verify payment appears in database
- [ ] Verify order status changes to "confirmed"
- [ ] Verify success page loads

### Google OAuth Testing
- [ ] Click "Continue with Google"
- [ ] Login with your Google account
- [ ] Verify token received and stored
- [ ] Verify user logged in
- [ ] Test logout functionality
- [ ] Test login again with same account
- [ ] Verify no duplicate user created

---

## Common Issues & Solutions

### Razorpay
```
Issue: "Razorpay is not defined"
Solution: Ensure script tag is loaded before component
  <script src="https://checkout.razorpay.com/v1/checkout.js"></script>
```

```
Issue: "Payment verification failed"
Solution: Check if backend .env has correct RAZORPAY_KEY_SECRET
```

### Google OAuth
```
Issue: "Redirect URI mismatch"
Solution: Update Google Cloud Console with exact callback URL
  http://localhost:5000/api/auth/google/callback
```

```
Issue: "Token not received after OAuth"
Solution: Check if backend is running and GOOGLE_CLIENT_ID is correct
```

---

## Summary

You now have:
- ✅ Razorpay payment integration with checkout
- ✅ Google OAuth login button and callback handling
- ✅ Protected routes for authenticated users
- ✅ Auth context for user state management
- ✅ Payment success page with order details
- ✅ Logout functionality
- ✅ Full end-to-end user authentication

**Next Steps**:
1. Install any missing dependencies in frontend
2. Get Razorpay and Google OAuth credentials
3. Update backend .env
4. Restart backend server
5. Test payment and OAuth flows
6. Deploy when ready!

