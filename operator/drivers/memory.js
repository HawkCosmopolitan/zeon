
class MemoryDriver {
    static inst;
    static initialize() {
        return new MemoryDriver();
    }
    static instance() {
        return MemoryDriver.inst;
    }
    constructor() {
        MemoryDriver.inst = this;
    }
}

module.exports = MemoryDriver;
