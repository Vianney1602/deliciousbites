# 🚀 Razorpay Payment Gateway Setup Guide

## ✅ What I've Done

### Frontend Implementation
1. ✅ Added Razorpay script to `client/index.html`
2. ✅ Created `RazorpayPayment.jsx` component for payment handling
3. ✅ Integrated Razorpay into `PaymentPage.jsx`
4. ✅ Added payment verification flow
5. ✅ Supports both Cash on Delivery (COD) and Online Payment

### Backend Ready
- ✅ `/api/payments/create-order` - Creates Razorpay order
- ✅ `/api/payments/verify-payment` - Verifies payment signature
- ✅ `/api/payments` - Gets user payments
- ✅ `/api/payments/:paymentId` - Gets specific payment details

---

## 🔑 Step 1: Get Razorpay Credentials

### Sign Up for Razorpay
1. Go to https://razorpay.com
2. Click **"Sign Up"**
3. Enter your business details
4. Verify your email and phone

### Get API Keys
1. Log in to https://dashboard.razorpay.com
2. Go to **Settings** → **API Keys**
3. You'll see two keys:
   - **Key ID** (starts with `rzp_test_` or `rzp_live_`)
   - **Key Secret** (a long string)

### Test Credentials (For Testing)
Razorpay automatically provides test credentials. Use these while testing!

---

## 🔐 Step 2: Update Environment Variables

Open `server/.env` and replace:

```env
# Razorpay Configuration
RAZORPAY_KEY_ID=your_key_id_here
RAZORPAY_KEY_SECRET=your_key_secret_here
```

**Example (TEST):**
```env
RAZORPAY_KEY_ID=rzp_test_1234567890abcd
RAZORPAY_KEY_SECRET=abcdefghijklmnopqrstuvwxyz1234567890
```

---

## 🧪 Step 3: Test with Razorpay Test Cards

### Test Card Details (Use These for Testing!)

| Card Type | Number | CVV | Expiry | Status |
|-----------|--------|-----|--------|--------|
| **Visa** | 4111111111111111 | Any 3 digits | Any future date | Success |
| **Visa** | 4012888888881881 | Any 3 digits | Any future date | Success |
| **Mastercard** | 5555555555554444 | Any 3 digits | Any future date | Success |
| **Mastercard** | 5105105105105100 | Any 3 digits | Any future date | Success |
| **Failed Payment** | 4000000000000002 | Any 3 digits | Any future date | Fails |

### UPI Test IDs
- `success@razorpay` - Success
- `failure@razorpay` - Failure

---

## 🚀 Step 4: Test the Payment Flow

### Steps to Test:

1. **Start both servers:**
   ```bash
   Backend:  cmd /c "cd d:\Delicious-Bites-project\server && npm run dev"
   Frontend: cmd /c "cd d:\Delicious-Bites-project\client && npm run dev"
   ```

2. **Log in to your app** (with email/password or Google)

3. **Add items to cart**

4. **Go to Checkout:**
   - Fill in delivery details
   - Select payment method: **"💳 Online Payment"** (NOT Cash on Delivery)
   - Click **"Place Order"**

5. **On Payment Page:**
   - You'll see "💳 Pay ₹[amount]" button
   - Click it
   - Razorpay checkout will open

6. **In Razorpay Checkout:**
   - Choose **Card** tab
   - Enter test card: `4111111111111111`
   - Expiry: Any future date (e.g., `12/25`)
   - CVV: Any 3 digits (e.g., `123`)
   - Click **"Pay"**

7. **Expected Result:**
   - ✅ You should see "Payment successful!" message
   - ✅ Redirected to success page
   - ✅ Order created in database

---

## 📊 Verify Payment in Database

### Check Database for Payment Records

```bash
# View orders
SELECT * FROM "Order" WHERE "userId" = YOUR_USER_ID;

# View payments
SELECT * FROM "Payment" WHERE "userId" = YOUR_USER_ID;

# View payment timeline
SELECT * FROM "OrderTimeline" WHERE "orderId" = YOUR_ORDER_ID;
```

---

## 🔄 Production vs Test Mode

### Test Mode (Current)
- Key ID: `rzp_test_*`
- Key Secret: `test_*`
- Use test cards above
- No real money charged
- Perfect for development

### Production Mode (When Ready)
- Key ID: `rzp_live_*`
- Key Secret: `live_*`
- Use real cards
- Real money will be charged
- Go live only after thorough testing

---

## 🐛 Troubleshooting

### Issue: "OAuth client was not found"
- ✅ **Fixed** - We now fetch Client ID from backend
- Make sure backend is running on port 5000

### Issue: "Payment verification failed"
- Check if `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET` are correct
- Make sure they match your Razorpay dashboard
- Verify signature verification is working in backend

### Issue: "Razorpay checkout doesn't open"
- Check if Razorpay script loaded in console
- Go to DevTools → Network tab → look for `checkout.razorpay.com`
- If not found, script didn't load

### Issue: "Payment created but signature verification failed"
- Check backend logs for signature verification errors
- Verify `RAZORPAY_KEY_SECRET` is exactly correct (no extra spaces)
- Order ID must match between frontend and backend

---

## 📝 Payment Flow Diagram

```
1. User clicks "Pay" button
   ↓
2. Frontend sends amount to backend
   ↓
3. Backend creates Razorpay order
   ↓
4. Backend returns Razorpay Order ID
   ↓
5. Frontend opens Razorpay checkout modal
   ↓
6. User enters card details
   ↓
7. Razorpay processes payment
   ↓
8. Frontend receives payment details
   ↓
9. Frontend sends to backend for verification
   ↓
10. Backend verifies signature (HMAC-SHA256)
   ↓
11. Backend creates Payment record in database
   ↓
12. Backend updates Order status to "confirmed"
   ↓
13. Frontend redirects to success page ✅
```

---

## 📞 Next Steps

1. **Get your Razorpay API keys** from dashboard
2. **Update `.env`** file with your credentials
3. **Restart backend** server
4. **Test with test cards** above
5. **Verify payments in database**
6. **When ready, switch to production keys**

---

## 🔗 Useful Links

- Razorpay Dashboard: https://dashboard.razorpay.com
- API Documentation: https://razorpay.com/docs/api/
- Test Cards: https://razorpay.com/docs/payments/paymentlinks/test-card-amounts/
- Support: https://support.razorpay.com

---

**Status: ✅ Ready to test with your Razorpay credentials!**

Provide your Razorpay Key ID and Key Secret, and we'll complete the setup! 🚀
