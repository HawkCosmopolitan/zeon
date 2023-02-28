
let MemoryDriver = require('../../memory');
let SecurityDriver = require('../../security');

module.exports = {
    setupUser: (socket, data, socketManager) => {
        socket.pass('setupUser', data, res => {
            socket.reply(data.replyTo, res);
        });
    },
    verifyUser: (socket, data, socketManager) => {
        socket.pass('verifyUser', data, res => {
            socket.reply(data.replyTo, res);
        });
    },
    authenticate: (socket, { token, replyTo }, socketManager) => {
        MemoryDriver.instance().fetch(`auth:${token}`, userId => {
            if (userId) {
                socket.userId = userId;
                socketManager.addSocketToDictionary(socket.userId, socket);
                console.log(`user logged in with socket id : ${socket.id}`);
                socket.reply(replyTo, { success: true });
            } else {
                socket.reply(replyTo, { success: false });
            }
        });
    },
    teleport: (socket, { roomId, replyTo }, socketManager) => {
        SecurityDriver.instance().teleport(socket.userId, roomId, rights => {
            socket.rights = rights;
            socket.roomId = roomId;
            socket.reply(replyTo, {});
        });
    }
}
