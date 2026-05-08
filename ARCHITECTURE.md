# System Architecture - Razorpay & Google OAuth Integration

## Complete Payment & Authentication Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│                         DELICIOUS BITES SYSTEM                      │
└─────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────┐      ┌──────────────────────────────┐
│   FRONTEND (React/Vite)      │      │   BACKEND (Express/Node)     │
│  Port: 5173                  │      │   Port: 5000                 │
├──────────────────────────────┤      ├──────────────────────────────┤
│                              │      │                              │
│ Payment Components:          │◄────►│ /api/payments:               │
│ ├─ PaymentCheckout.jsx       │      │ ├─ POST /create-order        │
│ ├─ RazorpayForm.jsx          │      │ ├─ POST /verify-payment      │
│ └─ PaymentSuccess.jsx        │      │ └─ GET /:paymentId           │
│                              │      │                              │
│ Auth Components:             │◄────►│ /api/auth:                   │
│ ├─ GoogleLoginButton.jsx     │      │ ├─ GET /google               │
│ ├─ AuthCallback.jsx          │      │ ├─ GET /google/callback      │
│ └─ LoginPage.jsx             │      │ └─ GET /me                   │
│                              │      │                              │
└──────────────────────────────┘      └──────────────────────────────┘
         │                                      │
         │ HTTPS/WebSocket                      │
         └──────────────────────────────────────┘


EXTERNAL SERVICES
┌──────────────────────────────┐      ┌──────────────────────────────┐
│    RAZORPAY GATEWAY          │      │   GOOGLE OAUTH               │
│   (Payment Processing)       │      │  (Social Authentication)     │
│                              │      │                              │
│ ├─ Create Orders             │      │ ├─ Google Login Page         │
│ ├─ Process Payments          │      │ ├─ User Profile              │
│ ├─ Verify Signatures         │      │ ├─ Email Verification       │
│ └─ Webhook Notifications     │      │ └─ Token Generation         │
│                              │      │                              │
└──────────────────────────────┘      └──────────────────────────────┘
         ▲                                      ▲
         │ HTTPS                               │ OAuth 2.0
         │ (with API Key)                      │ (with Credentials)
         │                                      │
         └──────────────────────────────────────┘


DATABASE (Neon PostgreSQL)
┌──────────────────────────────────────────────────────────────┐
│                       TABLES                                 │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  User                    Order          Payment             │
│  ├─ id (PK)             ├─ id (PK)      ├─ id (PK)         │
│  ├─ email               ├─ userId (FK)  ├─ transactionId    │
│  ├─ password            ├─ orderId      ├─ orderId (FK)     │
│  ├─ name                ├─ items (JSON) ├─ userId (FK)      │
│  ├─ phone               ├─ status       ├─ amount           │
│  ├─ role                ├─ paymentStatus├─ paymentGateway   │
│  ├─ isActive            ├─ totalAmount  ├─ status           │
│  └─ timestamps          ├─ taxAmount    └─ timestamps       │
│                         └─ timestamps                        │
│                                                              │
│  CustomerProfile       OrderTimeline                        │
│  ├─ userId (FK)        ├─ id (PK)                          │
│  ├─ loyaltyPoints      ├─ orderId (FK)                      │
│  ├─ preferences        ├─ status                           │
│  ├─ totalSpent         ├─ message                           │
│  └─ isVerified         └─ timestamp                         │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

---

## Payment Processing Flow

```
                    RAZORPAY PAYMENT FLOW

User              Frontend              Backend              Database
│                    │                    │                    │
├──────────────────►│                    │                    │
│  Click "Pay Now"  │                    │                    │
│                    │──POST /create-order──────►│            │
│                    │                    │ Create Razorpay   │
│                    │◄─Order Details─────┤ Order             │
│                    │                    │ [GET from Order]  │
│                    │ Razorpay SDK       │                    │
│                    │ opens checkout     │                    │
│                    │                    │                    │
├──────────────────►│                    │                    │
│ Enter Card Info   │  (via Razorpay)    │                    │
│ Click "Pay"       │                    │                    │
│                    │ (processed by      │                    │
│                    │  Razorpay servers) │                    │
│                    │                    │                    │
│                    │◄─Payment Success──┐│                    │
│                    │  (with signature) │                    │
│                    │                    │                    │
│                    │──POST /verify-payment────►│            │
│                    │  Verify Signature        │ Signature OK │
│                    │                    │ CREATE Payment     │
│                    │◄─Success Message──┤ UPDATE Order       │
│                    │                    │ CREATE Timeline    │
│                    │                    │                    │
├──────────────────►│                    ├─────Payment────────►│
│ Redirect Success  │ Redirect to        │                    │
│ Page              │ /payment-success   │                    │
│                    │                    │                    │
```

---

## Google OAuth Flow

```
                    GOOGLE OAUTH FLOW

User              Frontend              Backend              Google
│                    │                    │                    │
├──────────────────►│                    │                    │
│ Click "Login"     │                    │                    │
│ with Google       │                    │                    │
│                    │────/api/auth/google─────────►│          │
│                    │                    │ Redirect to
│                    │                    │ Google Login  ────►│
│                    │◄─Google Login Page─┤                    │
│                    │                    │◄────Google Page────┤
│                    │                    │                    │
│                    │                    │                    │
├──────────────────►│                    │                    │
│ Login with        │  (Handles auth     │                    │
│ Google Account    │   outside Delicious│ Bites)             │
│                    │                    │                    │
│ Grant Permission  │                    │                    │
│                    │                    │                    │
│◄──────────────────┤  Google redirects  │◄────Auth Code──────┤
│ (Browser redirects)│  with auth code    │                    │
│                    │                    │                    │
│                    │  /google/callback  │                    │
│                    │  ?code=XXXX        │                    │
│                    │◄─────────────────────────┐              │
│                    │                    │     │              │
│                    │                    │ Exchange Code
│                    │                    │ for User Profile   │
│                    │                    │ (to Google)    ───►│
│                    │                    │◄──User Profile─────┤
│                    │                    │ Get email, name
│                    │                    │ CREATE/LINK User
│                    │                    │ GENERATE JWT
│                    │                    │                    │
│◄──────────────────┼────Redirect URL────┤                    │
│ http://localhost  │  with token        │                    │
│ :5173?token=JWT   │                    │                    │
│ &email=user@gmail │                    │                    │
│ &name=User Name   │                    │                    │
│                    │                    │                    │
│ Extract token     │                    │                    │
│ Save localStorage │                    │                    │
│ Redirect Dashboard│                    │                    │
│                    │                    │                    │
```

---

## Payment State Machine

```
┌─────────────┐
│   PENDING   │  ◄─ Order created, awaiting payment
└──────┬──────┘
       │
       │ User initiates payment
       │
       ▼
┌──────────────────────────┐
│  RAZORPAY PROCESSING     │  ◄─ Razorpay checkout open
│                          │     Payment entered
└──────┬───────────────────┘
       │
       │ Payment success/failure on Razorpay
       │
       ├─────────────────────────────────┬──────────────────┐
       │                                 │                  │
       ▼                                 ▼                  ▼
┌────────────┐                     ┌──────────┐      ┌──────────┐
│ CONFIRMED  │  ◄─ Signature OK     │ PENDING  │      │ FAILED   │
│            │                      │ (retry)  │      │ (error)  │
│ Payment:   │                      │          │      │          │
│ COMPLETED  │                      └──────────┘      └──────────┘
└────────────┘
       │
       │ Admin picks order
       │
       ▼
┌──────────────────┐
│ PROCESSING       │  ◄─ Being prepared
└────────┬─────────┘
         │
         │ Item ready
         │
         ▼
┌──────────────────┐
│ READY_DELIVERY   │  ◄─ Waiting for delivery
└────────┬─────────┘
         │
         │ Delivery in progress
         │
         ▼
┌──────────────────┐
│ DELIVERED        │  ◄─ Order completed
└──────────────────┘
```

---

## Request/Response Flow Diagram

```
CLIENT REQUEST FLOW:

1. PAYMENT CREATION
┌─────────────────────────────────────────┐
│ Client: POST /api/payments/create-order │
│ Body: { "orderId": 1 }                  │
│ Header: Authorization: Bearer JWT       │
└─────────────────────────────────────────┘
                    │
                    ▼
         ┌──────────────────────┐
         │ Backend Processing:  │
         │ ├─ Verify JWT token  │
         │ ├─ Fetch Order      │
         │ ├─ Verify ownership │
         │ ├─ Create Razorpay  │
         │ │  order (INR amount)
         │ └─ Return order ID  │
         └──────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────┐
│ Response: 200 OK                        │
│ {                                       │
│   "orderId": "order_...",              │
│   "orderAmount": 299.99,               │
│   "currency": "INR",                   │
│   "key": "rzp_live_..."                │
│ }                                       │
└─────────────────────────────────────────┘

2. PAYMENT VERIFICATION
┌─────────────────────────────────────────────┐
│ Client: POST /api/payments/verify-payment   │
│ Body: {                                     │
│   "razorpay_order_id": "order_...",        │
│   "razorpay_payment_id": "pay_...",        │
│   "razorpay_signature": "sig_...",         │
│   "orderId": 1                              │
│ }                                           │
│ Header: Authorization: Bearer JWT           │
└─────────────────────────────────────────────┘
                    │
                    ▼
         ┌──────────────────────┐
         │ Backend Processing:  │
         │ ├─ Verify JWT token  │
         │ ├─ Verify signature  │ (HMAC-SHA256)
         │ ├─ Create Payment    │ (DB record)
         │ ├─ Update Order      │ (status)
         │ ├─ Create Timeline   │ (event)
         │ └─ Return success    │
         └──────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────┐
│ Response: 200 OK                        │
│ {                                       │
│   "success": true,                      │
│   "message": "Payment verified...",    │
│   "paymentId": "pay_...",               │
│   "orderId": "1"                        │
│ }                                       │
└─────────────────────────────────────────┘

3. GOOGLE LOGIN
┌─────────────────────────────────────────┐
│ Client: GET /api/auth/google            │
│ (No body needed)                        │
└─────────────────────────────────────────┘
                    │
                    ▼
    ┌────────────────────────────────┐
    │ Redirect to Google Login Page  │
    │ (user sees Google's interface) │
    └────────────────────────────────┘
                    │
        (User logs in with Google)
                    │
                    ▼
┌─────────────────────────────────────────┐
│ Google: Callback to /api/auth/google/   │
│         callback?code=...&state=...     │
└─────────────────────────────────────────┘
                    │
                    ▼
         ┌──────────────────────┐
         │ Backend Processing:  │
         │ ├─ Exchange code     │
         │ ├─ Get user profile  │
         │ ├─ Find/Create user  │
         │ ├─ Create JWT token  │
         │ └─ Redirect frontend │
         └──────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────┐
│ Redirect: http://localhost:5173?token=  │
│ eyJhbGc...&email=user@gmail.com&name=  │
│ User%20Name                             │
└─────────────────────────────────────────┘
```

---

## Error Handling Flow

```
CLIENT REQUEST
      │
      ▼
┌──────────────────────┐
│ INVALID REQUEST?     │───Yes──► 400 Bad Request
│ (missing required)   │           • Invalid orderId
│                      │           • Missing fields
└──────────────────────┘
      │ No
      ▼
┌──────────────────────┐
│ AUTHENTICATION OK?   │───No──► 401 Unauthorized
│ (JWT token valid)    │         • Invalid token
│                      │         • Expired token
└──────────────────────┘
      │ Yes
      ▼
┌──────────────────────┐
│ AUTHORIZATION OK?    │───No──► 403 Forbidden
│ (user owns resource) │         • Not order owner
│                      │         • Wrong role
└──────────────────────┘
      │ Yes
      ▼
┌──────────────────────┐
│ RESOURCE EXISTS?     │───No──► 404 Not Found
│ (order in DB)        │         • Order not found
│                      │         • Payment not found
└──────────────────────┘
      │ Yes
      ▼
┌──────────────────────┐
│ PROCESS REQUEST      │───Error──► 500 Server Error
│                      │            • Database error
│                      │            • API error
│                      │            • Razorpay error
└──────────────────────┘
      │ Success
      ▼
┌──────────────────────┐
│ RETURN 200 OK        │
│ with response data   │
└──────────────────────┘
```

---

## Middleware & Security Layers

```
HTTP REQUEST
      │
      ▼
┌──────────────────┐
│ CORS Check       │  ◄─ Verify frontend origin
└──────┬───────────┘
       │ Pass
       ▼
┌──────────────────┐
│ JSON Parse       │  ◄─ Parse request body
└──────┬───────────┘
       │ Success
       ▼
┌──────────────────┐
│ JWT Verify       │  ◄─ Extract & verify token
│ (if protected)   │    • Token valid?
└──────┬───────────┘    • Not expired?
       │ Valid
       ▼
┌──────────────────┐
│ User Check       │  ◄─ Check if user role OK
│ (verifyUser)     │    • Customer? Admin?
└──────┬───────────┘
       │ Authorized
       ▼
┌──────────────────┐
│ Input Validation │  ◄─ Validate request data
│ & Sanitization   │    • Format correct?
└──────┬───────────┘    • Required fields?
       │ Valid
       ▼
┌──────────────────┐
│ Business Logic   │  ◄─ Process request
│ Execution        │    • Create/verify/update
└──────┬───────────┘
       │
       ▼
┌──────────────────┐
│ Database         │  ◄─ Query database
│ Operation        │
└──────┬───────────┘
       │
       ▼
┌──────────────────┐
│ Response         │  ◄─ Return data or error
│ Generation       │
└──────────────────┘
```

---

## File Structure

```
delicious-bites-project/
│
├── server/
│   ├── src/
│   │   ├── index.js                    ◄─ Main server entry
│   │   ├── prisma.js                   ◄─ Prisma client
│   │   │
│   │   ├── config/
│   │   │   └── googleAuth.js            ◄─ Google OAuth strategy
│   │   │
│   │   ├── routes/
│   │   │   ├── auth.js                 ◄─ Auth endpoints (+ OAuth)
│   │   │   ├── payments.js             ◄─ Payment endpoints (NEW)
│   │   │   ├── products.js             ◄─ Menu items
│   │   │   ├── orders.js               ◄─ Order creation
│   │   │   ├── admin.js                ◄─ Admin setup
│   │   │   ├── adminOrders.js          ◄─ Order management
│   │   │   └── adminDashboard.js       ◄─ Dashboard stats
│   │   │
│   │   ├── middleware/
│   │   │   ├── auth.js                 ◄─ JWT verification
│   │   │   └── upload.js               ◄─ File upload
│   │   │
│   │   ├── seed/
│   │   └── ws/
│   │
│   ├── prisma/
│   │   ├── schema.prisma               ◄─ Database models
│   │   └── migrations/
│   │
│   ├── uploads/                        ◄─ Product images
│   │
│   ├── .env                            ◄─ Configuration
│   └── package.json                    ◄─ Dependencies
│
├── client/
│   ├── src/
│   │   ├── main.jsx                    ◄─ React entry
│   │   ├── App.jsx                     ◄─ Routes & layout
│   │   │
│   │   ├── components/
│   │   │   ├── PaymentCheckout.jsx     ◄─ Payment form (TO CREATE)
│   │   │   ├── GoogleLoginButton.jsx   ◄─ Google button (TO CREATE)
│   │   │   ├── AuthCallback.jsx        ◄─ OAuth handler (TO CREATE)
│   │   │   └── ... other components
│   │   │
│   │   ├── pages/
│   │   │   ├── CheckoutPage.jsx        ◄─ Checkout (UPDATE)
│   │   │   ├── LoginPage.jsx           ◄─ Login (UPDATE)
│   │   │   └── PaymentSuccessPage.jsx  ◄─ Success (TO CREATE)
│   │   │
│   │   ├── services/
│   │   │   ├── paymentService.js       ◄─ Payment API (TO CREATE)
│   │   │   └── authService.js          ◄─ Auth API (TO CREATE)
│   │   │
│   │   ├── contexts/
│   │   │   └── AuthContext.jsx         ◄─ Auth state (UPDATE)
│   │   │
│   │   └── api.js                      ◄─ Axios config
│   │
│   ├── index.html
│   ├── package.json
│   └── vite.config.mjs
│
└── Documentation/
    ├── QUICK_START.md                  ◄─ Quick guide
    ├── PAYMENT_OAUTH_SETUP.md          ◄─ Detailed setup
    ├── API_REFERENCE.md                ◄─ API docs
    ├── FRONTEND_INTEGRATION.md         ◄─ Frontend code
    ├── IMPLEMENTATION_SUMMARY.md       ◄─ Implementation detail
    └── PAYMENT_OAUTH_COMPLETION.md     ◄─ Status report
```

---

## Component Dependencies

```
PAYMENT FLOW
────────────

Checkout Page
    │
    ├─► PaymentCheckout Component
    │       │
    │       ├─► paymentService.createPaymentOrder()
    │       │       └─► GET /api/payments/create-order
    │       │
    │       ├─► Razorpay SDK (checkout.js)
    │       │
    │       └─► paymentService.verifyPayment()
    │               └─► POST /api/payments/verify-payment
    │
    └─► PaymentSuccess Component
            │
            └─► PaymentSuccessPage

AUTH FLOW
─────────

Login Page
    │
    ├─► GoogleLoginButton
    │       └─► GET /api/auth/google (redirect)
    │
    └─► Email/Password Login
            └─► POST /api/auth/login


OAuth Callback
    │
    ├─► OAuth Callback Handler (AuthCallback.jsx)
    │       │
    │       ├─► Extract token from URL
    │       │
    │       ├─► Save to localStorage
    │       │
    │       └─► Redirect to Dashboard


Protected Routes
    │
    ├─► ProtectedRoute Component
    │       │
    │       ├─► Check AuthContext.isAuthenticated
    │       │
    │       └─► Redirect to /login if false
    │
    └─► Dashboard / User Pages
```

---

This architecture ensures:
✅ **Security**: All endpoints protected, signatures verified
✅ **Scalability**: Modular routes and services
✅ **Reliability**: Error handling at each layer
✅ **Maintainability**: Clear separation of concerns
✅ **Integration**: Third-party services properly configured

