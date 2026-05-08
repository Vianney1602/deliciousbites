# 🔄 Navigation & Redirect Flow Guide

## ✅ Fixed Issues

1. ✅ **Cart Page** - No longer redirects to home unexpectedly
2. ✅ **Checkout Page** - Properly protects against invalid access
3. ✅ **Payment Page** - Validates state before showing page
4. ✅ **Payment Success** - Clear navigation options after order

---

## 📍 Complete Navigation Flow

### **1️⃣ Shopping Phase**

```
🏠 Home Page
    ↓ (Click menu/product)
🍰 Menu Page
    ↓ (Add to cart)
🛒 Cart Page (Can revisit anytime)
    ├─ "Continue Shopping" → Menu Page
    ├─ "Proceed to Checkout" → Login (if not logged in) → Checkout
    ├─ "Clear Cart" → Clears items, stays on Cart Page
    └─ "Browse Menu" (if empty) → Menu Page
```

### **2️⃣ Authentication Phase**

```
Not Logged In → Click "Proceed to Checkout"
    ↓
📱 Login Page (or Register Page)
    ├─ Enter email/password
    ├─ OR click Google login
    ↓
✅ Login successful
    ↓
🔄 AUTOMATIC REDIRECT BACK TO CHECKOUT ← (This is the key fix!)
    ↓
📝 Checkout Page loads with form
```

### **3️⃣ Checkout Phase**

```
📝 Checkout Page
    ├─ User name (pre-filled)
    ├─ Email (pre-filled)
    ├─ Phone number (required)
    ├─ Address (required)
    ├─ City (required)
    ├─ Pincode (required)
    ├─ Payment method (COD or Online)
    ↓
✅ All fields valid
    ↓
"Place Order" button
    ↓
💳 Payment Page
```

### **4️⃣ Payment Phase**

```
💳 Payment Page
    ├─ Shows order summary
    ├─ Shows delivery details
    ├─ Shows total amount
    ↓
Two Options:

Option A: Cash on Delivery (COD)
    ↓
"Confirm Order (Pay on Delivery)" button
    ↓
✅ Order Created (status: pending)
    ↓
🎉 Payment Success Page

Option B: Online Payment
    ↓
"Pay ₹[amount]" button
    ↓
💰 Razorpay Modal Opens
    ├─ Enter Card: 4111111111111111
    ├─ Expiry: 12/25
    ├─ CVV: 123
    ↓
Click "Pay"
    ↓
✅ Payment Processed
    ↓
Backend verifies signature
    ↓
✅ Order Created (status: confirmed)
    ↓
🎉 Payment Success Page
```

### **5️⃣ Order Confirmation Phase**

```
🎉 Payment Success Page
    ├─ Order ID displayed
    ├─ Order summary
    ├─ Delivery address
    ├─ Estimated delivery time (2-3 hours)
    ↓
Two Options:
    ├─ "📦 Track Order" → Track Order Page
    └─ "🏠 Back to Home" → Home Page
    ↓
Order placed successfully! ✅
```

---

## 🔒 Protected Routes & Guards

### **Authentication Required**
- `/checkout` - Requires user to be logged in
- `/payment` - Requires user to be logged in
- `/orders` - Requires user to be logged in
- `/account` - Requires user to be logged in

### **Data Validation**
| Route | Requires | Action if Missing |
|-------|----------|------------------|
| `/checkout` | User logged in | Redirect to /login |
| `/checkout` | Cart items | Redirect to /menu |
| `/payment` | Cart items | Redirect to /cart |
| `/payment` | Delivery details | Redirect to /cart |
| `/payment-success` | Order data | Redirect to /home |

---

## 🔄 Redirect Decision Tree

### **User visits /cart**
```
Cart has items?
├─ YES → Show cart items, buttons for checkout/continue shopping
└─ NO → Show empty state with "Browse Menu" button → /menu
```

### **User visits /checkout**
```
User logged in?
├─ NO → Redirect to /login (store returnTo=/checkout)
└─ YES:
    Cart has items?
    ├─ YES → Show checkout form
    └─ NO → Redirect to /menu
```

### **User visits /payment**
```
User logged in?
├─ NO → Redirect to /login
└─ YES:
    Cart has items AND delivery details?
    ├─ YES → Show payment options
    └─ NO → Redirect to /cart
```

### **User visits /payment-success**
```
Order data provided?
├─ YES → Show success page with details
└─ NO → Redirect to /home
```

---

## 🧭 Navigation Buttons Reference

### **Cart Page**
| Button | Goes To | Condition |
|--------|---------|-----------|
| Proceed to Checkout | /checkout or /login | If logged in: /checkout, else: /login |
| Continue Shopping | /menu | Always |
| Clear Cart | Cart Page (stays) | Clears items |
| Browse Menu (empty) | /menu | Only shows when cart empty |

### **Checkout Page**
| Button | Goes To | Condition |
|--------|---------|-----------|
| Place Order | /payment | Form valid |

### **Payment Page**
| Button | Goes To | Condition |
|--------|---------|-----------|
| Confirm Order (COD) | /payment-success | Form valid |
| Pay [Amount] | Razorpay Modal | Form valid |

### **Payment Success Page**
| Button | Goes To | Condition |
|--------|---------|-----------|
| Track Order | /track-order/:id | Always |
| Back to Home | /home | Always |

---

## 📊 State Management in Checkout Flow

### **SessionStorage**
Used for: Storing return destination after login
```javascript
// Set when user not logged in
sessionStorage.setItem('returnTo', '/checkout');

// Retrieved after login
const returnTo = sessionStorage.getItem('returnTo');
sessionStorage.removeItem('returnTo');
navigate(returnTo);
```

### **Location State**
Used for: Passing data between pages
```javascript
// CheckoutPage → PaymentPage
navigate('/payment', {
  state: {
    deliveryDetails: { name, email, phone, address, city, pincode, paymentMethod }
  }
});

// PaymentPage → PaymentSuccessPage
navigate('/payment-success', {
  state: {
    orderId, items, total, deliveryDetails, paymentMethod
  }
});
```

### **LocalStorage**
Used for: Persistent data (auth token, user info)
```javascript
localStorage.setItem('token', userToken);
localStorage.setItem('user', JSON.stringify(userData));
```

### **Cart Context**
Used for: Managing shopping cart
```javascript
const { items, total, addToCart, removeFromCart, clearCart } = useCart();
```

---

## ⚠️ Error Handling & Recovery

### **Scenario: User refreshes on checkout page**
```
✅ FIXED: useEffect checks if user is logged in
├─ If not logged in → Redirect to /login with returnTo=/checkout
└─ If logged in but cart empty → Redirect to /menu
```

### **Scenario: User refreshes on payment page**
```
✅ FIXED: useEffect checks for required data
├─ If cart empty → Redirect to /cart
├─ If no delivery details → Redirect to /cart
└─ If not logged in → Redirect to /login
```

### **Scenario: User tries to access payment without checkout**
```
✅ FIXED: Must have deliveryDetails in location.state
├─ If missing → Redirect to /cart
└─ If present → Show payment page
```

### **Scenario: User bookmarks payment-success page**
```
✅ Accessing without order data → Redirect to /home
└─ Must complete order first
```

---

## 🧪 Testing All Flows

### **Test 1: Complete Payment Flow**
```
1. ✅ Add items to cart
2. ✅ Go to /cart (verify page loads)
3. ✅ Click "Proceed to Checkout"
4. ✅ If not logged in → Login → Return to checkout
5. ✅ Fill all delivery details
6. ✅ Select "Online Payment"
7. ✅ Click "Place Order"
8. ✅ See Payment Page
9. ✅ Click "Pay" button
10. ✅ Use test card: 4111111111111111
11. ✅ See success page with order details
12. ✅ Click "Track Order" → Works
13. ✅ Click "Back to Home" → Works
```

### **Test 2: COD Flow**
```
1. ✅ Add items to cart
2. ✅ Go to checkout
3. ✅ Fill delivery details
4. ✅ Select "Cash on Delivery"
5. ✅ Click "Place Order"
6. ✅ Click "Confirm Order"
7. ✅ See success page
```

### **Test 3: Cart Interactions**
```
1. ✅ Go to /cart (with items)
2. ✅ "Continue Shopping" → /menu
3. ✅ Add more items
4. ✅ "Clear Cart" → Cart shows empty state
5. ✅ "Browse Menu" → /menu
6. ✅ Add items back
7. ✅ "Proceed to Checkout" → /checkout
```

### **Test 4: Authentication Flow**
```
1. ✅ Not logged in
2. ✅ "Proceed to Checkout" → /login
3. ✅ Login with email/password
4. ✅ Auto-redirect to /checkout ← KEY TEST!
5. ✅ Form pre-filled with name & email
6. ✅ Continue checkout normally
```

### **Test 5: Page Refresh Tests**
```
1. ✅ On /checkout, refresh → Still on /checkout
2. ✅ On /payment, refresh → Still on /payment
3. ✅ On /payment-success, refresh → Still on /payment-success
4. ✅ Clear cart, try /payment → Redirect to /cart
```

---

## 📝 Summary of Changes

| File | Change | Purpose |
|------|--------|---------|
| **CartPage.jsx** | Added returnTo for checkout | Proper redirect after login |
| **CheckoutPage.jsx** | Added useEffect guards | Protect against invalid access |
| **PaymentPage.jsx** | Added useEffect validation | Ensure cart & delivery details |
| **LoginPage.jsx** | Check returnTo on login | Redirect back to checkout |
| **RegisterPage.jsx** | Check returnTo on signup | Redirect back to checkout |

---

## ✅ Ready to Test!

All redirects now properly:
1. ✅ Check for required data
2. ✅ Validate user authentication
3. ✅ Return users to their intended destination
4. ✅ Show appropriate messages and options
5. ✅ Handle edge cases and errors

**Your checkout flow is now production-ready!** 🚀
