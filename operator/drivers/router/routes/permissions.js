
const errors = require('../../../../constants/errors.json');
const { dbModifyPermissions } = require('../../storage/transactions/modify-permissions');
const { dbFetchPermissions } = require('../../storage/transactions/fetch-permissions');
const broadcastTypes = require('../../updater/broadcast-types.json');

module.exports.attachPermissionsEvents = (socket) => {
    socket.on('modifyPermissions', async (data) => {
        let { success, update } = await dbModifyPermissions(data, socket.user.id);
        if (success) {
            await MemoryDriver.instance().save(`rights:${data.roomId}/${data.targetUserId}`, data.permissions);
            socket.reply(data.replyToInternal, { status: 1 });
            UpdaterDriver.instance().handleUpdate(broadcastTypes.USER, update);
        } else {
            socket.reply(data.replyToInternal, { status: 2, errorText: errors.DATABASE_ERROR });
        }
    });
    socket.on('fetchPermissions', async (data) => {
        let { success, permissions } = await dbFetchPermissions(data, data.userId);
        if (success) {
            socket.reply(data.replyToInternal, { status: 1, permissions: permissions });
        } else {
            socket.reply(data.replyToInternal, { status: 2, errorText: errors.DATABASE_ERROR });
        }
    });
}
