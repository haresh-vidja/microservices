#!/usr/bin/env node
/**
 * Migration Runner
 * Runs all seed migrations in sequence
 */

const path = require('path');
const { exec } = require('child_process');
const { promisify } = require('util');

const execAsync = promisify(exec);

// Import migration functions
const seedCustomers = require('./001_seed_customers');
const seedSellers = require('./002_seed_sellers');
const seedAdmin = require('./003_seed_admin');
const seedProducts = require('./004_seed_products');

const runMigrations = async () => {
  console.log('🚀 Starting database migrations...\n');
  
  try {
    // 1. Seed Customers
    console.log('1️⃣ Running customer migration...');
    await seedCustomers();
    console.log('');

    // 2. Seed Sellers and get seller IDs
    console.log('2️⃣ Running seller migration...');
    const sellerIds = await seedSellers();
    console.log('');

    // 3. Seed Admin
    console.log('3️⃣ Running admin migration...');
    await seedAdmin();
    console.log('');

    // 4. Seed Products with seller IDs
    console.log('4️⃣ Running products migration...');
    await seedProducts(sellerIds);
    console.log('');

    console.log('✅ All migrations completed successfully!\n');
    
    console.log('🔑 Summary of Login Credentials:');
    console.log('==================================');
    
    console.log('\n👥 CUSTOMERS:');
    console.log('Email: john.doe@example.com | Password: password123');
    console.log('Email: jane.smith@example.com | Password: password123');
    console.log('Email: mike.johnson@example.com | Password: password123');
    console.log('Email: sarah.williams@example.com | Password: password123');
    console.log('Email: david.brown@example.com | Password: password123');
    
    console.log('\n🏪 SELLERS:');
    console.log('Email: alex.tech@example.com | Password: password123');
    console.log('Email: maria.fashion@example.com | Password: password123');
    console.log('Email: james.books@example.com | Password: password123');
    console.log('Email: lisa.home@example.com | Password: password123');
    console.log('Email: robert.sports@example.com | Password: password123');
    
    console.log('\n👑 ADMIN:');
    console.log('Email: admin@example.com | Password: admin123 (Super Admin)');
    console.log('Email: manager@example.com | Password: manager123 (Store Manager)');
    console.log('Email: moderator@example.com | Password: moderator123 (Moderator)');
    
    console.log('\n📦 PRODUCTS: 10 products created across 5 categories');
    console.log('\n🎉 Ready to test the application!');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
};

// Command line options
const args = process.argv.slice(2);
const command = args[0];

switch (command) {
  case 'customers':
    console.log('Running customer migration only...');
    seedCustomers().then(() => process.exit(0));
    break;
  
  case 'sellers':
    console.log('Running seller migration only...');
    seedSellers().then(() => process.exit(0));
    break;
  
  case 'admin':
    console.log('Running admin migration only...');
    seedAdmin().then(() => process.exit(0));
    break;
  
  case 'products':
    console.log('Running products migration only...');
    seedProducts().then(() => process.exit(0));
    break;
  
  case 'reset':
    console.log('⚠️  Resetting all databases...');
    resetDatabases().then(() => {
      console.log('✅ Databases reset. Running fresh migrations...');
      runMigrations();
    });
    break;
  
  default:
    runMigrations();
    break;
}

async function resetDatabases() {
  const databases = [
    'customer_db',
    'sellers_db', 
    'admin_db',
    'products_db'
  ];
  
  for (const db of databases) {
    try {
      await execAsync(`mongo ${db} --eval "db.dropDatabase()"`);
      console.log(`🗑️  Dropped database: ${db}`);
    } catch (error) {
      console.log(`⚠️  Could not drop ${db}: ${error.message}`);
    }
  }
}

// Handle process termination
process.on('SIGINT', () => {
  console.log('\n⏹️  Migration interrupted');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n⏹️  Migration terminated');
  process.exit(0);
});