
let MemoryDriver = require('../../memory');
let SecurityDriver = require('../../security');

module.exports = {
    authenticate: (socket, { token }, socketManager) => {
        MemoryDriver.instance().fetch(`auth:${token}`, userId => {
            if (userId) {
                socket.userId = userId;
                socketManager.addSocketToDictionary(socket.userId, socket);
                console.log(`user logged in with socket id : ${socket.id}`);
                socket.reply(requestId, {});
            }
        });
    },
    teleport: (socket, { roomId, requestId }, socketManager) => {
        SecurityDriver.instance().teleport(socket.userId, roomId, rights => {
            socket.rights = rights;
            socket.roomId = roomId;
            socket.reply(requestId, {});
        });
    }
}
