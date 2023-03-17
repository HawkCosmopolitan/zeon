
const SecurityDriver = require("./drivers/security");
const StorageDriver = require("./drivers/storage");
const NetworkDriver = require("./drivers/network");
const MemoryDriver = require("./drivers/memory");
const UpdaterDriver = require("./drivers/updater");
const { addService } = require("./drivers/router/shell");

UpdaterDriver.initialize();
SecurityDriver.initialize();
StorageDriver.initialize();
MemoryDriver.initialize();
NetworkDriver.initialize();

addService({
    key: 'echo-service',
    address: 'http://localhost:5001',
    'echo': {
        needAuthentication: true,
        needAuthorization: true,
    }
});

addService({
    key: 'messenger-service',
    address: 'http://localhost:5002',
    'createTextMessage': {
        needAuthentication: true,
        needAuthorization: true,
    }
});
