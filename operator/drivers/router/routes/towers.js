
const { dbCreateTower } = require('../../storage/transactions/create-tower');
const { dbReadTowers } = require('../../storage/transactions/read-towers');
const { dbUpdateTower } = require('../../storage/transactions/update-tower');
const { dbDeleteTower } = require('../../storage/transactions/delete-tower');
let MemoryDriver = require('../../memory');

const errors = require('../../../../constants/errors.json');

module.exports.attachTowerEvents = (socket) => {
    socket.on('createTower', async (data) => {
        if (socket.user !== undefined) {
            let { success, tower, room, member } = await dbCreateTower(data, socket.user.id);
            if (success) {
                MemoryDriver.instance().save(`rights:${room.id}/${socket.user.id}`, JSON.stringify(member1.secret.permissions));
                socket.reply(data.replyTo, { status: 1, tower: tower, room: room, member: member });
            } else {
                socket.reply(data.replyTo, { status: 2, errorText: errors.DATABASE_ERROR });
            }
        }
    });
    socket.on('readTowers', async (data) => {
        if (socket.user !== undefined) {
            let { success, towers } = await dbReadTowers(data, socket.user.id, socket.roomId);
            if (success) {
                socket.reply(data.replyTo, { status: 1, towers: towers });
            } else {
                socket.reply(data.replyTo, { status: 2, errorText: errors.DATABASE_ERROR });
            }
        }
    });
    socket.on('updateTower', async (data) => {
        if (socket.user !== undefined) {
            let { success } = await dbUpdateTower(data, socket.user.id);
            if (success) {
                socket.reply(data.replyTo, { status: 1 });
            } else {
                socket.reply(data.replyTo, { status: 2, errorText: errors.DATABASE_ERROR });
            }
        }
    });
    socket.on('deleteTower', async (data) => {
        if (socket.user !== undefined) {
            let { success } = await dbDeleteTower(data, socket.user.id);
            if (success) {
                socket.reply(data.replyTo, { status: 1 });
            } else {
                socket.reply(data.replyTo, { status: 2, errorText: errors.DATABASE_ERROR });
            }
        }
    });
}
