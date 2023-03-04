
class StorageDriver {
    static inst;
    static initialize(callback) {
        return new StorageDriver(callback);
    }
    static instance() {
        return StorageDriver.inst;
    }
    constructor(callback) {
        StorageDriver.inst = this;
        callback();
    }
}

module.exports = StorageDriver;
