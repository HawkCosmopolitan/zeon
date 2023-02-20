
let MemoryDriver = require('../../memory');

module.exports = {
    authenticate: (socket, { token }, socketManager) => {
        MemoryDriver.instance().fetch(`auth:${token}`, userId => {
            if (userId) {
                socket.userId = userId;
                socketManager.addSocketToDictionary(socket.userId, socket);
                console.log(`user logged in with socket id : ${socket.id}`);
            }
        })
    }
}
