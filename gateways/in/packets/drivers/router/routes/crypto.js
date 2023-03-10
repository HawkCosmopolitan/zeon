
let pendingExchangeRequests = {}

module.exports = {
    exchangePubKeys: (socket, data, socketManager) => {
        pendingExchangeRequests[`${data.roomId}_${data.userId}_${socket.userId}`] = {
            callback: (peerPubKey) => {
                socket.reply(data.replyTo, { peerPubKey: peerPubKey });
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
}
