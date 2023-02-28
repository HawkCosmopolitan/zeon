
const { replySocketReq } = require('../utils');

const { dbReadUsers } = require('../../../database/transactions/read-users');
const { dbReadUserById } = require('../../../database/transactions/read-user-by-id');

const errors = require('../../../../constants/errors.json');
const { getUser, isUserOnline, lastSeen } = require('../pool');

module.exports.attachUserEvents = (socket) => {
    socket.on('readUsers', async (data) => {
        if (socket.user !== undefined) {
            let { success, users } = await dbReadUsers(data, socket.user.id, socket.roomId);
            if (success) {
                replySocketReq(socket, data, { status: 1, users: users });
            } else {
                replySocketReq(socket, data, { status: 2, errorText: errors.DATABASE_ERROR });
            }
        }
    });
    socket.on('readUserById', async (data) => {
        let user = getUser(data.targetUserId);
        if (user) {
            let onlineState = isUserOnline(user.id);
            if (!onlineState) {
                replySocketReq(socket, data, { status: 1, user: user, onlineState: false, lastSeen: lastSeen(user.id) });
            } else {
                replySocketReq(socket, data, { status: 1, user: user, onlineState: true });
            }
        } else {
            replySocketReq(socket, data, { status: 2, errorText: errors.DATABASE_ERROR });
        }
    });
}
