
module.exports = {
    readDocById: async (socket, data, socketManager) => {
        MemoryDriver.instance().fetch(`rights:${data.roomId}/${socket.userId}`, raw => {
            if (raw) {
                let permissions = JSON.parse(raw);
                if (permissions.uploadFile) {
                    data.userId = socket.userId;
                    data.isMember = true;
                    socket.pass('readDocById', data, res => {
                        socket.reply(data.replyTo, res);
                    });
                }
            } else {
                data.userId = socket.userId;
                data.isMember = false;
                socket.pass('readDocById', data, res => {
                    socket.reply(data.replyTo, res);
                });
            }
        });
    }
};
