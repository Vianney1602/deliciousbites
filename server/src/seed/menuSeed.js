const prisma = require('../prisma');

async function seedMenu() {
  const products = [
    // Cupcakes (price per piece)
    { name: 'Vanilla Delight', category: 'Cupcakes', price: 25 },
    { name: 'Tutti Frutti', category: 'Cupcakes', price: 30 },
    { name: 'Pineapple Bliss', category: 'Cupcakes', price: 30 },
    { name: 'Strawberry Swirl', category: 'Cupcakes', price: 35 },
    { name: 'Butterscotch Caramel', category: 'Cupcakes', price: 35 },
    { name: 'Blackcurrant Burst', category: 'Cupcakes', price: 35 },
    { name: 'Chocolate Fudge', category: 'Cupcakes', price: 40 },
    { name: 'Oreo Creamy Crunch', category: 'Cupcakes', price: 40 },
    { name: 'Red Velvet Love', category: 'Cupcakes', price: 45 },
    { name: 'Litchi', category: 'Cupcakes', price: 45 },
    { name: 'Nutty Heaven', category: 'Cupcakes', price: 45 },
    { name: 'Choco Hazelnut', category: 'Cupcakes', price: 50 },

    // Chocolates (using small size price as base)
    { name: 'Dark Chocolate', category: 'Chocolates', price: 10 },
    { name: 'Milk Chocolate', category: 'Chocolates', price: 10 },
    { name: 'Coffee Chocolate', category: 'Chocolates', price: 15 },
    { name: 'White Chocolate', category: 'Chocolates', price: 15 },
    { name: 'Strawberry Chocolate', category: 'Chocolates', price: 15 },
    { name: 'Blueberry Chocolate', category: 'Chocolates', price: 15 },
    { name: 'Mango Chocolate', category: 'Chocolates', price: 15 },
    { name: 'Rasmalai Chocolate', category: 'Chocolates', price: 15 },
    { name: 'Paan Chocolate', category: 'Chocolates', price: 15 },
    { name: 'Orange Chocolate', category: 'Chocolates', price: 25 },
    { name: 'Pineapple Chocolate', category: 'Chocolates', price: 25 },

    // Special Chocolates (small size price)
    { name: 'Badam Chocolate', category: 'Chocolates', price: 16 },
    { name: 'Cashew Chocolate', category: 'Chocolates', price: 18 },
    { name: 'Pista Chocolate', category: 'Chocolates', price: 25 },
    { name: 'DryFruit Mix Chocolate', category: 'Chocolates', price: 20 },
    { name: 'Nutella Chocolate', category: 'Chocolates', price: 18 },
    { name: 'Kunafa Chocolate', category: 'Chocolates', price: 35 },

    // Cookies (price per weight pack)
    { name: 'Butter Jam Cookies', category: 'Cookies', price: 160 },
    { name: 'Ragi Cookies', category: 'Cookies', price: 200 },
    { name: 'Karachi Cookies', category: 'Cookies', price: 220 },
    { name: 'Wheat Cookies', category: 'Cookies', price: 230 },
    { name: 'Coconut Cookies', category: 'Cookies', price: 250 },
    { name: 'Choco Butter Cookies', category: 'Cookies', price: 250 },
    { name: 'Honey Oats Coconut Cookies', category: 'Cookies', price: 250 },
    { name: 'Choco Almond Cookies', category: 'Cookies', price: 270 },
    { name: 'Coffee Bean Cookies', category: 'Cookies', price: 360 },
    { name: 'Peanut Butter Cookies', category: 'Cookies', price: 370 },
    { name: 'Red Velvet Cheese Cookies', category: 'Cookies', price: 400 },

    // Classic Brownies (250g, includes platter brownies)
    { name: 'Fudge Brownie 250g', category: 'Classic Brownies', price: 300 },
    { name: 'Oreo Brownie 250g', category: 'Classic Brownies', price: 300 },
    { name: 'Choco Chips Brownie 250g', category: 'Classic Brownies', price: 325 },
    { name: 'White Chocolate Brownie 250g', category: 'Classic Brownies', price: 325 },
    { name: 'Nuts Brownie 250g', category: 'Classic Brownies', price: 350 },
    { name: 'Red Velvet Brownie 250g', category: 'Classic Brownies', price: 375 },
    { name: 'Walnut Brownie 250g', category: 'Classic Brownies', price: 375 },
    { name: 'Brownie Slab 250g', category: 'Classic Brownies', price: 250 },
    { name: 'Coffee Brownie 250g', category: 'Classic Brownies', price: 300 },
    { name: 'Brownie Bites 250g', category: 'Classic Brownies', price: 325 },
    { name: 'Peanut Butter Brownie 250g', category: 'Classic Brownies', price: 325 },
    { name: 'Lotus Biscoff Brownie 250g', category: 'Classic Brownies', price: 350 },
    { name: 'Nutella/Hazelnut Brownie 250g', category: 'Classic Brownies', price: 375 },

    // Special Brownies (250g)
    { name: 'Double Chocolate Brownie 250g', category: 'Special Brownies', price: 425 },
    { name: 'Triple Chocolate Brownie 250g', category: 'Special Brownies', price: 450 },
    { name: 'Death by Chocolate Brownie 250g', category: 'Special Brownies', price: 475 },
    { name: 'Ferrero Rocher Brownie 250g', category: 'Special Brownies', price: 500 },

    // Classic Fruit Cakes (500g / 1Kg) - separate products per size
    { name: 'Vanilla Cake 500g', category: 'Classic Fruit Cakes', price: 380 },
    { name: 'Vanilla Cake 1Kg', category: 'Classic Fruit Cakes', price: 685 },
    { name: 'Black Forest Cake 500g', category: 'Classic Fruit Cakes', price: 420 },
    { name: 'Black Forest Cake 1Kg', category: 'Classic Fruit Cakes', price: 755 },
    { name: 'White Forest Cake 500g', category: 'Classic Fruit Cakes', price: 420 },
    { name: 'White Forest Cake 1Kg', category: 'Classic Fruit Cakes', price: 755 },
    { name: 'Strawberry Cake 500g', category: 'Classic Fruit Cakes', price: 420 },
    { name: 'Strawberry Cake 1Kg', category: 'Classic Fruit Cakes', price: 755 },
    { name: 'Pineapple Cake 500g', category: 'Classic Fruit Cakes', price: 420 },
    { name: 'Pineapple Cake 1Kg', category: 'Classic Fruit Cakes', price: 755 },
    { name: 'Mango Cake 500g', category: 'Classic Fruit Cakes', price: 420 },
    { name: 'Mango Cake 1Kg', category: 'Classic Fruit Cakes', price: 755 },
    { name: 'Butterscotch Cake 500g', category: 'Classic Fruit Cakes', price: 420 },
    { name: 'Butterscotch Cake 1Kg', category: 'Classic Fruit Cakes', price: 755 },
    { name: 'Blackcurrant Cake 500g', category: 'Classic Fruit Cakes', price: 420 },
    { name: 'Blackcurrant Cake 1Kg', category: 'Classic Fruit Cakes', price: 755 },
    { name: 'Rose Milk Cake 500g', category: 'Classic Fruit Cakes', price: 420 },
    { name: 'Rose Milk Cake 1Kg', category: 'Classic Fruit Cakes', price: 755 },
    { name: 'Watermelon Cake 500g', category: 'Classic Fruit Cakes', price: 440 },
    { name: 'Watermelon Cake 1Kg', category: 'Classic Fruit Cakes', price: 795 },
    { name: 'Blueberry Cake 500g', category: 'Classic Fruit Cakes', price: 440 },
    { name: 'Blueberry Cake 1Kg', category: 'Classic Fruit Cakes', price: 795 },

    // Special Cakes (500g / 1Kg) - separate products per size
    { name: 'Oreo Cake 500g', category: 'Special Cakes', price: 440 },
    { name: 'Oreo Cake 1Kg', category: 'Special Cakes', price: 795 },
    { name: 'Red Velvet Cake 500g', category: 'Special Cakes', price: 540 },
    { name: 'Red Velvet Cake 1Kg', category: 'Special Cakes', price: 975 },
    { name: 'Fresh Fruit Cake 500g', category: 'Special Cakes', price: 540 },
    { name: 'Fresh Fruit Cake 1Kg', category: 'Special Cakes', price: 975 },
    { name: 'Choco Truffle Cake 500g', category: 'Special Cakes', price: 610 },
    { name: 'Choco Truffle Cake 1Kg', category: 'Special Cakes', price: 1100 },
    { name: 'Rasmalai Cake 500g', category: 'Special Cakes', price: 720 },
    { name: 'Rasmalai Cake 1Kg', category: 'Special Cakes', price: 1300 },
    { name: 'Gulab Jamun Cake 500g', category: 'Special Cakes', price: 720 },
    { name: 'Gulab Jamun Cake 1Kg', category: 'Special Cakes', price: 1300 },
    { name: 'Rainbow Cake 500g', category: 'Special Cakes', price: 720 },
    { name: 'Rainbow Cake 1Kg', category: 'Special Cakes', price: 1300 },
    { name: 'Pinta Cake 500g', category: 'Special Cakes', price: 840 },
    { name: 'Pinta Cake 1Kg', category: 'Special Cakes', price: 1510 },
    { name: 'Death by Chocolate Cake 500g', category: 'Special Cakes', price: 1000 },
    { name: 'Death by Chocolate Cake 1Kg', category: 'Special Cakes', price: 1800 },
    { name: 'Nuts Overloaded Cake 500g', category: 'Special Cakes', price: 1000 },
    { name: 'Nuts Overloaded Cake 1Kg', category: 'Special Cakes', price: 1800 },

    // Blondies (per piece)
    { name: 'Choco Chip Blondie', category: 'Blondies', price: 50 },
    { name: 'Milk White Blondie', category: 'Blondies', price: 60 },
    { name: 'Strawberry Blondie', category: 'Blondies', price: 65 },
    { name: 'Blackcurrant Blondie', category: 'Blondies', price: 65 },
    { name: 'Kinder Blondie', category: 'Blondies', price: 80 },

    // Donuts (per piece)
    { name: 'Plain Glazed Donut', category: 'Donuts', price: 50 },
    { name: 'Chocolate Glazed Donut', category: 'Donuts', price: 60 },
    { name: 'Jelly Filled Donut', category: 'Donuts', price: 60 },
    { name: 'Chocolate Filled Donut', category: 'Donuts', price: 70 },
    { name: 'Vanilla Cake Donut', category: 'Donuts', price: 50 },
    { name: 'Chocolate Cake Donut', category: 'Donuts', price: 60 },
    { name: 'Vanilla Frosted Donut', category: 'Donuts', price: 60 },
    { name: 'Chocolate Frosted Donut', category: 'Donuts', price: 65 },
    { name: 'Vanilla Sprinkle Donut', category: 'Donuts', price: 70 },
    { name: 'Chocolate Sprinkle Donut', category: 'Donuts', price: 80 },
    { name: 'Vanilla Coconut Donut', category: 'Donuts', price: 70 },
    { name: 'Chocolate Coconut Donut', category: 'Donuts', price: 80 }
  ];

  for (const p of products) {
    await prisma.menuItem.upsert({
      where: {
        name_category: {
          name: p.name,
          category: p.category
        }
      },
      update: {},
      create: {
        name: p.name,
        category: p.category,
        description: '',
        price: p.price,
        availability: true,
        imageUrl: ''
      }
    });
  }

  console.log('Menu seeded successfully');
}

module.exports = seedMenu;

