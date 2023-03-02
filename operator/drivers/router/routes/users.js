
const { dbReadUsers } = require('../../storage/transactions/read-users');
const { dbReadUserById } = require('../../storage/transactions/read-user-by-id');

const errors = require('../../../../constants/errors.json');
const UserFactory = require('../../storage/factories/user-factory');

module.exports.attachUserEvents = (socket) => {
    socket.on('readUsers', async (data) => {
        let { success, users } = await dbReadUsers(data, data.userId, data.roomId);
        if (success) {
            socket.reply(data.replyToInternal, { status: 1, users: users });
        } else {
            socket.reply(data.replyToInternal, { status: 2, errorText: errors.DATABASE_ERROR });
        }
    });
    socket.on('readUserById', async (data) => {
        let user = await UserFactory.instance().find(data.targetUserId);
        if (user) {
            let onlineState = user.secret.isOnline;
            let lastSeen = user.sucret.lastSeen;
            if (!onlineState) {
                socket.reply(data.replyToInternal, { status: 1, user: user, onlineState: false, lastSeen: lastSeen });
            } else {
                socket.reply(data.replyToInternal, { status: 1, user: user, onlineState: true });
            }
        } else {
            socket.reply(data.replyToInternal, { status: 2, errorText: errors.DATABASE_ERROR });
        }
    });
}
