
const { dbCreateTower } = require('../../storage/transactions/create-tower');
const { dbReadTowers } = require('../../storage/transactions/read-towers');
const { dbUpdateTower } = require('../../storage/transactions/update-tower');
const { dbDeleteTower } = require('../../storage/transactions/delete-tower');
let MemoryDriver = require('../../memory');

const errors = require('../../../../constants/errors.json');

module.exports.attachTowerEvents = (socket) => {
    socket.on('createTower', async (data) => {
        let { success, tower, room, member } = await dbCreateTower(data, data.userId);
        if (success) {
            await MemoryDriver.instance().save(`rights:${room.id}/${data.userId}`, JSON.stringify(member.secret.permissions));
            socket.reply(data.replyToInternal, { status: 1, tower: tower, room: room, member: member });
        } else {
            socket.reply(data.replyToInternal, { status: 2, errorText: errors.DATABASE_ERROR });
        }
    });
    socket.on('readTowers', async (data) => {
        let { success, towers } = await dbReadTowers(data, data.userId, data.roomId);
        if (success) {
            socket.reply(data.replyToInternal, { status: 1, towers: towers });
        } else {
            socket.reply(data.replyToInternal, { status: 2, errorText: errors.DATABASE_ERROR });
        }
    });
    socket.on('updateTower', async (data) => {
        let { success } = await dbUpdateTower(data, data.userId);
        if (success) {
            socket.reply(data.replyToInternal, { status: 1 });
        } else {
            socket.reply(data.replyToInternal, { status: 2, errorText: errors.DATABASE_ERROR });
        }
    });
    socket.on('deleteTower', async (data) => {
        let { success } = await dbDeleteTower(data, data.userId);
        if (success) {
            socket.reply(data.replyToInternal, { status: 1 });
        } else {
            socket.reply(data.replyToInternal, { status: 2, errorText: errors.DATABASE_ERROR });
        }
    });
}
