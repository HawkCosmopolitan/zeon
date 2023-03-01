
const { dbCreateInvite } = require('../../storage/transactions/create-invite');
const { dbCancelInvite } = require('../../storage/transactions/cancel-invite');
const { dbAcceptInvite } = require('../../storage/transactions/accept-invite');
const { dbDeclineInvite } = require('../../storage/transactions/decline-invite');
const errors = require('../../../../../constants/errors.json');
let MemoryDriver = require('../../memory');

module.exports.attachInviteEvents = (socket) => {
    socket.on('createInvite', async (data) => {
        let { success, invite, update } = await dbCreateInvite(data, socket.user.id);
        if (success) {
            socket.reply(data.replyTo, { status: 1, invite: invite });
        } else {
            socket.reply(data.replyTo, { status: 2, errorText: errors.DATABASE_ERROR });
        }
    });
    socket.on('cancelInvite', async (data) => {
        let { success, update } = await dbCancelInvite(data, socket.user.id);
        if (success) {
            socket.reply(data.replyTo, { status: 1 });
        } else {
            socket.reply(data.replyTo, { status: 2, errorText: errors.DATABASE_ERROR });
        }
    });
    socket.on('acceptInvite', async (data) => {
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
                MemoryDriver.instance().save(`rights:${room.id}/${socket.user.id}`, JSON.stringify(member.secret.permissions));
                socket.reply(data.replyTo, {
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
                socket.reply(data.replyTo, { status: 2, errorText: errors.DATABASE_ERROR });
            }
        });
    });
    socket.on('declineInvite', async (data) => {
        let { success } = await dbDeclineInvite(data, socket.user.id);
        if (success) {
            socket.reply(data.replyTo, { status: 1 });
        } else {
            socket.reply(data.replyTo, { status: 2, errorText: errors.DATABASE_ERROR });
        }
    });
}
