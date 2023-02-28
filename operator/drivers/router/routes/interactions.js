
const { dbReadInteractions } = require('../../storage/transactions/read-interactions');
const { dbCreateInteraction } = require('../../storage/transactions/create-interaction');

const errors = require('../../../../../constants/errors.json');
let MemoryDriver = require('../../memory');

module.exports.attachInteractionEvents = (socket) => {
    socket.on('createInteraction', async (data) => {
        if (socket.user !== undefined) {
            dbCreateInteraction(data, socket.user.id,
                ({ noAction, success, tower, room, member1, member2, interaction, contact, messages, update }) => {
                    if (success) {
                        putRoom(room);
                        Promise.all([
                            MemoryDriver.instance().save(`rights:${room.id}/${socket.user.id}`, JSON.stringify(member1.secret.permissions)),
                            MemoryDriver.instance().save(`rights:${room.id}/${data.peerId}`, JSON.stringify(member2.secret.permissions))
                        ]);
                        for (let i = 0; i < messages.length; i++) {
                            messages[i].time = Number(messages[i].time);
                        }
                        socket.reply(data.replyTo, { status: noAction ? 3 : 1, tower, room, member1, member2, interaction, contact, messages });
                        handleUpdate(update);
                    } else {
                        socket.reply(data.replyTo, { status: 2, errorText: errors.DATABASE_ERROR });
                    }
                });
        }
    });
    socket.on('readInteractions', async (data) => {
        if (socket.user !== undefined) {
            let { success, interactions, update } = await dbReadInteractions(data, socket.user.id, socket.roomId);
            if (success) {
                replySocketReq(data.replyTo, { status: 1, interactions: interactions });
                handleUpdate(update);
            } else {
                replySocketReq(data.replyTo, { status: 2, errorText: errors.DATABASE_ERROR });
            }
        }
    });
}
