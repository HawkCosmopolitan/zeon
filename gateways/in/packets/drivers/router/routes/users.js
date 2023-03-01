
module.exports = {
    readUsers: (socket, data, socketManager) => {
        if (socket.userId && socket.roomId) {
            data.userId = socket.userId;
            data.roomId = socket.roomId;
            socket.pass('readUsers', data, res => {
                socket.reply(data.replyTo, res);
            });
        }
    },
    readUserById: (socket, data, socketManager) => {
        socket.pass('readUserById', data, res => {
            socket.reply(data.replyTo, res);
        });
    }
}
