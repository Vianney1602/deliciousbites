# 🧪 Complete Testing & Troubleshooting Guide

## ✅ All Fixes Applied

1. ✅ **CartPage** - No unwanted redirects, stays on cart page
2. ✅ **CheckoutPage** - Proper auth checks and data validation
3. ✅ **PaymentPage** - Full validation and error handling
4. ✅ **Login/Register** - Automatic redirect back after auth
5. ✅ **Payment Success** - Clear navigation options

---

## 🚀 Step-by-Step Testing Flow

### **TEST 1: Browse Products & Add to Cart**

**Actions:**
1. Open browser and go to `http://localhost:5173/home`
2. Click "Explore Menu" or navigate to `/menu`
3. See product list with images, names, prices
4. Click "Add to Cart" on any product
5. See toast notification "Added to cart" 
6. See quantity badge appear on the product card

**Expected Result:**
- ✅ Products load successfully
- ✅ Cart updates without refresh
- ✅ Quantity badge shows

**If It Fails:**
- Check if products loaded from API
- Check backend is running on port 5000
- Check console for any API errors

---

### **TEST 2: Go to Cart Page**

**Actions:**
1. Click "Cart" in navbar or add item and go to `/cart`
2. See list of items in cart
3. See cart summary with prices and total
4. Verify "Proceed to Checkout" button is visible
5. Verify "Continue Shopping" button is visible

**Expected Result:**
- ✅ Cart page loads and stays on `/cart`
- ✅ ❌ NO redirect to home page
- ✅ Items are displayed correctly
- ✅ Prices and totals are correct

**If It Fails:**
- Check browser console for errors
- Make sure CartPage doesn't have unexpected useEffect
- Verify items exist in CartContext

---

### **TEST 3: Proceed to Checkout (Not Logged In)**

**Actions:**
1. If NOT logged in, click "Proceed to Checkout"
2. Should redirect to `/login`
3. Log in with email/password OR use Google Sign-In
4. Should automatically redirect to `/checkout`
5. See checkout form with pre-filled name & email

**Expected Result:**
- ✅ Redirects to login if not authenticated
- ✅ After login, returns to checkout (not home!)
- ✅ Form shows with pre-filled user data
- ✅ Delivery details are empty and ready to fill

**If It Fails:**
- Check sessionStorage.getItem('returnTo') in login page
- Make sure returnTo is cleared after use
- Verify CheckoutPage has useEffect checking user

**Debug Command:**
```javascript
// In browser console, check sessionStorage
console.log(sessionStorage.getItem('returnTo'));
```

---

### **TEST 4: Fill Checkout Form**

**Actions:**
1. Fill all fields:
   - Full Name (auto-filled but can change)
   - Email (auto-filled but can change)
   - Phone: `+91 9876543210` (10+ digits)
   - Address: `123 Main St, Apt 4B`
   - City: `New York`
   - Pincode: `123456` (exactly 6 digits)
2. Select payment method:
   - Option A: **💵 Cash on Delivery**
   - Option B: **💳 Online Payment**
3. Click "Place Order"

**Expected Result:**
- ✅ All validations pass
- ✅ Redirects to `/payment` page
- ✅ Shows order summary
- ✅ Shows delivery address
- ✅ Shows payment option selected

**If It Fails:**
- Check validation messages below each field
- Make sure phone is 10+ digits
- Make sure pincode is exactly 6 digits
- Check email format is valid

**Test Invalid Data:**
```
Try these to test validation:
- Phone: "123" (too short) → Error
- Pincode: "12345" (only 5 digits) → Error
- Email: "invalid.email" (no @) → Error
- Name: "" (empty) → Error
```

---

### **TEST 5: Payment Page - Cash on Delivery**

**Actions:**
1. On Payment Page with COD selected
2. See order summary
3. See delivery address
4. See "💵 Confirm Order (Pay on Delivery)" button
5. Click the button
6. See loading state "⏳ Processing..."
7. Redirects to success page

**Expected Result:**
- ✅ Payment Page loads
- ✅ Shows correct order details
- ✅ Button disabled during processing
- ✅ Redirects to success page
- ✅ Order created with status "pending"

**If It Fails:**
- Check backend is running on 5000
- Check Authorization header with token
- Check console for API errors
- Verify order created in database

**Database Check:**
```sql
SELECT * FROM "Order" WHERE "userId" = YOUR_USER_ID ORDER BY "createdAt" DESC;
```

---

### **TEST 6: Payment Page - Online Payment (Razorpay)**

**Actions:**
1. Go through checkout again
2. Select "💳 Online Payment"
3. Click "Place Order" → Goes to Payment Page
4. See "💳 Pay ₹[amount]" button
5. Click "Pay" button
6. Razorpay modal opens
7. Select "Card" tab
8. Enter test card: `4111111111111111`
9. Expiry: `12/25` (or any future date)
10. CVV: `123` (any 3 digits)
11. Click "Pay"

**Expected Result:**
- ✅ Razorpay modal opens
- ✅ Payment processes
- ✅ Backend verifies signature
- ✅ Order created with status "confirmed"
- ✅ Redirects to success page
- ✅ Payment record created in database

**If It Fails:**
- Check Razorpay script loaded in HTML
- Check RAZORPAY_KEY_ID in backend .env
- Check console for signature verification errors
- Verify Razorpay credentials are correct

**Check in Browser Console:**
```javascript
// Verify Razorpay script loaded
console.log(typeof window.Razorpay); // Should be 'function'
```

**Test Failure Scenario:**
- Use card: `4000000000000002` (failure card)
- Should see "Payment failed" message
- Can retry

---

### **TEST 7: Payment Success Page**

**Actions:**
1. After successful payment
2. See success page with:
   - ✅ checkmark animation
   - Order ID
   - Order summary
   - Delivery address
   - Estimated delivery time (2-3 hours)
3. Click "📦 Track Order" button
4. Should go to order tracking page
5. Go back and click "🏠 Back to Home" button
6. Should go to `/home`

**Expected Result:**
- ✅ Success page shows all order details
- ✅ Both buttons work and navigate properly
- ✅ Can see order confirmation
- ✅ Cart is empty after checkout

**If It Fails:**
- Check location.state passed from previous page
- Verify order data includes orderId, items, total
- Check navigation to `/track-order/:id` works

---

### **TEST 8: Verify Database Records**

**Actions:**
After completing an order, check database for records:

```sql
-- Check Orders
SELECT * FROM "Order" WHERE "userId" = YOUR_USER_ID ORDER BY "createdAt" DESC LIMIT 5;

-- Check Payments (for online orders only)
SELECT * FROM "Payment" WHERE "userId" = YOUR_USER_ID ORDER BY "createdAt" DESC LIMIT 5;

-- Check Order Timeline
SELECT * FROM "OrderTimeline" WHERE "orderId" = YOUR_ORDER_ID;
```

**Expected Result:**
- ✅ Order record exists
- ✅ For COD: paymentStatus = 'pending'
- ✅ For Online: paymentStatus = 'completed'
- ✅ Payment record exists (online only)
- ✅ OrderTimeline shows status progression

---

## 🔍 Quick Testing Checklist

### Basic Flow
- [ ] Add items to cart
- [ ] Go to cart (doesn't redirect to home)
- [ ] Click checkout (redirects to login if not logged in)
- [ ] Login works and returns to checkout
- [ ] Form validation works
- [ ] Payment method selection works

### Checkout Form
- [ ] Name pre-filled
- [ ] Email pre-filled
- [ ] Phone validation (10+ digits)
- [ ] Pincode validation (6 digits)
- [ ] Address required
- [ ] City required

### Payment Flows
- [ ] COD order creation works
- [ ] Online payment opens Razorpay
- [ ] Test card processes successfully
- [ ] Success page shows correct info
- [ ] Track Order button works
- [ ] Back to Home button works

### Database
- [ ] Orders created with correct data
- [ ] Payments recorded (online only)
- [ ] Order timeline entries created
- [ ] Status fields are correct

---

## 🐛 Troubleshooting

### "Cart page redirects to home"
**Solution:**
- Check CartPage doesn't have unexpected useEffect
- Verify no redirect in Navbar
- Check browser console for errors
- Try clearing cache: `Ctrl+Shift+Delete`

### "Can't proceed to checkout"
**Solution:**
- Make sure you're logged in
- Make sure cart has items
- Check CheckoutPage useEffect
- Verify sessionStorage.setItem('returnTo', '/checkout') works

### "Login doesn't return to checkout"
**Solution:**
- Check LoginPage reads sessionStorage.getItem('returnTo')
- Check sessionStorage is cleared after use
- Verify navigate() is called with correct path

### "Payment page shows 'redirecting to cart'"
**Solution:**
- Make sure deliveryDetails are passed via location.state
- Check items exist in cart
- Verify user is authenticated
- Check PaymentPage useEffect conditions

### "Razorpay modal doesn't open"
**Solution:**
- Check Razorpay script in index.html
- Check window.Razorpay exists in console
- Verify RAZORPAY_KEY_ID is set in .env
- Check test credentials format

### "Payment verification fails"
**Solution:**
- Check RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in .env
- Verify signature calculation is correct
- Check test card format: `4111111111111111`
- Look at backend console for verification errors

---

## 📝 Test Scenarios & Expected Outcomes

### Scenario 1: Complete Online Payment
```
Cart → Checkout → Fill Form → Select Online → Payment Page
→ Razorpay Opens → Enter Card → Success Page → Check Order
```
**Expected:** Order status = "confirmed", Payment created

### Scenario 2: Cash on Delivery
```
Cart → Checkout → Fill Form → Select COD → Payment Page
→ Confirm Order → Success Page → Check Order
```
**Expected:** Order status = "pending", No payment record

### Scenario 3: Not Logged In
```
Cart → Checkout (redirects to Login) → Log in → Auto returns to Checkout
→ Fill Form → Continue as normal
```
**Expected:** Auto-redirect after login

### Scenario 4: Empty Cart
```
Checkout → No items → Redirects to Menu
```
**Expected:** Redirect to menu with message

### Scenario 5: Payment Failure
```
Payment Page → Razorpay Opens → Use Failure Card (4000000000000002)
→ See Failure Message → Can Retry
```
**Expected:** Error message, can retry payment

---

## ✅ Final Validation

Before considering the system complete, verify:

- ✅ Cart page doesn't redirect unexpectedly
- ✅ Can add items and view cart
- ✅ Checkout form validates properly
- ✅ Login redirects back to checkout
- ✅ Both COD and online payment work
- ✅ Success page shows order details
- ✅ Orders created in database with correct status
- ✅ Payments recorded for online orders
- ✅ Can track orders after placement

---

## 📞 Getting Help

If something doesn't work:

1. **Check browser console** for JavaScript errors
2. **Check backend logs** for API errors
3. **Verify .env** has all required variables
4. **Check database** for created records
5. **Look at network tab** for API responses

**Debug Command to Run in Console:**
```javascript
// Check auth status
console.log('User:', localStorage.getItem('token'));

// Check session storage
console.log('ReturnTo:', sessionStorage.getItem('returnTo'));

// Check cart items
console.log('Cart:', JSON.parse(sessionStorage.getItem('cart')));

// Check Razorpay
console.log('Razorpay loaded:', typeof window.Razorpay);
```

---

**Status: All fixes applied and ready for testing! 🚀**
