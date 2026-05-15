const EventEmitter = require('events');

// Singleton event bus for deal lifecycle events.
// Using a dedicated emitter avoids polluting the global process.
const dealEmitter = new EventEmitter();

// Increase listener limit in case multiple modules subscribe in the future.
dealEmitter.setMaxListeners(20);

module.exports = dealEmitter;
