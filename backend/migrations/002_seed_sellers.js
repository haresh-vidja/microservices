/**
 * Seller Seed Data Migration
 * Creates dummy seller records for testing
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const sellerSchema = new mongoose.Schema({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  phone: { type: String, required: true },
  businessName: { type: String, required: true },
  businessType: { type: String, enum: ['individual', 'partnership', 'llc', 'corporation', 'other'], default: 'individual' },
  businessDescription: { type: String },
  address: {
    street: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    country: { type: String, required: true },
    postalCode: { type: String, required: true }
  },
  isActive: { type: Boolean, default: true },
  isVerified: { type: Boolean, default: true }
}, {
  timestamps: true,
  versionKey: false
});

const seedSellers = async () => {
  const MONGODB_URI = process.env.SELLERS_MONGODB_URI || 'mongodb://localhost:27017/sellers_db';
  
  try {
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      useCreateIndex: true,
      useFindAndModify: false
    });

    const Seller = mongoose.model('Seller', sellerSchema);
    
    // Check if sellers already exist
    const existingCount = await Seller.countDocuments();
    if (existingCount > 0) {
      console.log('✅ Sellers already exist, skipping seed...');
      return;
    }

    const dummySellers = [
      {
        firstName: 'Alex',
        lastName: 'Tech',
        email: 'alex.tech@example.com',
        password: await bcrypt.hash('password123', 12),
        phone: '2234567890',
        businessName: 'TechGadgets Store',
        businessType: 'individual',
        businessDescription: 'Electronics and gadgets retailer',
        address: {
          street: '123 Tech Street',
          city: 'San Francisco',
          state: 'California',
          country: 'USA',
          postalCode: '94105'
        }
      },
      {
        firstName: 'Maria',
        lastName: 'Fashion',
        email: 'maria.fashion@example.com',
        password: await bcrypt.hash('password123', 12),
        phone: '2234567891',
        businessName: 'Fashion Forward',
        businessType: 'llc',
        businessDescription: 'Trendy clothing and accessories',
        address: {
          street: '456 Style Avenue',
          city: 'New York',
          state: 'New York',
          country: 'USA',
          postalCode: '10001'
        }
      },
      {
        firstName: 'James',
        lastName: 'Books',
        email: 'james.books@example.com',
        password: await bcrypt.hash('password123', 12),
        phone: '2234567892',
        businessName: 'BookWorm Paradise',
        businessType: 'individual',
        businessDescription: 'New and used books marketplace',
        address: {
          street: '789 Library Lane',
          city: 'Chicago',
          state: 'Illinois',
          country: 'USA',
          postalCode: '60601'
        }
      },
      {
        firstName: 'Lisa',
        lastName: 'Home',
        email: 'lisa.home@example.com',
        password: await bcrypt.hash('password123', 12),
        phone: '2234567893',
        businessName: 'Home & Garden Plus',
        businessType: 'corporation',
        businessDescription: 'Home improvement and garden supplies',
        address: {
          street: '321 Garden Road',
          city: 'Austin',
          state: 'Texas',
          country: 'USA',
          postalCode: '73301'
        }
      },
      {
        firstName: 'Robert',
        lastName: 'Sports',
        email: 'robert.sports@example.com',
        password: await bcrypt.hash('password123', 12),
        phone: '2234567894',
        businessName: 'Athletic Pro Shop',
        businessType: 'partnership',
        businessDescription: 'Sports equipment and athletic wear',
        address: {
          street: '654 Sports Center',
          city: 'Denver',
          state: 'Colorado',
          country: 'USA',
          postalCode: '80201'
        }
      }
    ];

    const savedSellers = await Seller.insertMany(dummySellers);
    console.log('✅ Successfully seeded 5 sellers');
    
    // Display login credentials
    console.log('\n📋 Seller Login Credentials:');
    dummySellers.forEach((seller, index) => {
      console.log(`${index + 1}. Email: ${seller.email} | Password: password123 | Business: ${seller.businessName}`);
    });

    // Return seller IDs for use in products seeding
    return savedSellers.map(seller => seller._id.toString());

  } catch (error) {
    console.error('❌ Error seeding sellers:', error);
    return [];
  } finally {
    await mongoose.disconnect();
  }
};

// Run if called directly
if (require.main === module) {
  seedSellers();
}

module.exports = seedSellers;