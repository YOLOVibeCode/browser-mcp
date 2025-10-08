#!/usr/bin/env node

/**
 * MessageQueue - Queue messages when extension is offline
 *
 * Stores messages while WebSocket is disconnected
 * Flushes when connection is restored
 */

class MessageQueue {
  constructor(options = {}) {
    this.options = {
      maxSize: options.maxSize || 100,
      ...options
    };

    this.queue = [];
    this.flushHandlers = [];
  }

  /**
   * Add message to queue
   */
  add(message) {
    // Check if queue is full
    if (this.queue.length >= this.options.maxSize) {
      this.log('Queue full, dropping oldest message');
      this.queue.shift(); // Remove oldest
    }

    this.queue.push({
      message,
      timestamp: Date.now()
    });

    this.log('Message queued', {
      queueSize: this.queue.length,
      messageId: message.id
    });
  }

  /**
   * Get all queued messages
   */
  getAll() {
    return this.queue.map(item => item.message);
  }

  /**
   * Get queue size
   */
  size() {
    return this.queue.length;
  }

  /**
   * Check if queue is empty
   */
  isEmpty() {
    return this.queue.length === 0;
  }

  /**
   * Clear queue
   */
  clear() {
    const count = this.queue.length;
    this.queue = [];
    this.log('Queue cleared', { count });
  }

  /**
   * Flush queue (send all messages)
   */
  async flush(sendFunction) {
    if (this.isEmpty()) {
      return;
    }

    this.log('Flushing queue', { count: this.queue.length });

    const messages = [...this.queue];
    this.queue = [];

    // Send all messages
    for (const { message } of messages) {
      try {
        await sendFunction(message);
        this.log('Flushed message', { id: message.id });
      } catch (error) {
        this.log('Failed to flush message', {
          id: message.id,
          error: error.message
        });
        // Re-queue on error
        this.add(message);
      }
    }
  }

  /**
   * Register flush handler
   */
  onFlush(handler) {
    this.flushHandlers.push(handler);
  }

  /**
   * Get queue statistics
   */
  getStats() {
    if (this.isEmpty()) {
      return {
        size: 0,
        oldestAge: 0,
        newestAge: 0
      };
    }

    const now = Date.now();
    const oldest = this.queue[0].timestamp;
    const newest = this.queue[this.queue.length - 1].timestamp;

    return {
      size: this.queue.length,
      oldestAge: now - oldest,
      newestAge: now - newest
    };
  }

  /**
   * Log helper
   */
  log(message, data = {}) {
    const timestamp = new Date().toISOString();
    const logData = {
      timestamp,
      component: 'MessageQueue',
      message,
      ...data
    };
    process.stderr.write(JSON.stringify(logData) + '\n');
  }
}

module.exports = MessageQueue;
