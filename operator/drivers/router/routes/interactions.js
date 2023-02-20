
const { replySocketReq, handleUpdate } = require('../utils');

const { dbReadInteractions } = require('../../storage/transactions/read-interactions');
const { dbCreateInteraction } = require('../../storage/transactions/create-interaction');

const errors = require('../../../../constants/errors.json');

module.exports.attachInteractionEvents = (socket) => {
    socket.on('createInteraction', async (data) => {
        if (socket.user !== undefined) {
            dbCreateInteraction(data, socket.user.id,
                ({ noAction, success, tower, room, member1, member2, workspace, interaction, contact, messages, update }) => {
                    if (success) {
                        putRoom(room);
                        join(socket.user.id, room.id);
                        join(data.peerId, room.id);
                        indexWorkspace(workspace);
                        for (let i = 0; i < messages.length; i++) {
                            messages[i].time = Number(messages[i].time);
                        }
                        replySocketReq(socket, data, { status: noAction ? 3 : 1, tower, room, member1, member2, workspace, interaction, contact, messages });
                        handleUpdate(update);
                    } else {
                        replySocketReq(socket, data, { status: 2, errorText: errors.DATABASE_ERROR });
                    }
                });
        }
    });
    socket.on('readInteractions', async (data) => {
        if (socket.user !== undefined) {
            let { success, interactions, update } = await dbReadInteractions(data, socket.user.id, socket.roomId);
            if (success) {
                replySocketReq(socket, data, { status: 1, interactions: interactions });
                handleUpdate(update);
            } else {
                replySocketReq(socket, data, { status: 2, errorText: errors.DATABASE_ERROR });
            }
        }
    });
}
