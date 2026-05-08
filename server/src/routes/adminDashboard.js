const express = require('express');
const prisma = require('../prisma');
const { verifyToken, verifyAdmin } = require('../middleware/auth');
const upload = require('../middleware/upload');
const { broadcast } = require('../ws/broadcast');
const path = require('path');
const fs = require('fs');

const router = express.Router();

// All routes below require admin authentication
router.use(verifyToken, verifyAdmin);

// ─── Dashboard Stats ─────────────────────────────────────
router.get('/stats', async (_req, res) => {
  try {
    const [totalOrders, revenue, activeItems, totalItems, customers, pendingOrders, recentOrders] =
      await Promise.all([
        prisma.order.count(),
        prisma.order.aggregate({ _sum: { totalAmount: true } }),
        prisma.menuItem.count({ where: { availability: true } }),
        prisma.menuItem.count(),
        prisma.user.count({ where: { role: 'user' } }),
        prisma.order.count({ where: { status: 'pending' } }),
        prisma.order.findMany({
          orderBy: { createdAt: 'desc' },
          take: 10,
          include: {
            user: { select: { id: true, name: true, email: true } },
            address: true
          }
        })
      ]);

    // Parse items JSON for each order
    const formattedRecentOrders = recentOrders.map(order => ({
      ...order,
      items: JSON.parse(order.items)
    }));

    res.json({
      totalOrders,
      revenue: revenue._sum.totalAmount || 0,
      activeItems,
      totalItems,
      customers,
      pendingOrders,
      recentOrders: formattedRecentOrders
    });
  } catch (err) {
    console.error('Stats error:', err);
    res.status(500).json({ message: 'Failed to load dashboard stats' });
  }
});

// ─── Customers List ──────────────────────────────────────
router.get('/customers', async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      where: { role: 'user' },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
        _count: { select: { orders: true } }
      }
    });

    res.json(users);
  } catch (err) {
    console.error('Customers error:', err);
    res.status(500).json({ message: 'Failed to load customers' });
  }
});

const cloudinary = require('../config/cloudinary');
const streamifier = require('streamifier');

// ─── Image Upload ────────────────────────────────────────
router.post('/upload-image', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No image file provided' });
    }

    console.log('--- Starting Cloudinary Upload ---');
    console.log('Secret starts with:', process.env.CLOUDINARY_API_SECRET?.substring(0, 5) + '...');

    const streamUpload = (req) => {
      return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          {
            folder: 'menu_items',
          },
          (error, result) => {
            if (result) {
              resolve(result);
            } else {
              reject(error);
            }
          }
        );
        streamifier.createReadStream(req.file.buffer).pipe(stream);
      });
    };

    const result = await streamUpload(req);
    console.log('✅ Cloudinary Upload Success:', result.secure_url);
    res.json({ imageUrl: result.secure_url });

  } catch (err) {
    console.error('Cloudinary upload error details:', err);
    res.status(500).json({ message: 'Failed to upload image to cloud storage', error: err.message });
  }
});

// ─── Delete uploaded image ───────────────────────────────
router.delete('/delete-image', async (req, res) => {
  try {
    const { imageUrl } = req.body;
    if (!imageUrl) {
      return res.status(400).json({ message: 'No image URL provided' });
    }

    // Extract public ID from Cloudinary URL
    // URL format: https://res.cloudinary.com/cloudname/image/upload/v12345/folder/id.jpg
    const parts = imageUrl.split('/');
    const filenameWithExt = parts[parts.length - 1];
    const publicIdWithoutExt = filenameWithExt.split('.')[0];
    const folder = parts[parts.length - 2];
    const publicId = `${folder}/${publicIdWithoutExt}`;

    await cloudinary.uploader.destroy(publicId);
    res.json({ message: 'Image deleted' });
  } catch (err) {
    console.error('Cloudinary delete error:', err);
    res.status(500).json({ message: 'Failed to delete image from cloud storage' });
  }
});

module.exports = router;
