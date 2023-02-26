
let MemoryDriver = require('../../memory');
let SecurityDriver = require('../../security');

module.exports = {
    setupUser: (socket, data, socketManager) => {
        socket.pass('setupUser', data, res => {
            socket.reply(data.requestId, res);
        });
    },
    verifyUser: (socket, data, socketManager) => {
        socket.pass('verifyUser', data, res => {
            socket.reply(data.requestId, res);
        });
    },
    authenticate: (socket, { token, requestId }, socketManager) => {
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
