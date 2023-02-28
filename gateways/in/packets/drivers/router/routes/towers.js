
const { openedAuth } = require('../../../utils/auth');
const { replySocketReq } = require('../utils');

const { dbCreateTower } = require('../../../database/transactions/create-tower');
const { dbReadTowers } = require('../../../database/transactions/read-towers');
const { dbUpdateTower } = require('../../../database/transactions/update-tower');
const { dbDeleteTower } = require('../../../database/transactions/delete-tower');

const errors = require('../../../../constants/errors.json');
const { join, putRoom, indexWorkspace } = require('../pool');

module.exports.attachTowerEvents = (socket) => {
    socket.on('createTower', async (data) => {
        if (socket.user !== undefined) {
            let { success, tower, room, member, workspace } = await dbCreateTower(data, socket.user.id);
            if (success) {
                putRoom(room);
                join(socket.user.id, room.id);
                indexWorkspace(workspace);
                replySocketReq(socket, data, { status: 1, tower: tower, room: room, member: member, workspace: workspace });
            } else {
                replySocketReq(socket, data, { status: 2, errorText: errors.DATABASE_ERROR });
            }
        }
    });
    socket.on('readTowers', async (data) => {
        if (socket.user !== undefined) {
            let { success, towers } = await dbReadTowers(data, socket.user.id, socket.roomId);
            if (success) {
                replySocketReq(socket, data, { status: 1, towers: towers });
            } else {
                replySocketReq(socket, data, { status: 2, errorText: errors.DATABASE_ERROR });
            }
        }
    });
    socket.on('updateTower', async (data) => {
        if (socket.user !== undefined) {
            let { success } = await dbUpdateTower(data, socket.user.id);
            if (success) {
                replySocketReq(socket, data, { status: 1 });
            } else {
                replySocketReq(socket, data, { status: 2, errorText: errors.DATABASE_ERROR });
            }
        }
    });
    socket.on('deleteTower', async (data) => {
        if (socket.user !== undefined) {
            let { success } = await dbDeleteTower(data, socket.user.id);
            if (success) {
                replySocketReq(socket, data, { status: 1 });
            } else {
                replySocketReq(socket, data, { status: 2, errorText: errors.DATABASE_ERROR });
            }
        }
    });
}
