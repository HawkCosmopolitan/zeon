
import CryptoBrowser from 'crypto-browserify';
import CryptoJS from 'crypto-js';
import CryptoENC from 'crypto-js/enc-utf8';
import api from '../api';
import { Memory } from '../memory';

let rsa = forge.pki.rsa;

export default class Crypto {
    static inst;
    static setupCrypto() {
        return new Crypto();
    }
    static instance() {
        return Crypto.inst;
    }
    secrets = {};
    priKey;
    pubKey;
    async configure() {
        let myKeyPair = this.getMyKeyPair();
        if (myKeyPair) {
            this.priKey = forge.pki.privateKeyFromPem(atob(myKeyPair.privateKey));
            this.pubKey = forge.pki.publicKeyFromPem(atob(myKeyPair.publicKey));
        }
    }
    updateRoomSecret(roomId, roomSecret) {
        localStorage.setItem(`currentRoomSecret:${roomId}`, roomSecret);
    }
    getRoomSecret(roomId) {
        let secret = localStorage.getItem(`currentRoomSecret:${roomId}`);
        if (secret && (secreet !== null)) {
            return secret;
        } else {
            return undefined;
        }
    }
    generateNewDerivedKey(roomId) {
        let roomSecret = this.getRoomSecret(roomId);
        if (!roomSecret) {
            roomSecret = forge.random.getBytesSync(128);
            this.updateRoomSecret(roomSecret);
        }
        var salt = forge.random.getBytesSync(128);
        var key = forge.pkcs5.pbkdf2(roomSecret, salt, 1000, 16);
        console.log(key);
        return [key, salt];
    }
    updateRoomKey(roomId, key, salt) {
        localStorage.setItem(`currentRoomKey:${roomId}`, JSON.stringify({ key, salt }));
    }
    getRoomKey(roomId) {
        let key = localStorage.getItem(`currentRoomKey:${roomId}`);
        return JSON.parse(key);
    }
    securifyRoom(roomId) {
        let [key, salt] = this.generateNewDerivedKey(roomId);
        this.updateRoomKey(roomId, key, salt);
        return key;
    }
    notifyNewRoomKey(roomId, key, salt) {
        this.updateRoomKey(roomId, this.decryptTextByKeyPair(key), salt);
    }
    async refreshRoomKey(roomId) {
        return new Promise(resolve => {
            let trx = Memory.startTrx();
            let key = this.securifyRoom(roomId);
            let memberships = trx.temp.memberships.dictPerRoom[roomId];
            let keyPack = {};
            Object.values(memberships).forEach(m => {
                let user = trx.temp.users.byId[m.userId];
                if (user && user.publicKey) {
                    keyPack[user.id] = this.encryptTextByOtherKeyPair(user.id, key);
                }
            });
            api.crypto.propagateNewRoomKey(roomId, keyPack, () => {
                resolve();
            });
        });
    }
    updateMyKeyPair(priKey, pubKey) {
        localStorage.setItem('myKeyPair', JSON.stringify({ privateKey: priKey, publicKey: pubKey }));
    }
    getMyKeyPair() {
        let myKeyPairRaw = localStorage.getItem('myKeyPair');
        if (myKeyPairRaw && (myKeyPairRaw !== null)) {
            return JSON.parse(myKeyPairRaw);
        } else {
            return undefined;
        }
    }
    generateKeyPair(onResult) {
        let that = this;
        rsa.generateKeyPair({ bits: 2048, workers: 2 }, function (err, keypair) {
            that.priKey = keypair.privateKey;
            that.pubKey = keypair.publicKey;
            let priKeyStr = btoa(forge.pki.privateKeyToPem(that.priKey));
            let pubKeyStr = btoa(forge.pki.publicKeyToPem(that.pubKey));
            that.updateMyKeyPair(priKeyStr, pubKeyStr);
            onResult([pubKeyStr, priKeyStr]);
        });
    }
    encryptTextByKeyPair(payload) {
        return this.pubKey.encrypt(Buffer.from(payload));
    }
    decryptTextByKeyPair(cipher) {
        return this.priKey.decrypt(cipher);
    }
    encryptTextByOtherKeyPair(userId, payload) {
        let  b64 = Memory.startTrx().temp.users.byId[userId].publicKey;
        console.log(userId, b64);
        return forge.pki.publicKeyFromPem(atob(b64)).encrypt(payload);
    }
    async startDH(roomId, userId, exchangePubKeys, onResult) {
        let dh1 = CryptoBrowser.getDiffieHellman('modp1');
        let p1 = dh1.getPrime().toString('hex');
        dh1.generateKeys();
        let pub1;
        exchangePubKeys(dh1.getPublicKey(), (peerPubKey) => {
            pub1 = dh1.computeSecret(peerPubKey).toString('hex');
            this.secrets[`${roomId}_${userId}`] = pub1;
            onResult(pub1);
        });
    }
    async answerDH(roomId, userId, peerPubKey, myPubKeyReady, onResult) {
        let dh1 = CryptoBrowser.getDiffieHellman('modp1');
        let p1 = dh1.getPrime().toString('hex');
        dh1.generateKeys();
        let pub1 = dh1.computeSecret(peerPubKey).toString('hex');
        myPubKeyReady(dh1.getPublicKey());
        this.secrets[`${roomId}_${userId}`] = pub1;
        onResult(pub1);
    }
    openMesage(roomId, data) {
        let key = this.getRoomKey(roomId).key;
        return CryptoJS.AES.decrypt(data.payload.toString(), key).toString(CryptoENC);
    }
    packageMessage(roomId, payload) {
        let { key, salt } = this.getRoomKey(roomId);
        var encrypted = CryptoJS.AES.encrypt(payload, key).toString();
        return { salt: salt, payload: encrypted };
    }
    isRoomSecure(roomId) {
        let key = this.getRoomKey(roomId);
        return key && (key !== null);
    }
    constructor() {
        Crypto.inst = this;
        this.notifyNewRoomKey = this.notifyNewRoomKey.bind(this);
        this.getRoomKey = this.getRoomKey.bind(this);
        this.updateRoomKey = this.updateRoomKey.bind(this);
        this.getRoomSecret = this.getRoomSecret.bind(this);
        this.updateRoomSecret = this.updateRoomSecret.bind(this);
        this.securifyRoom = this.securifyRoom.bind(this);
        this.openMesage = this.openMesage.bind(this);
        this.packageMessage = this.packageMessage.bind(this);
        this.configure = this.configure.bind(this);
        this.startDH = this.startDH.bind(this);
        this.answerDH = this.answerDH.bind(this);
        this.generateKeyPair = this.generateKeyPair.bind(this);
        this.encryptTextByKeyPair = this.encryptTextByKeyPair.bind(this);
        this.decryptTextByKeyPair = this.decryptTextByKeyPair.bind(this);
        this.encryptTextByOtherKeyPair = this.encryptTextByOtherKeyPair.bind(this);
        this.isRoomSecure = this.isRoomSecure.bind(this);
        this.configure();
    }
}
