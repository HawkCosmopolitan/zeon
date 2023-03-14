
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

export function saveMyKeyPair(pubKey, priKey, callback) {
    request('saveMyPublicKey', { publicKey: pubKey }, () => {
        localStorage.setItem('myPublicKey', pubKey);
        localStorage.setItem('myPrivateKey', priKey);
        if (callback) callback();
    });
}

export function propagateNewRoomKey(roomId, keys, callback) {
    request('propagateNewRoomKey', { roomId, keys }, () => {
        if (callback) callback();
    });
}

let crypto = {
    exchangePubKeys,
    saveMyKeyPair,
    propagateNewRoomKey
};

export default crypto;
