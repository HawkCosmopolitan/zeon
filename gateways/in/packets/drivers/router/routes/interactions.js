
module.exports = {
    createInteraction: async (socket, data, socketManager) => {
        if (socket.userId) {
            data.userId = socket.userId;
            socket.pass('createInteraction', data, res => {
                socket.reply(data.replyTo, res);
            });
        }
    },
    readInteractions: async (socket, data, socketManager) => {
        if (socket.userId) {
            data.userId = socket.userId;
            socket.pass('readInteractions', data, res => {
                socket.reply(data.replyTo, res);
            });
        }
    }
}
