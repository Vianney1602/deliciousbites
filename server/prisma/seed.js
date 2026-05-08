const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding Delicious Bites database...\n');

  try {
    // Clear existing data
    console.log('🗑️  Clearing existing data...');
    await prisma.orderTimeline.deleteMany();
    await prisma.payment.deleteMany();
    await prisma.order.deleteMany();
    await prisma.menuItemReview.deleteMany();
    await prisma.feedback.deleteMany();
    await prisma.address.deleteMany();
    await prisma.customerProfile.deleteMany();
    await prisma.menuItem.deleteMany();
    await prisma.user.deleteMany();

    // Create Admin User
    console.log('👤 Creating admin user...');
    const adminPassword = await bcrypt.hash('admin123', 10);
    const admin = await prisma.user.create({
      data: {
        email: 'admin@deliciousbites.com',
        password: adminPassword,
        name: 'Admin User',
        phone: '+1-800-BAKERY1',
        role: 'admin',
        isActive: true
      }
    });
    console.log('   ✓ Admin created: admin@deliciousbites.com');

    // Create Sample Customers
    console.log('👥 Creating sample customers...');
    const customers = [];
    const customerData = [
      { name: 'John Smith', email: 'john@example.com', phone: '+1-555-0101' },
      { name: 'Sarah Johnson', email: 'sarah@example.com', phone: '+1-555-0102' },
      { name: 'Michael Brown', email: 'michael@example.com', phone: '+1-555-0103' },
      { name: 'Emily Davis', email: 'emily@example.com', phone: '+1-555-0104' },
      { name: 'Robert Wilson', email: 'robert@example.com', phone: '+1-555-0105' }
    ];

    for (const data of customerData) {
      const hashedPassword = await bcrypt.hash('password123', 10);
      const user = await prisma.user.create({
        data: {
          ...data,
          password: hashedPassword,
          role: 'customer',
          isActive: true
        }
      });
      customers.push(user);

      // Create customer profile
      await prisma.customerProfile.create({
        data: {
          userId: user.id,
          loyaltyPoints: Math.floor(Math.random() * 500),
          totalOrdersCount: Math.floor(Math.random() * 10),
          totalSpent: parseFloat((Math.random() * 1000).toFixed(2)),
          isVerified: true
        }
      });

      // Create sample addresses
      const addresses = [
        { type: 'home', street: '123 Main St', city: 'New York', state: 'NY', postalCode: '10001', country: 'USA', isDefault: true },
        { type: 'office', street: '456 Business Ave', city: 'New York', state: 'NY', postalCode: '10002', country: 'USA', isDefault: false }
      ];

      for (const addr of addresses) {
        await prisma.address.create({
          data: {
            userId: user.id,
            ...addr
          }
        });
      }
    }
    console.log('   ✓ 5 customers created with profiles and addresses');

    // Create Menu Items
    console.log('🍰 Creating menu items...');
    const menuItems = [
      {
        name: 'Chocolate Cake',
        category: 'Cakes',
        subcategory: 'Chocolate',
        description: 'Rich, moist chocolate cake with ganache frosting',
        price: 45.99,
        preparationTime: 30,
        servingSize: 'Serves 8',
        allergens: 'Gluten, Dairy, Eggs, Nuts',
        isVegan: false,
        isGlutenFree: false,
        isOrganic: false
      },
      {
        name: 'Vanilla Cupcakes',
        category: 'Cupcakes',
        subcategory: 'Vanilla',
        description: 'Delicious vanilla cupcakes with buttercream frosting',
        price: 24.99,
        preparationTime: 20,
        servingSize: 'Pack of 12',
        allergens: 'Gluten, Dairy, Eggs',
        isVegan: false,
        isGlutenFree: false,
        isOrganic: false
      },
      {
        name: 'Strawberry Tart',
        category: 'Pastries',
        subcategory: 'Tarts',
        description: 'Fresh strawberry tart with pastry cream',
        price: 35.99,
        preparationTime: 25,
        servingSize: 'Serves 6',
        allergens: 'Gluten, Dairy, Eggs',
        isVegan: false,
        isGlutenFree: false,
        isOrganic: true
      },
      {
        name: 'Sourdough Bread',
        category: 'Bread',
        subcategory: 'Sourdough',
        description: 'Artisan sourdough bread with a crispy crust',
        price: 8.99,
        preparationTime: 120,
        servingSize: '1 loaf',
        allergens: 'Gluten',
        isVegan: true,
        isGlutenFree: false,
        isOrganic: true
      },
      {
        name: 'Chocolate Chip Cookies',
        category: 'Cookies',
        subcategory: 'Chocolate Chip',
        description: 'Homemade chocolate chip cookies',
        price: 12.99,
        preparationTime: 15,
        servingSize: 'Pack of 12',
        allergens: 'Gluten, Dairy, Eggs, Nuts',
        isVegan: false,
        isGlutenFree: false,
        isOrganic: false
      },
      {
        name: 'Gluten-Free Brownies',
        category: 'Brownies',
        subcategory: 'Gluten-Free',
        description: 'Rich brownies made with gluten-free flour',
        price: 18.99,
        preparationTime: 20,
        servingSize: 'Pack of 9',
        allergens: 'Dairy, Eggs, Nuts',
        isVegan: false,
        isGlutenFree: true,
        isOrganic: false
      },
      {
        name: 'Vegan Cheesecake',
        category: 'Cakes',
        subcategory: 'Cheesecake',
        description: 'Creamy vegan cheesecake with coconut cream',
        price: 42.99,
        preparationTime: 40,
        servingSize: 'Serves 8',
        allergens: 'Nuts, Coconut',
        isVegan: true,
        isGlutenFree: true,
        isOrganic: true
      },
      {
        name: 'Croissants',
        category: 'Pastries',
        subcategory: 'Croissants',
        description: 'Buttery French croissants',
        price: 16.99,
        preparationTime: 45,
        servingSize: 'Pack of 6',
        allergens: 'Gluten, Dairy, Eggs',
        isVegan: false,
        isGlutenFree: false,
        isOrganic: false
      }
    ];

    const createdItems = [];
    for (const item of menuItems) {
      const created = await prisma.menuItem.create({
        data: {
          ...item,
          availability: true
        }
      });
      createdItems.push(created);
    }
    console.log(`   ✓ ${createdItems.length} menu items created`);

    // Create Sample Orders
    console.log('📦 Creating sample orders...');
    for (let i = 0; i < 3; i++) {
      const customer = customers[i];
      const selectedItems = [createdItems[i % createdItems.length]];
      
      const orderItems = selectedItems.map(item => ({
        menuItemId: item.id,
        quantity: 1,
        priceAtPurchase: item.price,
        specialRequests: ''
      }));

      const totalAmount = orderItems.reduce((sum, item) => sum + (item.priceAtPurchase * item.quantity), 0);
      const taxAmount = totalAmount * 0.1;

      const order = await prisma.order.create({
        data: {
          userId: customer.id,
          addressId: null,
          items: JSON.stringify(orderItems),
          totalAmount: totalAmount + taxAmount,
          taxAmount,
          status: 'delivered',
          paymentStatus: 'completed',
          paymentMethod: 'card',
          specialInstructions: 'Please deliver in the morning'
        }
      });

      // Create payment record
      await prisma.payment.create({
        data: {
          transactionId: `TXN-${Date.now()}-${i}`,
          orderId: order.id,
          userId: customer.id,
          amount: order.totalAmount,
          paymentMethod: 'card',
          paymentGateway: 'stripe',
          status: 'completed'
        }
      });

      // Create order timeline
      await prisma.orderTimeline.create({
        data: {
          orderId: order.id,
          status: 'pending',
          message: 'Order placed'
        }
      });
      
      await prisma.orderTimeline.create({
        data: {
          orderId: order.id,
          status: 'confirmed',
          message: 'Order confirmed'
        }
      });

      await prisma.orderTimeline.create({
        data: {
          orderId: order.id,
          status: 'preparing',
          message: 'Order being prepared'
        }
      });

      await prisma.orderTimeline.create({
        data: {
          orderId: order.id,
          status: 'delivered',
          message: 'Order delivered'
        }
      });
    }
    console.log('   ✓ Sample orders created');

    // Create Sample Reviews
    console.log('⭐ Creating menu item reviews...');
    for (let i = 0; i < createdItems.length; i++) {
      const reviews = [
        { rating: 5, title: 'Delicious!', comment: 'This is amazing! Highly recommend.' },
        { rating: 4, title: 'Very Good', comment: 'Great quality and taste.' },
        { rating: 5, title: 'Best Ever', comment: 'Never had anything better!' }
      ];

      for (const review of reviews) {
        await prisma.menuItemReview.create({
          data: {
            menuItemId: createdItems[i].id,
            ...review
          }
        });
      }
    }
    console.log('   ✓ Menu item reviews created');

    // Create Sample Feedback
    console.log('💬 Creating customer feedback...');
    const feedbackList = [
      { name: 'John Doe', email: 'john@example.com', rating: 5, message: 'Excellent service and delicious cakes!', approved: true },
      { name: 'Jane Smith', email: 'jane@example.com', rating: 4, message: 'Good quality, fast delivery.', approved: true },
      { name: 'Bob Wilson', email: 'bob@example.com', rating: 5, message: 'Amazing experience!', approved: true }
    ];

    for (const feedback of feedbackList) {
      await prisma.feedback.create({
        data: feedback
      });
    }
    console.log('   ✓ Customer feedback created');

    console.log('\n✨ Database seeded successfully!\n');
    console.log('📊 Summary:');
    console.log('   • 1 Admin account (admin@deliciousbites.com / admin123)');
    console.log('   • 5 Customer accounts');
    console.log('   • 8 Menu items');
    console.log('   • 3 Sample orders with payments and timelines');
    console.log('   • Reviews and feedback');

  } catch (error) {
    console.error('❌ Seeding error:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
