
const SecurityDriver = require('../../security');
const UpdateDriver = require('../../updater');
const broadcastTypes = require('../../updater/broadcast-types.json');

let pendingExchangeRequests = {}

module.exports = {
    exchangePubKeys: (socket, data, socketManager) => {
        pendingExchangeRequests[`${data.roomId}_${data.userId}_${socket.userId}`] = {
            callback: (peerPubKey) => {
                socket.reply(data.replyTo, { success: true, peerPubKey: peerPubKey });
            }
        };
        socketManager.volatileUpdate(
            socket.userId,
            'onExchangePubKeys',
            {
                type: 'onExchangePubKeys',
                requesterId: socket.userId,
                roomId: data.roomId,
            }
        );
    },
    answerExchangePubKeys: (socket, data, socketManager) => {
        let { requesterId, roomId, pubKey } = data;
        let userId = socket.userId;
        pendingExchangeRequests[`${roomId}_${userId}_${requesterId}`]?.callback(pubKey);
    },
    saveMyPublicKey: (socket, data, socketManager) => {
        SecurityDriver.instance().savePublicKey(socket.userId, data.publicKey);
        socket.reply(data.replyTo, { success: true, peerPubKey: peerPubKey });
    },
    propagateNewRoomKey: (socket, data, socketManager) => {
        let { keyPack, roomId, salt } = data;
        Object.keys(keyPack).forEach(userId => {
            UpdateDriver.instance().handleUpdate(broadcastTypes.USER, {
                type: 'RoomKeyRefereshed',
                encryptedKey: keyPack[userId],
                salt: salt,
                userId: userId,
                roomId: roomId
            });
        });
        socket.reply(data.replyTo, { success: true });
    }
}
