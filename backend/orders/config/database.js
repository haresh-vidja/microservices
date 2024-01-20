/**
 * MongoDB connection for Orders Service
 * Manages database connection specific to orders service
 */

const mongoose = require('mongoose');
const config = require('./index');

/**
 * Establishes connection to Orders MongoDB database
 * @returns {Promise} MongoDB connection promise
 */
const connectDB = async () => {
  try {
    // Set mongoose debug mode in development
    if (config.env === 'development') {
      mongoose.set('debug', true);
    }

    // Connect to MongoDB
    const connection = await mongoose.connect(config.database.uri, config.database.options);
    
    console.log(`Orders DB connected: ${connection.connection.host}/${connection.connection.name}`);
    
    // Handle connection events
    mongoose.connection.on('error', (err) => {
      console.error('Orders DB connection error:', err);
    });

    mongoose.connection.on('disconnected', () => {
      console.warn('Orders DB disconnected');
    });

    mongoose.connection.on('reconnected', () => {
      console.info('Orders DB reconnected');
    });

    return connection;
  } catch (error) {
    console.error('Orders DB connection failed:', error);
    // Retry connection after 5 seconds
    setTimeout(connectDB, 5000);
  }
};

/**
 * Disconnects from MongoDB
 * @returns {Promise} Disconnect promise
 */
const disconnectDB = async () => {
  try {
    await mongoose.connection.close();
    console.info('Orders DB disconnected successfully');
  } catch (error) {
    console.error('Error disconnecting from Orders DB:', error);
  }
};

/**
 * Gets the current connection status
 * @returns {string} Connection status
 */
const getConnectionStatus = () => {
  const states = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting'
  };
  return states[mongoose.connection.readyState];
};

module.exports = {
  connectDB,
  disconnectDB,
  getConnectionStatus
};