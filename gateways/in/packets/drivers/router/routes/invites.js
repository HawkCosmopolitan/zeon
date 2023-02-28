
const { openedAuth } = require('../../../utils/auth');

const { dbCreateInvite } = require('../../../database/transactions/create-invite');
const { dbCancelInvite } = require('../../../database/transactions/cancel-invite');
const { dbAcceptInvite } = require('../../../database/transactions/accept-invite');
const { dbDeclineInvite } = require('../../../database/transactions/decline-invite');
const { replySocketReq, handleUpdate } = require('../utils');
const errors = require('../../../../constants/errors.json');
const { putRoom, join, indexWorkspace } = require('../pool');

module.exports.attachInviteEvents = (socket) => {
    socket.on('createInvite', async (data) => {
        if (socket.user !== undefined && socket.rights?.inviteUser) {
            let { success, invite, update } = await dbCreateInvite(data, socket.user.id);
            if (success) {
                replySocketReq(socket, data, { status: 1, invite: invite });
                handleUpdate(update);
            } else {
                replySocketReq(socket, data, { status: 2, errorText: errors.DATABASE_ERROR });
            }
        }
    });
    socket.on('cancelInvite', async (data) => {
        if (socket.user !== undefined) {
            let { success, update } = await dbCancelInvite(data, socket.user.id);
            if (success) {
                replySocketReq(socket, data, { status: 1 });
                handleUpdate(update);
            } else {
                replySocketReq(socket, data, { status: 2, errorText: errors.DATABASE_ERROR });
            }
        }
    });
    socket.on('acceptInvite', async (data) => {
        if (socket.user !== undefined) {
            dbAcceptInvite(data, socket.user.id, ({
                success,
                member,
                tower,
                room,
                workspace,
                rooms,
                workspaces,
                memberships,
                filespaces,
                disks,
                folders,
                files,
                documents,
                blogs,
                posts,
                update }) => {
                if (success) {
                    putRoom(room);
                    join(socket.user.id, room.id);
                    indexWorkspace(workspace);
                    replySocketReq(socket, data, {
                        status: 1,
                        member,
                        tower,
                        room,
                        workspace,
                        rooms,
                        workspaces,
                        memberships,
                        filespaces,
                        disks,
                        folders,
                        files,
                        documents,
                        blogs,
                        posts
                    });
                    handleUpdate(update);
                } else {
                    replySocketReq(socket, data, { status: 2, errorText: errors.DATABASE_ERROR });
                }
            });
        }
    });
    socket.on('declineInvite', async (data) => {
        if (socket.user !== undefined) {
            let { success } = await dbDeclineInvite(data, socket.user.id);
            if (success) {
                replySocketReq(socket, data, { status: 1 });
            } else {
                replySocketReq(socket, data, { status: 2, errorText: errors.DATABASE_ERROR });
            }
        }
    });
}
