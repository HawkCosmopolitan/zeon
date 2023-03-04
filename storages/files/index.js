
const NetworkDriver = require('./drivers/network');
const StorageDriver = require('./drivers/storage');
const { setupDatabase } = require('./drivers/storage/initiators/main-initiator');

StorageDriver.initialize(() => {
  NetworkDriver.initialize();
  setupDatabase();
});
