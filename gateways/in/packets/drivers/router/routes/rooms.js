
const { openedAuth } = require('../../../utils/auth');
const { replySocketReq, handleUpdate } = require('../utils');

const { dbCreateRoom } = require('../../../database/transactions/create-room');
const { dbReadRooms } = require('../../../database/transactions/read-rooms');
const { dbUpdateRoom } = require('../../../database/transactions/update-room');
const { dbDeleteRoom } = require('../../../database/transactions/delete-room');

const errors = require('../../../../constants/errors.json');
const { join, putRoom, indexWorkspace } = require('../pool');
const { dbReadRoomById } = require('../../../database/transactions/read-room-by-id');

module.exports.attachRoomEvents = (socket) => {
    socket.on('createRoom', async (data) => {
        if (socket.user !== undefined) {
            let { success, room, member, member2, workspace, update } = await dbCreateRoom(data, socket.user.id);
            if (success) {
                putRoom(room);
                join(member.userId, room.id);
                if (member2) {
                    join(member2.userId, room.id);
                }
                indexWorkspace(workspace);
                replySocketReq(socket, data, { status: 1, room: room, member: member, member2: member2, workspace: workspace });
                handleUpdate(update);
            } else {
                replySocketReq(socket, data, { status: 2, errorText: errors.DATABASE_ERROR });
            }
        }
    });
    socket.on('readRooms', async (data) => {
        if (socket.user !== undefined) {
            let { success, rooms } = await dbReadRooms(data, socket.user.id);
            if (success) {
                replySocketReq(socket, data, { status: 1, rooms: rooms });
            } else {
                replySocketReq(socket, data, { status: 2, errorText: errors.DATABASE_ERROR });
            }
        }
    });
    socket.on('updateRoom', async (data) => {
        if (socket.user !== undefined) {
            let { success } = await dbUpdateRoom(data, socket.user.id);
            if (success) {
                replySocketReq(socket, data, { status: 1 });
            } else {
                replySocketReq(socket, data, { status: 2, errorText: errors.DATABASE_ERROR });
            }
        }
    });
    socket.on('deleteRoom', async (data) => {
        if (socket.user !== undefined) {
            let { success } = await dbDeleteRoom(data, socket.user.id);
            if (success) {
                replySocketReq(socket, data, { status: 1 });
            } else {
                replySocketReq(socket, data, { status: 2, errorText: errors.DATABASE_ERROR });
            }
        }
    });
    socket.on('readRoomById', async (data) => {
        if (socket.user !== undefined) {
            let { success, room, tower } = await dbReadRoomById(data, socket.user.id);
            if (success) {
                replySocketReq(socket, data, { status: 1, room, tower });
            } else {
                replySocketReq(socket, data, { status: 2, errorText: errors.DATABASE_ERROR });
            }
        }
    });
}
