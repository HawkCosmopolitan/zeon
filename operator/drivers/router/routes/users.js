
const { dbReadUsers } = require('../../storage/transactions/read-users');
const { dbReadUserById } = require('../../storage/transactions/read-user-by-id');

const errors = require('../../../../constants/errors.json');

module.exports.attachUserEvents = (socket) => {
    socket.on('readUsers', async (data) => {
        if (socket.user !== undefined) {
            let { success, users } = await dbReadUsers(data, socket.user.id, socket.roomId);
            if (success) {
                socket.reply(data.replyTo, { status: 1, users: users });
            } else {
                socket.reply(data.replyTo, { status: 2, errorText: errors.DATABASE_ERROR });
            }
        }
    });
    socket.on('readUserById', async (data) => {
        let user = getUser(data.targetUserId);
        if (user) {
            let onlineState = isUserOnline(user.id);
            if (!onlineState) {
                socket.reply(data.replyTo, { status: 1, user: user, onlineState: false, lastSeen: lastSeen(user.id) });
            } else {
                socket.reply(data.replyTo, { status: 1, user: user, onlineState: true });
            }
        } else {
            socket.reply(data.replyTo, { status: 2, errorText: errors.DATABASE_ERROR });
        }
    });
}
