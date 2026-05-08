const express = require('express');
const Razorpay = require('razorpay');
const crypto = require('crypto');
const prisma = require('../prisma');
const { verifyToken, verifyUser } = require('../middleware/auth');

const router = express.Router();

// Initialize Razorpay
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET
});

// Create Razorpay Order
router.post('/create-order', verifyToken, verifyUser, async (req, res) => {
  try {
    const { orderId } = req.body;

    if (!orderId) {
      return res.status(400).json({ message: 'Order ID is required' });
    }

    // Get the order details
    const order = await prisma.order.findUnique({
      where: { id: parseInt(orderId) },
      include: { user: true }
    });

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    if (order.userId !== req.user.id) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    // Create Razorpay order
    const razorpayOrder = await razorpay.orders.create({
      amount: Math.round(order.totalAmount * 100), // Convert to paise
      currency: 'INR',
      receipt: `order_${order.id}_${Date.now()}`,
      notes: {
        orderId: order.id,
        userEmail: order.user.email,
        userName: order.user.name
      }
    });

    res.json({
      orderId: razorpayOrder.id,
      razorpayOrderId: razorpayOrder.id,
      razorpayKeyId: process.env.RAZORPAY_KEY_ID,
      orderAmount: order.totalAmount,
      currency: razorpayOrder.currency,
      key: process.env.RAZORPAY_KEY_ID
    });
  } catch (err) {
    console.error('Razorpay order creation error:', err);
    res.status(500).json({ message: 'Failed to create payment order' });
  }
});

// Verify Payment
router.post('/verify-payment', verifyToken, verifyUser, async (req, res) => {
  try {
    const { 
      razorpay_order_id, 
      razorpay_payment_id, 
      razorpay_signature,
      orderId 
    } = req.body;

    // Verify signature
    const body = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest('hex');

    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({ 
        message: 'Payment verification failed',
        success: false 
      });
    }

    // Update payment in database
    const payment = await prisma.payment.upsert({
      where: { transactionId: razorpay_payment_id },
      update: {
        status: 'completed',
        paymentGateway: 'razorpay'
      },
      create: {
        transactionId: razorpay_payment_id,
        orderId: parseInt(orderId),
        userId: req.user.id,
        amount: (await prisma.order.findUnique({
          where: { id: parseInt(orderId) }
        })).totalAmount,
        paymentMethod: 'card',
        paymentGateway: 'razorpay',
        status: 'completed'
      }
    });

    // Update order payment status
    await prisma.order.update({
      where: { id: parseInt(orderId) },
      data: {
        paymentStatus: 'completed',
        status: 'confirmed'
      }
    });

    // Create order timeline entry
    await prisma.orderTimeline.create({
      data: {
        orderId: parseInt(orderId),
        status: 'confirmed',
        message: 'Payment completed via Razorpay'
      }
    });

    res.json({
      success: true,
      message: 'Payment verified successfully',
      paymentId: razorpay_payment_id,
      orderId: orderId
    });
  } catch (err) {
    console.error('Payment verification error:', err);
    res.status(500).json({ 
      message: 'Payment verification failed',
      success: false 
    });
  }
});

// Get payment details
router.get('/:paymentId', verifyToken, async (req, res) => {
  try {
    const payment = await prisma.payment.findUnique({
      where: { transactionId: req.params.paymentId },
      include: { order: true, user: true }
    });

    if (!payment) {
      return res.status(404).json({ message: 'Payment not found' });
    }

    // Check authorization
    if (payment.userId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    res.json(payment);
  } catch (err) {
    console.error('Error fetching payment:', err);
    res.status(500).json({ message: 'Failed to fetch payment details' });
  }
});

// Get user's payments
router.get('/', verifyToken, verifyUser, async (req, res) => {
  try {
    const payments = await prisma.payment.findMany({
      where: { userId: req.user.id },
      include: { order: true },
      orderBy: { createdAt: 'desc' }
    });

    res.json(payments);
  } catch (err) {
    console.error('Error fetching payments:', err);
    res.status(500).json({ message: 'Failed to fetch payments' });
  }
});

module.exports = router;
