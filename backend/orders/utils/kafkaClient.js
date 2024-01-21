/**
 * Kafka Client Utility
 * Handles event messaging for non-dependent data communication
 */

const { Kafka } = require('kafkajs');
const config = require('../config');
const logger = require('./logger');

class KafkaClient {
  constructor() {
    this.kafka = Kafka({
      clientId: config.kafka.clientId,
      brokers: config.kafka.brokers,
      retry: {
        initialRetryTime: 100,
        retries: 8
      }
    });

    this.producer = null;
    this.consumer = null;
    this.isConnected = false;
  }

  /**
   * Initialize Kafka producer
   */
  async initProducer() {
    try {
      this.producer = this.kafka.producer({
        maxInFlightRequests: 1,
        idempotent: true,
        transactionTimeout: 30000
      });

      await this.producer.connect();
      logger.info('Kafka producer connected');
      return this.producer;
    } catch (error) {
      logger.error('Failed to initialize Kafka producer:', error);
      throw error;
    }
  }

  /**
   * Initialize Kafka consumer
   */
  async initConsumer() {
    try {
      this.consumer = this.kafka.consumer({
        groupId: config.kafka.groupId,
        sessionTimeout: 30000,
        heartbeatInterval: 3000
      });

      await this.consumer.connect();
      logger.info('Kafka consumer connected');
      return this.consumer;
    } catch (error) {
      logger.error('Failed to initialize Kafka consumer:', error);
      throw error;
    }
  }

  /**
   * Publish order events
   */
  async publishOrderEvent(eventType, orderData) {
    try {
      if (!this.producer) {
        await this.initProducer();
      }

      const message = {
        topic: 'orders',
        messages: [{
          key: orderData.orderNumber,
          value: JSON.stringify({
            eventType,
            orderId: orderData.id,
            orderNumber: orderData.orderNumber,
            customerId: orderData.customerId,
            timestamp: new Date().toISOString(),
            data: orderData
          }),
          headers: {
            'event-type': eventType,
            'service': 'orders-service',
            'version': '1.0'
          }
        }]
      };

      await this.producer.send(message);
      logger.info(`Order event published: ${eventType}`, {
        orderNumber: orderData.orderNumber,
        customerId: orderData.customerId
      });

    } catch (error) {
      logger.error('Failed to publish order event:', error);
      throw error;
    }
  }

  /**
   * Publish inventory events
   */
  async publishInventoryEvent(eventType, inventoryData) {
    try {
      if (!this.producer) {
        await this.initProducer();
      }

      const message = {
        topic: 'inventory',
        messages: [{
          key: inventoryData.productId,
          value: JSON.stringify({
            eventType,
            productId: inventoryData.productId,
            sellerId: inventoryData.sellerId,
            timestamp: new Date().toISOString(),
            data: inventoryData
          }),
          headers: {
            'event-type': eventType,
            'service': 'orders-service',
            'version': '1.0'
          }
        }]
      };

      await this.producer.send(message);
      logger.info(`Inventory event published: ${eventType}`, {
        productId: inventoryData.productId,
        sellerId: inventoryData.sellerId
      });

    } catch (error) {
      logger.error('Failed to publish inventory event:', error);
      throw error;
    }
  }

  /**
   * Publish notification events
   */
  async publishNotificationEvent(eventType, notificationData) {
    try {
      if (!this.producer) {
        await this.initProducer();
      }

      const message = {
        topic: 'notifications',
        messages: [{
          key: notificationData.recipientId || notificationData.orderId,
          value: JSON.stringify({
            eventType,
            recipientId: notificationData.recipientId,
            recipientType: notificationData.recipientType, // 'customer' or 'seller'
            timestamp: new Date().toISOString(),
            data: notificationData
          }),
          headers: {
            'event-type': eventType,
            'service': 'orders-service',
            'version': '1.0'
          }
        }]
      };

      await this.producer.send(message);
      logger.info(`Notification event published: ${eventType}`, {
        recipientId: notificationData.recipientId,
        recipientType: notificationData.recipientType
      });

    } catch (error) {
      logger.error('Failed to publish notification event:', error);
      throw error;
    }
  }

  /**
   * Subscribe to topics
   */
  async subscribe(topics, messageHandler) {
    try {
      if (!this.consumer) {
        await this.initConsumer();
      }

      await this.consumer.subscribe({ topics });

      await this.consumer.run({
        eachMessage: async ({ topic, partition, message }) => {
          try {
            const eventData = JSON.parse(message.value.toString());
            const eventType = message.headers['event-type']?.toString();
            
            logger.info(`Received event from ${topic}:`, {
              eventType,
              partition,
              offset: message.offset
            });

            await messageHandler(topic, eventType, eventData, message);

          } catch (error) {
            logger.error('Error processing Kafka message:', error);
          }
        }
      });

      logger.info(`Subscribed to topics: ${topics.join(', ')}`);
      this.isConnected = true;

    } catch (error) {
      logger.error('Failed to subscribe to Kafka topics:', error);
      throw error;
    }
  }

  /**
   * Disconnect from Kafka
   */
  async disconnect() {
    try {
      if (this.producer) {
        await this.producer.disconnect();
        this.producer = null;
      }

      if (this.consumer) {
        await this.consumer.disconnect();
        this.consumer = null;
      }

      this.isConnected = false;
      logger.info('Kafka client disconnected');

    } catch (error) {
      logger.error('Error disconnecting from Kafka:', error);
    }
  }

  /**
   * Health check
   */
  async healthCheck() {
    try {
      const admin = this.kafka.admin();
      await admin.connect();
      
      const metadata = await admin.fetchTopicMetadata();
      await admin.disconnect();

      return {
        status: 'healthy',
        brokers: config.kafka.brokers,
        topics: metadata.topics.map(t => t.name)
      };

    } catch (error) {
      logger.error('Kafka health check failed:', error);
      return {
        status: 'unhealthy',
        error: error.message
      };
    }
  }
}

module.exports = new KafkaClient();