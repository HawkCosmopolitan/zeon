
const { dbCreateInvite } = require('../../storage/transactions/create-invite');
const { dbCancelInvite } = require('../../storage/transactions/cancel-invite');
const { dbAcceptInvite } = require('../../storage/transactions/accept-invite');
const { dbDeclineInvite } = require('../../storage/transactions/decline-invite');
const errors = require('../../../../constants/errors.json');
let MemoryDriver = require('../../memory');
const broadcastTypes = require('../../updater/broadcast-types.json');
const UpdaterDriver = require('../../updater');

module.exports.attachInviteEvents = (socket) => {
    socket.on('createInvite', async (data) => {
        let { success, invite, update } = await dbCreateInvite(data, data.userId);
        if (success) {
            socket.reply(data.replyToInternal, { status: 1, invite: invite });
            UpdaterDriver.instance().handleUpdate(broadcastTypes.USER, update);
        } else {
            socket.reply(data.replyToInternal, { status: 2, errorText: errors.DATABASE_ERROR });
        }
    });
    socket.on('cancelInvite', async (data) => {
        let { success, update } = await dbCancelInvite(data, data.userId);
        if (success) {
            socket.reply(data.replyToInternal, { status: 1 });
            UpdaterDriver.instance().handleUpdate(broadcastTypes.USER, update);
        } else {
            socket.reply(data.replyToInternal, { status: 2, errorText: errors.DATABASE_ERROR });
        }
    });
    socket.on('acceptInvite', async (data) => {
        dbAcceptInvite(data, data.userId, ({
            success,
            member,
            tower,
            room,
            rooms,
            memberships,
            update }) => {
            if (success) {
                MemoryDriver.instance().save(`rights:${room.id}/${data.userId}`, JSON.stringify(member.secret.permissions));
                UpdaterDriver.instance().joinQueueToExchange(`queue_${member.userId}`, `exchange_${room.id}`),
                UpdaterDriver.instance().joinQueueToExchange(`queue_${member.userId}`, `exchange_${tower.id}`),
                socket.reply(data.replyToInternal, {
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
                UpdaterDriver.instance().handleUpdate(broadcastTypes.USER, update);
            } else {
                socket.reply(data.replyToInternal, { status: 2, errorText: errors.DATABASE_ERROR });
            }
        });
    });
    socket.on('declineInvite', async (data) => {
        let { success } = await dbDeclineInvite(data, data.userId);
        if (success) {
            socket.reply(data.replyToInternal, { status: 1 });
        } else {
            socket.reply(data.replyToInternal, { status: 2, errorText: errors.DATABASE_ERROR });
        }
    });
}
