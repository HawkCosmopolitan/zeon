
class NetworkDriver {
    static inst;
    static initialize() {
        return new NetworkDriver();
    }
    static instance() {
        return NetworkDriver.inst;
    }
    socketServer;
    constructor() {
        NetworkDriver.inst = this;
        this.socketServer = io();
    }
}

module.exports = NetworkDriver;
