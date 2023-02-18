
let MemoryDriver = require('./memory');

class SecurityDriver {
    static inst;
    static initialize() {
        return new SecurityDriver();
    }
    static instance() {
        return SecurityDriver.inst;
    }
    teleport(workspaceId, callback) {
        MemoryDriver.instance().fetch(`rights:${workspaceId}`, rights => {
            if (rights) callback(JSON.parse(rights));
        });
    }
    constructor() {
        SecurityDriver.inst = this;
        this.teleport = this.teleport.bind(this);
    }
}

module.exports = SecurityDriver;
