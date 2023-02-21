
class SecurityDriver {
    static inst;
    static initialize() {
        return new SecurityDriver();
    }
    static instance() {
        return SecurityDriver.inst;
    }
    constructor() {
        SecurityDriver.inst = this;
    }
}

module.exports = SecurityDriver;
