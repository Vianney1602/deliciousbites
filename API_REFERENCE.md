# API Reference - Razorpay & Google OAuth

## Payment Gateway APIs

### 1. Create Payment Order
```
POST /api/payments/create-order
Headers: Authorization: Bearer {token}
Body: {
  "orderId": 1
}

Response: {
  "orderId": "order_1234567890abcdef",
  "orderAmount": 299.99,
  "currency": "INR",
  "key": "rzp_live_xxxx"
}

Status: 201 Success | 400 Bad Request | 404 Not Found | 500 Server Error
```

### 2. Verify Payment
```
POST /api/payments/verify-payment
Headers: Authorization: Bearer {token}
Body: {
  "razorpay_order_id": "order_1234567890abcdef",
  "razorpay_payment_id": "pay_1234567890abcdef",
  "razorpay_signature": "signature_hash",
  "orderId": 1
}

Response: {
  "success": true,
  "message": "Payment verified successfully",
  "paymentId": "pay_1234567890abcdef",
  "orderId": "1"
}

Status: 200 Success | 400 Bad Request | 500 Server Error
```

### 3. Get Payment Details
```
GET /api/payments/:paymentId
Headers: Authorization: Bearer {token}

Response: {
  "id": 1,
  "transactionId": "pay_1234567890abcdef",
  "orderId": 1,
  "userId": 5,
  "amount": 299.99,
  "paymentMethod": "card",
  "paymentGateway": "razorpay",
  "status": "completed",
  "refundAmount": 0,
  "createdAt": "2025-02-27T10:30:00Z",
  "updatedAt": "2025-02-27T10:30:00Z"
}

Status: 200 Success | 404 Not Found | 403 Unauthorized | 500 Server Error
```

### 4. Get User's Payments
```
GET /api/payments
Headers: Authorization: Bearer {token}

Response: [
  {
    "id": 1,
    "transactionId": "pay_1234567890abcdef",
    "orderId": 1,
    "amount": 299.99,
    "status": "completed",
    "createdAt": "2025-02-27T10:30:00Z"
  },
  ...
]

Status: 200 Success | 500 Server Error
```

---

## Authentication APIs

### 5. Initiate Google Login
```
GET /api/auth/google

Action: Redirects to Google login page
Callback: /api/auth/google/callback

No request body needed
```

### 6. Google OAuth Callback
```
GET /api/auth/google/callback?code=...&state=...

Action: Handles Google response
- Creates new user if not exists
- Links Google account to existing user if email matches
- Returns JWT token

Redirect: 
http://localhost:5173?token=eyJhbGc...&email=user@gmail.com&name=User%20Name

OR on error:
http://localhost:5173/login?error=auth_failed
```

### 7. Get Current User
```
GET /api/auth/me

Response: {
  "id": 1,
  "name": "John Doe",
  "email": "john@gmail.com",
  "role": "customer"
}

Status: 200 Success | 401 Unauthorized
```

---

## Error Responses

### Payment Errors
```javascript
// Invalid order ID
{
  "message": "Order ID is required",
  "status": 400
}

// Order not found
{
  "message": "Order not found",
  "status": 404
}

// Verification failed
{
  "message": "Payment verification failed",
  "success": false,
  "status": 400
}

// Razorpay error
{
  "message": "Failed to create payment order",
  "status": 500
}
```

### Auth Errors
```javascript
// Auth failed
{
  "message": "Not authenticated",
  "status": 401
}

// User not found
{
  "message": "User not found",
  "status": 404
}
```

---

## Payment Status Lifecycle

```
Order Created → Payment Created (status: pending)
                    ↓
           User Initiates Payment
                    ↓
         Razorpay Order Generated
                    ↓
        User Completes Payment (on Razorpay UI)
                    ↓
        Backend Verifies Signature
                    ↓
        Payment Status: completed ✅
        Order Status: confirmed ✅
        OrderTimeline Entry Created
```

---

## Database Records Created

### Payment Table Entry
```javascript
{
  id: 1,
  transactionId: "pay_...",
  orderId: 1,
  userId: 5,
  amount: 299.99,
  paymentMethod: "card",
  paymentGateway: "razorpay",
  status: "completed",
  refundAmount: 0.00,
  createdAt: "2025-02-27T10:30:00Z",
  updatedAt: "2025-02-27T10:30:00Z"
}
```

### Order Status After Payment
```javascript
{
  id: 1,
  status: "confirmed",        // Was "pending"
  paymentStatus: "completed", // Was "pending"
  totalAmount: 299.99,
  taxAmount: 27.27,
  subtotal: 272.72
}
```

### OrderTimeline Entry Created
```javascript
{
  orderId: 1,
  status: "confirmed",
  message: "Payment completed via Razorpay",
  timestamp: "2025-02-27T10:30:00Z"
}
```

---

## User Auto-Creation on Google OAuth

When user logs in with Google for the first time:

```javascript
// New user created with:
{
  email: "user@gmail.com",           // From Google profile
  name: "User Name",                 // From Google profile
  password: hash(random()),           // Random password (not used)
  role: "customer",                   // Default role
  isActive: true,
  phone: null,
  createdAt: "2025-02-27T10:30:00Z"
}

// CustomerProfile also created:
{
  userId: 1,
  loyaltyPoints: 0,
  preferences: null,
  totalSpent: 0,
  isVerified: true,
  createdAt: "2025-02-27T10:30:00Z"
}
```

---

## JWT Token Structure

```javascript
// Token payload
{
  id: 1,
  role: "customer",
  name: "John Doe",
  email: "john@gmail.com",
  iat: 1234567890,
  exp: 1234567890 + (7 * 24 * 60 * 60) // 7 days
}

// Token expiry: 7 days from creation
```

---

## Environment Variables Required

```env
# Razorpay
RAZORPAY_KEY_ID=rzp_live_...
RAZORPAY_KEY_SECRET=...

# Google OAuth
GOOGLE_CLIENT_ID=...apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=...
GOOGLE_CALLBACK_URL=http://localhost:5000/api/auth/google/callback

# Other
FRONTEND_URL=http://localhost:5173
JWT_SECRET=your_secret_key
```

---

## Testing with cURL

### Create Payment Order
```bash
curl -X POST http://localhost:5000/api/payments/create-order \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"orderId": 1}'
```

### Verify Payment
```bash
curl -X POST http://localhost:5000/api/payments/verify-payment \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "razorpay_order_id": "order_...",
    "razorpay_payment_id": "pay_...",
    "razorpay_signature": "...",
    "orderId": 1
  }'
```

### Get Current User
```bash
curl http://localhost:5000/api/auth/me
```

---

## Important Notes

1. **Payment Verification**: Always verify payment signature on backend for security
2. **JWT Token**: Include in Authorization header for protected routes
3. **Cors**: Frontend must be running on port 5173 for CORS to work
4. **Environment**: Update .env with real Razorpay and Google credentials
5. **Test Mode**: Use Razorpay test credentials during development
