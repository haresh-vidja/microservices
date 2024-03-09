/**
 * Admin Seed Data Migration
 * Creates admin user records for testing
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const adminSchema = new mongoose.Schema({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  phone: { type: String },
  role: { 
    type: String, 
    enum: ['super_admin', 'admin', 'moderator'], 
    default: 'admin' 
  },
  permissions: [{
    type: String,
    enum: [
      'manage_users', 'manage_sellers', 'manage_products', 
      'manage_orders', 'view_analytics', 'manage_settings',
      'send_notifications', 'moderate_content'
    ]
  }],
  isActive: { type: Boolean, default: true },
  lastLogin: { type: Date }
}, {
  timestamps: true,
  versionKey: false
});

const seedAdmin = async () => {
  const MONGODB_URI = process.env.ADMIN_MONGODB_URI || 'mongodb://localhost:27017/admin_db';
  
  try {
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      useCreateIndex: true,
      useFindAndModify: false
    });

    const Admin = mongoose.model('Admin', adminSchema);
    
    // Check if admin already exists
    const existingCount = await Admin.countDocuments();
    if (existingCount > 0) {
      console.log('✅ Admin users already exist, skipping seed...');
      return;
    }

    const dummyAdmins = [
      {
        firstName: 'Super',
        lastName: 'Admin',
        email: 'admin@example.com',
        password: await bcrypt.hash('admin123', 12),
        phone: '3334567890',
        role: 'super_admin',
        permissions: [
          'manage_users', 'manage_sellers', 'manage_products', 
          'manage_orders', 'view_analytics', 'manage_settings',
          'send_notifications', 'moderate_content'
        ]
      },
      {
        firstName: 'Store',
        lastName: 'Manager',
        email: 'manager@example.com',
        password: await bcrypt.hash('manager123', 12),
        phone: '3334567891',
        role: 'admin',
        permissions: [
          'manage_sellers', 'manage_products', 'manage_orders', 
          'view_analytics', 'moderate_content'
        ]
      },
      {
        firstName: 'Content',
        lastName: 'Moderator',
        email: 'moderator@example.com',
        password: await bcrypt.hash('moderator123', 12),
        phone: '3334567892',
        role: 'moderator',
        permissions: [
          'manage_products', 'moderate_content', 'send_notifications'
        ]
      }
    ];

    await Admin.insertMany(dummyAdmins);
    console.log('✅ Successfully seeded 3 admin users');
    
    // Display login credentials
    console.log('\n📋 Admin Login Credentials:');
    console.log('1. Super Admin - Email: admin@example.com | Password: admin123');
    console.log('2. Store Manager - Email: manager@example.com | Password: manager123');
    console.log('3. Content Moderator - Email: moderator@example.com | Password: moderator123');

  } catch (error) {
    console.error('❌ Error seeding admin users:', error);
  } finally {
    await mongoose.disconnect();
  }
};

// Run if called directly
if (require.main === module) {
  seedAdmin();
}

module.exports = seedAdmin;