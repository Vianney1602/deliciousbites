const express = require('express');
const prisma = require('../prisma');
const { verifyToken, verifyAdmin } = require('../middleware/auth');
const { broadcast } = require('../ws/broadcast');

const router = express.Router();

// ADMIN ONLY: Get all orders with user and items
router.get('/', verifyToken, verifyAdmin, async (req, res) => {
  try {
    const orders = await prisma.order.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true
          }
        },
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

// ADMIN ONLY: Update order status
router.patch('/:id/status', verifyToken, verifyAdmin, async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id)) {
      return res.status(400).json({ message: 'Invalid order id' });
    }

    const { status } = req.body;
    if (!status) {
      return res.status(400).json({ message: 'Status is required' });
    }

    try {
      const order = await prisma.order.update({
        where: { id },
        data: { status, updatedAt: new Date() },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true
            }
          },
          address: true,
          payment: true,
          timeline: true
        }
      });

      // Create timeline entry for status change
      await prisma.orderTimeline.create({
        data: {
          orderId: id,
          status,
          message: `Order status updated to ${status}`
        }
      });

      // Broadcast order status change to all clients
      broadcast('orders-changed', { orderId: id, status });

      const formattedOrder = {
        ...order,
        items: JSON.parse(order.items)
      };

      res.json(formattedOrder);
    } catch (err) {
      if (err.code === 'P2025') {
        return res.status(404).json({ message: 'Order not found' });
      }
      throw err;
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;

