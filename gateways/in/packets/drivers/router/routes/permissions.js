
module.exports = {
    modifyPermissions: (socket, data, socketManager) => {
        if (socket.userId) {
            data.userId = socket.userId;
            socket.pass('modifyPermissions', data, res => {
                socket.reply(data.replyTo, res);
            });
        }
    },
    fetchPermissions: (socket, data, socketManager) => {
        if (socket.userId) {
            data.userId = socket.userId;
            socket.pass('fetchPermissions', data, res => {
                socket.reply(data.replyTo, res);
            });
        }
    }
}
