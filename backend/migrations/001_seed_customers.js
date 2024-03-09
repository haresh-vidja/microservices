/**
 * Customer Seed Data Migration
 * Creates dummy customer records for testing
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const customerSchema = new mongoose.Schema({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  phone: { type: String, required: true },
  dateOfBirth: { type: Date },
  gender: { type: String, enum: ['male', 'female', 'other'], default: 'male' },
  isActive: { type: Boolean, default: true },
  emailVerified: { type: Boolean, default: true }
}, {
  timestamps: true,
  versionKey: false
});

const seedCustomers = async () => {
  const MONGODB_URI = process.env.CUSTOMER_MONGODB_URI || 'mongodb://localhost:27017/customer_db';
  
  try {
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      useCreateIndex: true,
      useFindAndModify: false
    });

    const Customer = mongoose.model('Customer', customerSchema);
    
    // Check if customers already exist
    const existingCount = await Customer.countDocuments();
    if (existingCount > 0) {
      console.log('✅ Customers already exist, skipping seed...');
      return;
    }

    const dummyCustomers = [
      {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        password: await bcrypt.hash('password123', 12),
        phone: '1234567890',
        dateOfBirth: new Date('1990-05-15'),
        gender: 'male'
      },
      {
        firstName: 'Jane',
        lastName: 'Smith',
        email: 'jane.smith@example.com',
        password: await bcrypt.hash('password123', 12),
        phone: '1234567891',
        dateOfBirth: new Date('1992-08-22'),
        gender: 'female'
      },
      {
        firstName: 'Mike',
        lastName: 'Johnson',
        email: 'mike.johnson@example.com',
        password: await bcrypt.hash('password123', 12),
        phone: '1234567892',
        dateOfBirth: new Date('1988-12-10'),
        gender: 'male'
      },
      {
        firstName: 'Sarah',
        lastName: 'Williams',
        email: 'sarah.williams@example.com',
        password: await bcrypt.hash('password123', 12),
        phone: '1234567893',
        dateOfBirth: new Date('1995-03-07'),
        gender: 'female'
      },
      {
        firstName: 'David',
        lastName: 'Brown',
        email: 'david.brown@example.com',
        password: await bcrypt.hash('password123', 12),
        phone: '1234567894',
        dateOfBirth: new Date('1987-11-18'),
        gender: 'male'
      }
    ];

    await Customer.insertMany(dummyCustomers);
    console.log('✅ Successfully seeded 5 customers');
    
    // Display login credentials
    console.log('\n📋 Customer Login Credentials:');
    dummyCustomers.forEach((customer, index) => {
      console.log(`${index + 1}. Email: ${customer.email} | Password: password123`);
    });

  } catch (error) {
    console.error('❌ Error seeding customers:', error);
  } finally {
    await mongoose.disconnect();
  }
};

// Run if called directly
if (require.main === module) {
  seedCustomers();
}

module.exports = seedCustomers;