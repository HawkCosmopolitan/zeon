
class SecurityDriver {
    static inst;
    static initialize() {
        return new SecurityDriver();
    }
    static instance() {
        return SecurityDriver.inst;
    }
    teleport(workspaceId) {
        
    }
    constructor() {
        SecurityDriver.inst = this;
    }
}

module.exports = SecurityDriver;
