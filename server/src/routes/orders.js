const express = require('express');
const prisma = require('../prisma');
const { verifyToken, verifyUser } = require('../middleware/auth');
const { broadcast } = require('../ws/broadcast');

const router = express.Router();

// USER ONLY: Create an order
router.post('/', verifyToken, verifyUser, async (req, res) => {
  try {
    const { items, deliveryDetails, totalAmount, paymentMethod, paymentStatus } = req.body;
    
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: 'Order items are required' });
    }

    if (!deliveryDetails || !deliveryDetails.name || !deliveryDetails.email) {
      return res.status(400).json({ message: 'Delivery details are required' });
    }

    // Format items for storage - handle nested product structure from CartContext
    const formattedItems = items.map((item) => {
      // Handle both { product, quantity } and { id, name, price, quantity } formats
      const productData = item.product || item;
      return {
        productId: productData.id,
        productName: productData.name,
        price: productData.price,
        quantity: item.quantity || 1,
        specialRequests: item.specialRequests || ''
      };
    });

    // Create order record
    const order = await prisma.order.create({
      data: {
        userId: req.user.id,
        items: JSON.stringify(formattedItems),
        totalAmount: totalAmount || 0,
        paymentMethod: paymentMethod || 'cod',
        paymentStatus: paymentStatus || 'pending',
        deliveryDetails: JSON.stringify(deliveryDetails),
        status: 'pending'
      }
    });

    // Create timeline entry
    await prisma.orderTimeline.create({
      data: {
        orderId: order.id,
        status: 'pending',
        message: 'Order placed successfully'
      }
    });

    // Broadcast new order to admin clients
    broadcast('orders-changed', { orderId: order.id, action: 'created' });

    res.status(201).json({
      id: order.id,
      orderId: order.orderId,
      userId: order.userId,
      items: formattedItems,
      totalAmount: order.totalAmount,
      paymentMethod: order.paymentMethod,
      paymentStatus: order.paymentStatus,
      status: order.status,
      createdAt: order.createdAt
    });
  } catch (err) {
    console.error('Order creation error:', err);
    res.status(500).json({ message: 'Failed to create order', error: err.message });
  }
});

// USER ONLY: Get own orders
router.get('/my-orders', verifyToken, verifyUser, async (req, res) => {
  try {
    const orders = await prisma.order.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: 'desc' },
      include: { 
        address: true,
        payment: true,
        timeline: true
      }
    });
    
    // Parse items JSON for each order
    const formattedOrders = orders.map(order => ({
      ...order,
      items: JSON.parse(order.items)
    }));
    
    res.json(formattedOrders);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;


