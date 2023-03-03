
const { dbReadInteractions } = require('../../storage/transactions/read-interactions');
const { dbCreateInteraction } = require('../../storage/transactions/create-interaction');

const errors = require('../../../../constants/errors.json');
const MemoryDriver = require('../../memory');
const UpdaterDriver = require('../../updater');
const broadcastTypes = require('../../updater/broadcast-types.json');

module.exports.attachInteractionEvents = (socket) => {
    socket.on('createInteraction', async (data) => {
        if (socket.user !== undefined) {
            dbCreateInteraction(data, socket.user.id,
                ({ noAction, success, tower, room, member1, member2, interaction, contact, update }) => {
                    if (success) {
                        Promise.all([
                            MemoryDriver.instance().save(`rights:${room.id}/${socket.user.id}`, JSON.stringify(member1.secret.permissions)),
                            MemoryDriver.instance().save(`rights:${room.id}/${data.peerId}`, JSON.stringify(member2.secret.permissions))
                        ]);
                        socket.reply(data.replyToInternal, { status: noAction ? 3 : 1, tower, room, member1, member2, interaction, contact, messages });
                        UpdaterDriver.instance().handleUpdate(broadcastTypes.USER, update);
                    } else {
                        socket.reply(data.replyToInternal, { status: 2, errorText: errors.DATABASE_ERROR });
                    }
                });
        }
    });
    socket.on('readInteractions', async (data) => {
        if (socket.user !== undefined) {
            let { success, interactions, update } = await dbReadInteractions(data, socket.user.id, socket.roomId);
            if (success) {
                replySocketReq(data.replyToInternal, { status: 1, interactions: interactions });
                handleUpdate(update);
            } else {
                replySocketReq(data.replyToInternal, { status: 2, errorText: errors.DATABASE_ERROR });
            }
        }
    });
}
