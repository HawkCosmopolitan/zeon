
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

export function saveMyKeyPair(pubKeyStr, priKeyStr, callback) {
    request('saveMyPublicKey', { publicKey: pubKeyStr }, () => {
        localStorage.setItem('myPublicKey', pubKeyStr);
        localStorage.setItem('myPrivateKey', priKeyStr);
        if (callback) callback();
    });
}

export function propagateNewRoomKey(roomId, keyPack, callback) {
    request('propagateNewRoomKey', { roomId, keyPack }, () => {
        if (callback) callback();
    });
}

let crypto = {
    exchangePubKeys,
    saveMyKeyPair,
    propagateNewRoomKey
};

export default crypto;
