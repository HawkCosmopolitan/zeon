
module.exports = {
    createTower: (socket, data, socketManager) => {
        if (socket.userId) {
            data.userId = socket.userId;
            socket.pass('createTower', data, res => {
                socket.reply(data.replyTo, res);
            });
        }
    },
    readTowers: (socket, data, socketManager) => {
        if (socket.userId && socket.roomId) {
            data.userId = socket.userId;
            data.roomId = socket.roomId;
            socket.pass('readTowers', data, res => {
                socket.reply(data.replyTo, res);
            });
        }
    },
    updateTower: (socket, data, socketManager) => {
        if (socket.userId) {
            data.userId = socket.userId;
            socket.pass('updateTower', data, res => {
                socket.reply(data.replyTo, res);
            });
        }
    },
    deleteTower: (socket, data, socketManager) => {
        if (socket.userId) {
            data.userId = socket.userId;
            socket.pass('deleteTower', data, res => {
                socket.reply(data.replyTo, res);
            });
        }
    }
}
