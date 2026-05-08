# Razorpay & Google OAuth Integration Guide

## Overview
Your Delicious Bites application now has payment gateway (Razorpay) and social authentication (Google OAuth 2.0) integration implemented. Follow these steps to complete the setup.

---

## Part 1: Razorpay Payment Gateway Setup

### Step 1: Create Razorpay Account
1. Go to [https://razorpay.com](https://razorpay.com)
2. Click **"Sign up"** and create your account
3. Complete email verification and KYC (Know Your Customer) process
4. Once verified, you'll be able to access your dashboard

### Step 2: Get Razorpay API Keys
1. Login to your Razorpay Dashboard
2. Navigate to **Settings → API Keys**
3. You'll see:
   - **Key ID** (public key) - safe to expose to frontend
   - **Key Secret** (private key) - keep this secret!
4. Copy both keys

### Step 3: Update Environment Variables
Edit `server/.env` and replace placeholders:

```env
RAZORPAY_KEY_ID=rzp_live_your_key_id_here
RAZORPAY_KEY_SECRET=your_key_secret_here
```

### Step 4: API Endpoints Created

#### Create Payment Order
**POST** `/api/payments/create-order`
```javascript
Request body:
{
  "orderId": 1
}

Response:
{
  "orderId": "order_1234567890abcdef",
  "orderAmount": 299.99,
  "currency": "INR",
  "key": "rzp_live_your_key_id_here"
}
```

#### Verify Payment
**POST** `/api/payments/verify-payment`
```javascript
Request body:
{
  "razorpay_order_id": "order_1234567890abcdef",
  "razorpay_payment_id": "pay_1234567890abcdef",
  "razorpay_signature": "signature_hash",
  "orderId": 1
}

Response:
{
  "success": true,
  "message": "Payment verified successfully",
  "paymentId": "pay_1234567890abcdef",
  "orderId": "1"
}
```

#### Get Payment Details
**GET** `/api/payments/:paymentId`
- Returns payment transaction details
- Requires authentication

#### Get User's Payments
**GET** `/api/payments`
- Returns all payments for the authenticated user
- Requires authentication

### Step 5: Database Updates on Payment
When payment is verified:
- ✅ Payment record created in `Payment` table
- ✅ Order status updated to "confirmed"
- ✅ Payment status updated to "completed"
- ✅ Order timeline entry created with payment confirmation

---

## Part 2: Google OAuth 2.0 Setup

### Step 1: Create Google Cloud Project
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Click on the project dropdown at the top
3. Click **"New Project"**
4. Enter project name: "Delicious Bites"
5. Click **Create**

### Step 2: Enable Google+ API
1. In the left sidebar, click **APIs & Services → Library**
2. Search for **"Google+ API"**
3. Click on it and press **Enable**

### Step 3: Create OAuth 2.0 Credentials
1. Go to **APIs & Services → Credentials**
2. Click **Create Credentials → OAuth client ID**
3. If prompted, configure OAuth consent screen first:
   - User Type: External
   - Add app information (name, email, logo)
   - Add required scopes: email, profile
4. For OAuth client ID:
   - Application type: **Web application**
   - Name: "Delicious Bites Web"
   - Authorized JavaScript origins:
     ```
     http://localhost:5000
     http://localhost:5173
     https://yourdomain.com (when deployed)
     ```
   - Authorized redirect URIs:
     ```
     http://localhost:5000/api/auth/google/callback
     https://yourdomain.com/api/auth/google/callback (when deployed)
     ```
5. Click **Create**
6. Copy your:
   - **Client ID**
   - **Client Secret**

### Step 4: Update Environment Variables
Edit `server/.env`:

```env
GOOGLE_CLIENT_ID=your_client_id_here.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_client_secret_here
GOOGLE_CALLBACK_URL=http://localhost:5000/api/auth/google/callback
FRONTEND_URL=http://localhost:5173
```

### Step 5: OAuth Routes Created

#### Initiate Google Login
**GET** `/api/auth/google`
- Redirects user to Google login page
- After successful login, redirects to `/api/auth/google/callback`

#### Google OAuth Callback
**GET** `/api/auth/google/callback`
- Handles Google's response
- Auto-creates user if first-time login
- Links Google account if email already exists
- Returns JWT token via redirect to frontend

Example redirect:
```
http://localhost:5173?token=eyJhbGc...&email=user@gmail.com&name=User%20Name
```

#### Get Current User
**GET** `/api/auth/me`
```javascript
Response:
{
  "id": 1,
  "name": "User Name",
  "email": "user@gmail.com",
  "role": "customer"
}
```

---

## Part 3: Frontend Integration

### For Razorpay Payment

1. **Create payment order on checkout:**
```javascript
const response = await fetch('/api/payments/create-order', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ orderId: orderData.id })
});
const { orderId, orderAmount, key } = await response.json();
```

2. **Open Razorpay checkout:**
```javascript
const options = {
  key: key,
  amount: orderAmount * 100,
  currency: 'INR',
  name: 'Delicious Bites',
  description: 'Order Payment',
  order_id: orderId,
  handler: async (response) => {
    // Verify payment on backend
    const verifyResponse = await fetch('/api/payments/verify-payment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        razorpay_order_id: response.razorpay_order_id,
        razorpay_payment_id: response.razorpay_payment_id,
        razorpay_signature: response.razorpay_signature,
        orderId: orderData.id
      })
    });
    
    if (verifyResponse.ok) {
      // Payment successful
      alert('Payment successful!');
      window.location.href = '/payment-success';
    }
  }
};

const rzp = new Razorpay(options);
rzp.open();
```

### For Google OAuth

1. **Add Google login button:**
```javascript
<a href="http://localhost:5000/api/auth/google" className="btn btn-primary">
  Login with Google
</a>
```

2. **Handle callback from frontend:**
```javascript
// After redirect from OAuth, extract token from URL
const params = new URLSearchParams(window.location.search);
const token = params.get('token');
const email = params.get('email');

if (token) {
  localStorage.setItem('token', token);
  localStorage.setItem('email', email);
  // Redirect to dashboard
  window.location.href = '/dashboard';
}
```

---

## Part 4: Testing Razorpay

### Test Mode
Razorpay has a test mode for development:
- Use **Razorpay Test Credentials** from your dashboard
- Test cards are provided on Razorpay docs

### Test Card Numbers
```
Visa:          4111 1111 1111 1111
MasterCard:    5555 5555 5555 4444
Expiry:        Any future date (MM/YY)
CVV:           Any 3 digits
```

### Webhook Configuration (Optional)
To receive payment notifications:
1. Go to Razorpay Dashboard → Settings → Webhooks
2. Add webhook URL: `https://yourdomain.com/api/payments/webhook`
3. Select events: `payment.authorized`, `payment.failed`

---

## Part 5: Testing Google OAuth

### Local Testing
With the credentials configured, you can test at:
```
http://localhost:5000/api/auth/google
```

### First-time Users
1. Click "Login with Google"
2. Google asks for permission
3. New user account created automatically
4. Redirected to frontend with token

### Existing Users
1. Same Google account logs in
2. No new account created
3. Redirected with token

---

## Part 6: Complete Environment Variables

Your `server/.env` should now look like:

```env
# Database
DATABASE_URL="postgresql://user:password@host/dbname?sslmode=require"

# Server Config
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:5173

# JWT
JWT_SECRET=your_jwt_secret_key_change_this_in_production

# Razorpay Payment Gateway
RAZORPAY_KEY_ID=rzp_live_your_key_id_here
RAZORPAY_KEY_SECRET=your_key_secret_here

# Google OAuth
GOOGLE_CLIENT_ID=your_client_id_here.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_client_secret_here
GOOGLE_CALLBACK_URL=http://localhost:5000/api/auth/google/callback
```

---

## Part 7: Server Restart Required

After updating `.env` file, restart your server:

```bash
# Kill current server (Ctrl+C)
# Then restart
npm run dev
```

---

## Troubleshooting

### Razorpay Issues
- **"Invalid key_id"**: Check if RAZORPAY_KEY_ID is correct and not blank
- **"Payment verification failed"**: Ensure RAZORPAY_KEY_SECRET matches your dashboard
- **"Order not found"**: Verify orderId exists in database

### Google OAuth Issues
- **"Invalid client"**: Check GOOGLE_CLIENT_ID spelling
- **"Redirect URI mismatch"**: Ensure callback URL matches Google Cloud settings
- **"User creation failed"**: Check if email already exists in database

### General Issues
- Ensure both servers are running:
  ```
  Backend: http://localhost:5000
  Frontend: http://localhost:5173
  ```
- Check browser console for CORS errors
- Verify network tab for API response errors

---

## Next Steps

1. ✅ Get Razorpay credentials (steps 1-3)
2. ✅ Get Google OAuth credentials (steps 1-3)
3. ✅ Update `.env` file with real credentials
4. ✅ Restart backend server
5. ✅ Test Razorpay payment flow
6. ✅ Test Google OAuth login
7. Frontend: Add Razorpay checkout form
8. Frontend: Add Google OAuth button
9. Test end-to-end payment and authentication
10. Deploy when ready

---

## Files Created/Modified

### New Files
- `server/src/routes/payments.js` - Razorpay payment routes
- `server/src/config/googleAuth.js` - Google OAuth strategy config

### Modified Files
- `server/src/index.js` - Added passport initialization and payment routes
- `server/src/routes/auth.js` - Added Google OAuth routes
- `server/.env` - Added payment and OAuth credentials

### API Routes Summary
```
POST   /api/payments/create-order           - Create Razorpay order
POST   /api/payments/verify-payment         - Verify payment signature
GET    /api/payments/:paymentId             - Get payment details
GET    /api/payments                         - Get user's payments
GET    /api/auth/google                     - Initiate Google login
GET    /api/auth/google/callback            - Google OAuth callback
GET    /api/auth/me                         - Get current user
```

---

## Database Schema Updates

### Payment Table
Used to store all payment transactions:
- transactionId (Razorpay payment ID)
- orderId (linked order)
- userId (customer)
- amount (payment amount)
- paymentMethod (card, wallet, etc.)
- paymentGateway (razorpay, stripe, etc.)
- status (completed, pending, failed)
- refundAmount (if applicable)
- createdAt, updatedAt timestamps

### Order Table Updates
- paymentStatus: "pending" → "completed" after successful payment
- status: "confirmed" after payment
- items stored as JSON string (no change)

---

Good luck with your Razorpay and Google OAuth integration! 🚀
