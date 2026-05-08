const axios = require('axios');

async function checkCloudinaryUrls() {
  try {
    const response = await axios.get('http://localhost:5000/api/products');
    const products = response.data;
    
    console.log(`Total Products: ${products.length}`);
    
    const withCloudinary = products.filter(p => p.imageUrl && p.imageUrl.includes('cloudinary.com'));
    
    if (withCloudinary.length > 0) {
      console.log('✅ Found products with Cloudinary URLs:');
      withCloudinary.forEach(p => {
        console.log(`- ID: ${p.id}, Name: ${p.name}, URL: ${p.imageUrl}`);
      });
    } else {
      console.log('❌ No products found with Cloudinary URLs.');
    }
  } catch (error) {
    console.error('Error fetching products:', error.message);
  }
}

checkCloudinaryUrls();
