/**
 * Products Seed Data Migration
 * Creates dummy product records for testing
 */

const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 200 },
  description: { type: String, maxlength: 1000 },
  price: { type: Number, required: true, min: 0 },
  category: { type: String, required: true, trim: true },
  sellerId: { type: String, required: true, index: true },
  images: [{
    url: String,
    isPrimary: { type: Boolean, default: false }
  }],
  stock: { type: Number, default: 0, min: 0 },
  isActive: { type: Boolean, default: true },
  tags: [String],
  specifications: mongoose.Schema.Types.Mixed
}, {
  timestamps: true,
  versionKey: false
});

const seedProducts = async (sellerIds = []) => {
  const MONGODB_URI = process.env.PRODUCTS_MONGODB_URI || 'mongodb://localhost:27017/products_db';
  
  try {
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      useCreateIndex: true,
      useFindAndModify: false
    });

    const Product = mongoose.model('Product', productSchema);
    
    // Check if products already exist
    const existingCount = await Product.countDocuments();
    if (existingCount > 0) {
      console.log('✅ Products already exist, skipping seed...');
      return;
    }

    // Use provided seller IDs or create dummy ones
    const defaultSellerIds = sellerIds.length > 0 ? sellerIds : [
      '507f1f77bcf86cd799439011',
      '507f1f77bcf86cd799439012', 
      '507f1f77bcf86cd799439013',
      '507f1f77bcf86cd799439014',
      '507f1f77bcf86cd799439015'
    ];

    const dummyProducts = [
      // Electronics
      {
        name: 'iPhone 13 Pro',
        description: 'Latest Apple smartphone with advanced camera system and A15 Bionic chip',
        price: 999.99,
        category: 'electronics',
        sellerId: defaultSellerIds[0],
        images: [
          { url: 'https://via.placeholder.com/400x400?text=iPhone+13+Pro', isPrimary: true },
          { url: 'https://via.placeholder.com/400x400?text=iPhone+13+Pro+Back', isPrimary: false }
        ],
        stock: 25,
        tags: ['apple', 'smartphone', 'ios', 'camera'],
        specifications: {
          'Screen Size': '6.1 inches',
          'Storage': '128GB',
          'RAM': '6GB',
          'Camera': '12MP Triple Camera',
          'Battery': '3095mAh'
        }
      },
      {
        name: 'Samsung Galaxy Watch',
        description: 'Smart watch with health monitoring and GPS tracking',
        price: 329.99,
        category: 'electronics',
        sellerId: defaultSellerIds[0],
        images: [
          { url: 'https://via.placeholder.com/400x400?text=Galaxy+Watch', isPrimary: true }
        ],
        stock: 15,
        tags: ['samsung', 'smartwatch', 'fitness', 'health'],
        specifications: {
          'Display': '1.4-inch AMOLED',
          'Battery Life': '4 days',
          'Water Resistance': '50m',
          'Connectivity': 'Bluetooth, WiFi, LTE'
        }
      },

      // Clothing
      {
        name: 'Designer Cotton T-Shirt',
        description: 'Premium quality cotton t-shirt with modern fit',
        price: 29.99,
        category: 'clothing',
        sellerId: defaultSellerIds[1],
        images: [
          { url: 'https://via.placeholder.com/400x400?text=Cotton+T-Shirt', isPrimary: true },
          { url: 'https://via.placeholder.com/400x400?text=T-Shirt+Back', isPrimary: false }
        ],
        stock: 50,
        tags: ['cotton', 'casual', 'comfortable', 'unisex'],
        specifications: {
          'Material': '100% Cotton',
          'Fit': 'Regular',
          'Care': 'Machine wash cold',
          'Origin': 'Made in USA'
        }
      },
      {
        name: 'Leather Jacket',
        description: 'Genuine leather jacket with premium finish',
        price: 199.99,
        category: 'clothing',
        sellerId: defaultSellerIds[1],
        images: [
          { url: 'https://via.placeholder.com/400x400?text=Leather+Jacket', isPrimary: true }
        ],
        stock: 12,
        tags: ['leather', 'jacket', 'premium', 'fashion'],
        specifications: {
          'Material': 'Genuine Leather',
          'Lining': 'Polyester',
          'Closure': 'Zipper',
          'Care': 'Professional clean only'
        }
      },

      // Books
      {
        name: 'JavaScript: The Complete Guide',
        description: 'Comprehensive guide to modern JavaScript programming',
        price: 45.99,
        category: 'books',
        sellerId: defaultSellerIds[2],
        images: [
          { url: 'https://via.placeholder.com/400x400?text=JavaScript+Book', isPrimary: true }
        ],
        stock: 30,
        tags: ['javascript', 'programming', 'web development', 'coding'],
        specifications: {
          'Pages': '800 pages',
          'Publisher': 'Tech Books Inc',
          'Edition': '3rd Edition',
          'Language': 'English'
        }
      },
      {
        name: 'The Art of War',
        description: 'Classic strategy book by Sun Tzu',
        price: 12.99,
        category: 'books',
        sellerId: defaultSellerIds[2],
        images: [
          { url: 'https://via.placeholder.com/400x400?text=Art+of+War', isPrimary: true }
        ],
        stock: 20,
        tags: ['classic', 'strategy', 'philosophy', 'leadership'],
        specifications: {
          'Pages': '273 pages',
          'Publisher': 'Classic Books',
          'ISBN': '978-0123456789',
          'Format': 'Paperback'
        }
      },

      // Home & Garden
      {
        name: 'Robot Vacuum Cleaner',
        description: 'Smart robot vacuum with app control and mapping',
        price: 299.99,
        category: 'home',
        sellerId: defaultSellerIds[3],
        images: [
          { url: 'https://via.placeholder.com/400x400?text=Robot+Vacuum', isPrimary: true }
        ],
        stock: 18,
        tags: ['smart home', 'cleaning', 'robot', 'automation'],
        specifications: {
          'Battery Life': '120 minutes',
          'Suction Power': '2000Pa',
          'Dustbin Capacity': '600ml',
          'Navigation': 'LiDAR mapping'
        }
      },
      {
        name: 'Garden Tool Set',
        description: '10-piece professional garden tool set with carrying case',
        price: 89.99,
        category: 'home',
        sellerId: defaultSellerIds[3],
        images: [
          { url: 'https://via.placeholder.com/400x400?text=Garden+Tools', isPrimary: true }
        ],
        stock: 22,
        tags: ['gardening', 'tools', 'outdoor', 'professional'],
        specifications: {
          'Pieces': '10 tools',
          'Material': 'Stainless steel',
          'Handle': 'Ergonomic grip',
          'Warranty': '2 years'
        }
      },

      // Sports
      {
        name: 'Professional Tennis Racket',
        description: 'High-performance tennis racket for advanced players',
        price: 149.99,
        category: 'sports',
        sellerId: defaultSellerIds[4],
        images: [
          { url: 'https://via.placeholder.com/400x400?text=Tennis+Racket', isPrimary: true }
        ],
        stock: 14,
        tags: ['tennis', 'racket', 'professional', 'sports'],
        specifications: {
          'Weight': '300g',
          'Head Size': '100 sq in',
          'String Pattern': '16x19',
          'Grip Size': '4 1/4'
        }
      },
      {
        name: 'Yoga Mat Premium',
        description: 'Non-slip yoga mat with alignment lines',
        price: 39.99,
        category: 'sports',
        sellerId: defaultSellerIds[4],
        images: [
          { url: 'https://via.placeholder.com/400x400?text=Yoga+Mat', isPrimary: true }
        ],
        stock: 35,
        tags: ['yoga', 'fitness', 'exercise', 'wellness'],
        specifications: {
          'Thickness': '6mm',
          'Material': 'TPE',
          'Size': '183cm x 61cm',
          'Features': 'Non-slip, eco-friendly'
        }
      }
    ];

    await Product.insertMany(dummyProducts);
    console.log(`✅ Successfully seeded ${dummyProducts.length} products`);
    
    // Display product categories
    console.log('\n📦 Products Created by Category:');
    const categories = [...new Set(dummyProducts.map(p => p.category))];
    categories.forEach(category => {
      const count = dummyProducts.filter(p => p.category === category).length;
      console.log(`   ${category}: ${count} products`);
    });

  } catch (error) {
    console.error('❌ Error seeding products:', error);
  } finally {
    await mongoose.disconnect();
  }
};

// Run if called directly
if (require.main === module) {
  seedProducts();
}

module.exports = seedProducts;