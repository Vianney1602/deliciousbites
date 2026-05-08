const express = require('express');
const prisma = require('../prisma');
const { verifyToken, verifyAdmin } = require('../middleware/auth');
const { broadcast } = require('../ws/broadcast');

const router = express.Router();

// PUBLIC / USER: Get all menu items (optionally filter by category or availability)
router.get('/', async (req, res) => {
  try {
    const { category, available } = req.query;
    const where = {};
    if (category) {
      where.category = category;
    }
    if (available === 'true') {
      where.availability = true;
    }

    const menuItems = await prisma.menuItem.findMany({
      where,
      orderBy: { createdAt: 'asc' }
    });
    res.json(menuItems);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// PUBLIC / USER: Get single menu item by id
router.get('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id)) {
      return res.status(400).json({ message: 'Invalid item id' });
    }

    const item = await prisma.menuItem.findUnique({ where: { id } });
    if (!item) {
      return res.status(404).json({ message: 'Menu item not found' });
    }
    res.json(item);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// ADMIN ONLY: Add menu item
router.post('/', verifyToken, verifyAdmin, async (req, res) => {
  try {
    const { name, category, description, price, availability, imageUrl, preparationTime, allergens, isVegan, isGlutenFree } = req.body;
    if (!name || !category || typeof price !== 'number') {
      return res
        .status(400)
        .json({ message: 'Name, category and numeric price are required' });
    }

    const item = await prisma.menuItem.create({
      data: {
        name,
        category,
        description: description || '',
        price,
        availability: availability !== undefined ? availability : true,
        imageUrl: imageUrl || null,
        preparationTime: preparationTime || 15,
        allergens: allergens || null,
        isVegan: isVegan || false,
        isGlutenFree: isGlutenFree || false
      }
    });

    broadcast('products-changed', { productId: item.id, action: 'created' });

    res.status(201).json(item);
  } catch (err) {
    console.error(err);
    if (err.code === 'P2002') {
      return res.status(400).json({ message: 'Menu item with this name and category exists' });
    }
    res.status(500).json({ message: 'Server error' });
  }
});

// ADMIN ONLY: Edit menu item
router.put('/:id', verifyToken, verifyAdmin, async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id)) {
      return res.status(400).json({ message: 'Invalid item id' });
    }

    const { name, category, description, price, availability, imageUrl, preparationTime, allergens, isVegan, isGlutenFree } = req.body;

    const data = {};
    if (name !== undefined) data.name = name;
    if (category !== undefined) data.category = category;
    if (description !== undefined) data.description = description;
    if (price !== undefined) data.price = price;
    if (availability !== undefined) data.availability = availability;
    if (imageUrl !== undefined) data.imageUrl = imageUrl;
    if (preparationTime !== undefined) data.preparationTime = preparationTime;
    if (allergens !== undefined) data.allergens = allergens;
    if (isVegan !== undefined) data.isVegan = isVegan;
    if (isGlutenFree !== undefined) data.isGlutenFree = isGlutenFree;

    try {
      const item = await prisma.menuItem.update({
        where: { id },
        data
      });
      broadcast('products-changed', { productId: id, action: 'updated' });
      res.json(item);
    } catch (err) {
      if (err.code === 'P2025') {
        return res.status(404).json({ message: 'Menu item not found' });
      }
      throw err;
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// ADMIN ONLY: Delete menu item
router.delete('/:id', verifyToken, verifyAdmin, async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id)) {
      return res.status(400).json({ message: 'Invalid item id' });
    }

    try {
      await prisma.menuItem.delete({ where: { id } });
      broadcast('products-changed', { productId: id, action: 'deleted' });
      res.json({ message: 'Menu item deleted' });
    } catch (err) {
      if (err.code === 'P2025') {
        return res.status(404).json({ message: 'Menu item not found' });
      }
      throw err;
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// ADMIN ONLY: Change availability
router.patch('/:id/availability', verifyToken, verifyAdmin, async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id)) {
      return res.status(400).json({ message: 'Invalid item id' });
    }

    const { availability } = req.body;
    if (availability === undefined) {
      return res.status(400).json({ message: 'Availability is required' });
    }

    try {
      const item = await prisma.menuItem.update({
        where: { id },
        data: { availability }
      });
      broadcast('products-changed', { productId: id, action: 'availability' });
      res.json(item);
    } catch (err) {
      if (err.code === 'P2025') {
        return res.status(404).json({ message: 'Menu item not found' });
      }
      throw err;
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;


