const crypto = require("crypto");

module.exports = {
    makeUniqueId: () => {
        return crypto.randomBytes(16).toString("hex");
    }
}
