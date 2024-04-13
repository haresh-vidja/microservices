/**
 * Scheduler Utilities
 * Cron jobs and scheduled tasks
 */

const cron = require('node-cron');
const inventoryService = require('../services/inventoryService');
const config = require('../config');

class Scheduler {
  constructor() {
    this.tasks = [];
  }

  /**
   * Initialize all scheduled tasks
   */
  init() {
    if (process.env.NODE_ENV === 'test') {
      console.log('⏰ Scheduler disabled in test environment');
      return;
    }

    this.setupInventoryCleanup();
    this.setupInventorySync();
    this.setupInventoryInitialization();

    console.log('⏰ Scheduler initialized with', this.tasks.length, 'tasks');
  }

  /**
   * Clean expired reservations every 10 minutes
   */
  setupInventoryCleanup() {
    const task = cron.schedule('*/10 * * * *', async () => {
      try {
        const result = await inventoryService.cleanExpiredReservations();
        if (result.cleanedCount > 0) {
          console.log(`🧹 Cleaned ${result.cleanedCount} expired reservations`);
        }
      } catch (error) {
        console.error('❌ Error cleaning expired reservations:', error);
      }
    }, {
      scheduled: true,
      timezone: 'UTC'
    });

    this.tasks.push({
      name: 'inventory-cleanup',
      schedule: '*/10 * * * *',
      description: 'Clean expired inventory reservations',
      task
    });
  }

  /**
   * Sync inventory with products every hour
   */
  setupInventorySync() {
    const task = cron.schedule('0 * * * *', async () => {
      try {
        const result = await inventoryService.syncProductInventory();
        if (result.synced > 0) {
          console.log(`🔄 Synced ${result.synced} products with inventory`);
        }
      } catch (error) {
        console.error('❌ Error syncing inventory:', error);
      }
    }, {
      scheduled: true,
      timezone: 'UTC'
    });

    this.tasks.push({
      name: 'inventory-sync',
      schedule: '0 * * * *',
      description: 'Sync product stock with inventory data',
      task
    });
  }

  /**
   * Initialize inventory on startup (delayed)
   */
  setupInventoryInitialization() {
    setTimeout(async () => {
      try {
        const result = await inventoryService.initializeAllInventory();
        if (result.initialized > 0) {
          console.log(`✅ Initialized inventory for ${result.initialized} products`);
        } else {
          console.log('✅ All products already have inventory records');
        }
      } catch (error) {
        console.error('❌ Error initializing inventory:', error);
      }
    }, 5000); // 5 second delay to allow database connection
  }

  /**
   * Stop all scheduled tasks
   */
  shutdown() {
    this.tasks.forEach(({ name, task }) => {
      task.destroy();
      console.log(`⏹️ Stopped scheduled task: ${name}`);
    });
    
    this.tasks = [];
    console.log('⏹️ Scheduler shutdown complete');
  }

  /**
   * Get information about all scheduled tasks
   */
  getTasksInfo() {
    return this.tasks.map(({ name, schedule, description }) => ({
      name,
      schedule,
      description,
      status: 'running'
    }));
  }

  /**
   * Manually trigger a specific task
   */
  async triggerTask(taskName) {
    switch (taskName) {
      case 'inventory-cleanup':
        return await inventoryService.cleanExpiredReservations();
      
      case 'inventory-sync':
        return await inventoryService.syncProductInventory();
      
      case 'inventory-initialize':
        return await inventoryService.initializeAllInventory();
      
      default:
        throw new Error(`Unknown task: ${taskName}`);
    }
  }
}

module.exports = new Scheduler();