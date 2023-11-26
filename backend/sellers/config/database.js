/**
 * MongoDB connection for Sellers Service
 * Manages database connection specific to sellers service
 */

const mongoose = require('mongoose');
const config = require('./index');

/**
 * Establishes connection to Sellers MongoDB database
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
    
    console.log(`Sellers DB connected: ${connection.connection.host}/${connection.connection.name}`);
    
    // Handle connection events
    mongoose.connection.on('error', (err) => {
      console.error('Sellers DB connection error:', err);
    });

    mongoose.connection.on('disconnected', () => {
      console.warn('Sellers DB disconnected');
    });

    mongoose.connection.on('reconnected', () => {
      console.info('Sellers DB reconnected');
    });

    return connection;
  } catch (error) {
    console.error('Sellers DB connection failed:', error);
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
    console.info('Sellers DB disconnected successfully');
  } catch (error) {
    console.error('Error disconnecting from Sellers DB:', error);
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