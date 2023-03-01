
module.exports = {
    createRoom: (socket, data, socketManager) => {
        if (socket.userId) {
            data.userId = socket.userId;
            socket.pass('createRoom', data, res => {
                socket.reply(data.replyTo, res);
            });
        }
    },
    readRooms: (socket, data, socketManager) => {
        if (socket.userId) {
            data.userId = socket.userId;
            socket.pass('readRooms', data, res => {
                socket.reply(data.replyTo, res);
            });
        }
    },
    updateRoom: (socket, data, socketManager) => {
        if (socket.userId) {
            data.userId = socket.userId;
            socket.pass('updateRoom', data, res => {
                socket.reply(data.replyTo, res);
            });
        }
    },
    deleteRoom: (socket, data, socketManager) => {
        if (socket.userId) {
            data.userId = socket.userId;
            socket.pass('deleteRoom', data, res => {
                socket.reply(data.replyTo, res);
            });
        }
    },
    readRoomById: (socket, data, socketManager) => {
        if (socket.userId) {
            data.userId = socket.userId;
            socket.pass('readRoomById', data, res => {
                socket.reply(data.replyTo, res);
            });
        }
    }
}
