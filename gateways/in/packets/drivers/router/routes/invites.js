
const errors = require('../../../../../../constants/errors.json');

module.exports = {
    createInvite: async (data) => {
        if (socket.userId) {
            MemoryDriver.instance().fetch(`rights:${data.roomId}/${socket.userId}`, raw => {
                let permissions = JSON.parse(raw);
                if (permissions.inviteUser) {
                    data.userId = socket.userId;
                    socket.pass('createInvite', data, res => {
                        socket.reply(data.replyTo, res);
                    });
                } else {
                    socket.reply(socket, data, { status: 2, errorText: errors.ACCESS_DENIED });
                }
            });
        }
    },
    cancelInvite: async (data) => {
        if (socket.userId) {
            data.userId = socket.userId;
            socket.pass('fetchPermissions', data, res => {
                socket.reply(data.replyTo, res);
            });
        }
    },
    acceptInvite: async (data) => {
        if (socket.userId) {
            data.userId = socket.userId;
            socket.pass('acceptInvite', data, res => {
                socket.reply(data.replyTo, res);
            });
        }
    },
    declineInvite: async (data) => {
        if (socket.userId) {
            data.userId = socket.userId;
            socket.pass('declineInvite', data, res => {
                socket.reply(data.replyTo, res);
            });
        }
    }
}
