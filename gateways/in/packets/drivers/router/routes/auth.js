
let MemoryDriver = require('../../memory');
let SecurityDriver = require('../../security');

module.exports = {
    authenticate: (socket, { token }, socketManager) => {
        MemoryDriver.instance().fetch(`auth:${token}`, userId => {
            if (userId) {
                socket.userId = userId;
                socketManager.addSocketToDictionary(socket.userId, socket);
                console.log(`user logged in with socket id : ${socket.id}`);
            }
        })
    },
    teleport: (socket, { workspaceId }, socketManager) => {
        SecurityDriver.instance().teleport(workspaceId, rights => {
            socket.rights = rights;
        })
    }
}
