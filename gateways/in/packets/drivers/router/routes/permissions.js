
const { openedAuth } = require('../../../utils/auth');

const { dbCreateInvite } = require('../../../database/transactions/create-invite');
const { dbCancelInvite } = require('../../../database/transactions/cancel-invite');
const { dbAcceptInvite } = require('../../../database/transactions/accept-invite');
const { dbDeclineInvite } = require('../../../database/transactions/decline-invite');
const { replySocketReq, handleUpdate } = require('../utils');
const errors = require('../../../../constants/errors.json');
const { putRoom, join, indexWorkspace, getSocket } = require('../pool');
const { dbModifyPermissions } = require('../../../database/transactions/modify-permissions');
const { dbFetchPermissions } = require('../../../database/transactions/fetch-permissions');

module.exports.attachPermissionsEvents = (socket) => {
    socket.on('modifyPermissions', async (data) => {
        if (socket.user !== undefined) {
            let { success, update } = await dbModifyPermissions(data, socket.user.id);
            if (success) {
                let targetSocket = getSocket(data?.targetUserId)?.rawSocket;
                if (targetSocket?.roomId === data?.roomId) {
                    targetSocket.rights = data.permissions;
                }
                replySocketReq(socket, data, { status: 1 });
                handleUpdate(update);
            } else {
                replySocketReq(socket, data, { status: 2, errorText: errors.DATABASE_ERROR });
            }
        }
    });
    socket.on('fetchPermissions', async (data) => {
        if (socket.user !== undefined) {
            let { success, permissions } = await dbFetchPermissions(data, socket.user.id);
            if (success) {
                replySocketReq(socket, data, { status: 1, permissions: permissions });
            } else {
                replySocketReq(socket, data, { status: 2, errorText: errors.DATABASE_ERROR });
            }
        }
    });
}
