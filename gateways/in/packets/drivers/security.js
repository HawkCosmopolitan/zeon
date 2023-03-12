
let MemoryDriver = require('./memory');

class SecurityDriver {
    static inst;
    static initialize() {
        return new SecurityDriver();
    }
    static instance() {
        return SecurityDriver.inst;
    }
    publicKeys = {};
    teleport(userId, roomId, callback) {
        MemoryDriver.instance().fetch(`rights:${roomId}/${userId}`, rights => {
            if (rights) callback(JSON.parse(rights));
        });
    }
    savePublicKey(userId, pubKey) {
        this.publicKeys[userId] = pubKey;
    }
    constructor() {
        SecurityDriver.inst = this;
        this.teleport = this.teleport.bind(this);
        this.savePublicKey = this.savePublicKey.bind(this);
    }
}

module.exports = SecurityDriver;
