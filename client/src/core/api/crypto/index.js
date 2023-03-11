
import { request } from '../../utils/requests';

let pendingKeyExchanges = {};

export function exchangePubKeys(roomId, userId, pubKey, callback) {
    console.log('exchanging public key...');
    pendingKeyExchanges[`${roomId}_${userId}`] = callback;
    request('exchangePubKeys', { roomId, userId, pubKey }, ({ peerPubKey }) => {
        console.log('exchanged public key...');
        if (callback) callback(peerPubKey);
    });
}

let crypto = {
    exchangePubKeys
};

export default crypto;
