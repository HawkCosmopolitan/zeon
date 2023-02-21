
const { dbCreateInvite } = require('../../storage/transactions/create-invite');
const { dbCancelInvite } = require('../../storage/transactions/cancel-invite');
const { dbAcceptInvite } = require('../../storage/transactions/accept-invite');
const { dbDeclineInvite } = require('../../storage/transactions/decline-invite');
const { replySocketReq, handleUpdate } = require('../utils');
const errors = require('../../../../constants/errors.json');

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
                rooms,
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
                    replySocketReq(socket, data, {
                        status: 1,
                        member,
                        tower,
                        room,
                        rooms,
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
