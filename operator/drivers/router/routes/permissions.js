
const errors = require('../../../../constants/errors.json');
const { dbModifyPermissions } = require('../../storage/transactions/modify-permissions');
const { dbFetchPermissions } = require('../../storage/transactions/fetch-permissions');

module.exports.attachPermissionsEvents = (socket) => {
    socket.on('modifyPermissions', async (data) => {
        let { success, update } = await dbModifyPermissions(data, socket.user.id);
        if (success) {
            await MemoryDriver.instance().save(`rights:${data.roomId}/${data.targetUserId}`, data.permissions);
            socket.reply(data.replyTo, { status: 1 });
        } else {
            socket.reply(data.replyTo, { status: 2, errorText: errors.DATABASE_ERROR });
        }
    });
    socket.on('fetchPermissions', async (data) => {
        let { success, permissions } = await dbFetchPermissions(data, data.userId);
        if (success) {
            socket.reply(data.replyTo, { status: 1, permissions: permissions });
        } else {
            socket.reply(data.replyTo, { status: 2, errorText: errors.DATABASE_ERROR });
        }
    });
}
