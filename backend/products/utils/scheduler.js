/**
 * Scheduler Utilities
 * 
 * @fileoverview Cron jobs and scheduled tasks for the products service
 * @description Manages automated background tasks including inventory cleanup,
 * synchronization, and initialization. Uses node-cron for scheduling and
 * provides task management capabilities.
 * 
 * @author Haresh Vidja
 * @version 1.0.0
 * @since 2023-11-01
 * @requires node-cron
 */

const cron = require('node-cron');
const inventoryService = require('../services/inventoryService');
const config = require('../config');

/**
 * Scheduler Class
 * @description Manages all scheduled tasks and background jobs for the products service
 */
class Scheduler {
  /**
   * Constructor
   * @description Initializes the scheduler with an empty tasks array
   */
  constructor() {
    /**
     * Array to store all scheduled tasks
     * @type {Array<Object>}
     */
    this.tasks = [];
  }

  /**
   * Initialize all scheduled tasks
   * @description Sets up all automated background tasks and schedules them
   * @returns {void}
   */
  init() {
    // Disable scheduler in test environment to prevent interference
    if (process.env.NODE_ENV === 'test') {
      console.log('⏰ Scheduler disabled in test environment');
      return;
    }

    // Set up all scheduled tasks
    this.setupInventoryCleanup();      // Clean expired reservations
    this.setupInventorySync();         // Sync inventory with products
    this.setupInventoryInitialization(); // Initialize inventory on startup

    console.log('⏰ Scheduler initialized with', this.tasks.length, 'tasks');
  }

  /**
   * Set up inventory cleanup task
   * @description Runs every 10 minutes to clean expired inventory reservations
   * @returns {void}
   */
  setupInventoryCleanup() {
    // Schedule task to run every 10 minutes
    const task = cron.schedule('*/10 * * * *', async () => {
      try {
        // Clean expired inventory reservations
        const result = await inventoryService.cleanExpiredReservations();
        
        // Log success if any reservations were cleaned
        if (result.cleanedCount > 0) {
          console.log(`🧹 Cleaned ${result.cleanedCount} expired reservations`);
        }
      } catch (error) {
        console.error('❌ Error cleaning expired reservations:', error);
      }
    }, {
      scheduled: true,
      timezone: 'UTC' // Use UTC timezone for consistency
    });

    // Store task information for management
    this.tasks.push({
      name: 'inventory-cleanup',
      schedule: '*/10 * * * *', // Cron expression: every 10 minutes
      description: 'Clean expired inventory reservations',
      task
    });
  }

  /**
   * Set up inventory synchronization task
   * @description Runs every hour to sync product stock with inventory data
   * @returns {void}
   */
  setupInventorySync() {
    // Schedule task to run every hour at minute 0
    const task = cron.schedule('0 * * * *', async () => {
      try {
        // Synchronize product inventory with current stock levels
        const result = await inventoryService.syncProductInventory();
        
        // Log success if any products were synced
        if (result.synced > 0) {
          console.log(`🔄 Synced ${result.synced} products with inventory`);
        }
      } catch (error) {
        console.error('❌ Error syncing inventory:', error);
      }
    }, {
      scheduled: true,
      timezone: 'UTC' // Use UTC timezone for consistency
    });

    // Store task information for management
    this.tasks.push({
      name: 'inventory-sync',
      schedule: '0 * * * *', // Cron expression: every hour at minute 0
      description: 'Sync product stock with inventory data',
      task
    });
  }

  /**
   * Set up inventory initialization task
   * @description Runs once on startup with a 5-second delay to ensure database connection
   * @returns {void}
   */
  setupInventoryInitialization() {
    // Use setTimeout for one-time initialization with delay
    setTimeout(async () => {
      try {
        // Initialize inventory records for all products
        const result = await inventoryService.initializeAllInventory();
        
        // Log initialization results
        if (result.initialized > 0) {
          console.log(`✅ Initialized inventory for ${result.initialized} products`);
        } else {
          console.log('✅ All products already have inventory records');
        }
      } catch (error) {
        console.error('❌ Error initializing inventory:', error);
      }
    }, 5000); // 5 second delay to allow database connection to establish
  }

  /**
   * Get information about all scheduled tasks
   * @description Returns array of task information for monitoring and debugging
   * @returns {Array<Object>} Array of task objects with name, schedule, and description
   */
  getTasksInfo() {
    return this.tasks.map(task => ({
      name: task.name,
      schedule: task.schedule,
      description: task.description
    }));
  }

  /**
   * Shutdown all scheduled tasks
   * @description Stops all running cron jobs and cleans up resources
   * @returns {void}
   */
  shutdown() {
    console.log('🛑 Shutting down scheduler...');
    
    // Stop all scheduled tasks
    this.tasks.forEach(task => {
      if (task.task && typeof task.task.stop === 'function') {
        task.task.stop();
        console.log(`⏹️  Stopped task: ${task.name}`);
      }
    });
    
    // Clear tasks array
    this.tasks = [];
    console.log('✅ Scheduler shutdown complete');
  }
}

// Export scheduler instance
module.exports = new Scheduler();