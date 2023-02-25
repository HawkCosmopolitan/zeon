
class StorageDriver {
    static inst;
    static initialize() {
        return new StorageDriver();
    }
    static instance() {
        return StorageDriver.inst;
    }
    constructor() {
        StorageDriver.inst = this;
    }
}

module.exports = StorageDriver;
