
class NetworkDriver {
    static inst;
    static initialize() {
        return new NetworkDriver();
    }
    static instance() {
        return NetworkDriver.inst;
    }
    constructor() {
        NetworkDriver.inst = this;
    }
}

module.exports = NetworkDriver;
