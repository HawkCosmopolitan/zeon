
module.exports = {
    createInteraction: async (data) => {
        if (socket.userId) {
            data.userId = socket.userId;
            socket.pass('createInteraction', data, res => {
                socket.reply(data.replyTo, res);
            });
        }
    },
    readInteractions: async (data) => {
        if (socket.userId) {
            data.userId = socket.userId;
            socket.pass('readInteractions', data, res => {
                socket.reply(data.replyTo, res);
            });
        }
    }
}
