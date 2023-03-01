
const NetworkDriver = require('./drivers/network');
const MemoryDriver = require('./drivers/memory');
const StorageDriver = require('./drivers/storage');
const SecurityDriver = require('./drivers/security');
const { setupDatabase } = require('./drivers/storage/initiators/main-initiator');

SecurityDriver.initialize();
StorageDriver.initialize(() => {
  MemoryDriver.initialize();
  NetworkDriver.initialize();
  setupDatabase();
});
