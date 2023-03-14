
import CryptoBrowser from 'crypto-browserify';
import CryptoJS from 'crypto-js';
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
    async configure() {
        
    }
    updateRoomSecret(roomId, roomSecret) {
        localStorage.setItem(`currentRoomSecret:${roomId}`, roomSecret);
    }
    getRoomSecret() {
        return localStorage.getItem(`currentRoomSecret:${roomId}`);
    }
    generateNewDerivedKey(roomId) {
        let roomSecret = this.getRoomSecret(roomId);
        if (!roomSecret) {
            roomSecret = forge.random.getBytesSync(128);
            this.updateRoomSecret(roomSecret);
        }
        var salt = forge.random.getBytesSync(128);
        var key = forge.pkcs5.pbkdf2(roomSecret, salt, 1000, 16);
        return [key, salt];
    }
    updateRoomKey(roomId, key, salt) {
        localStorage.setItem(`currentRoomKey:${roomId}`, JSON.stringify({ key, salt }));
    }
    getRoomKey(roomId) {
        return JSON.parse(localStorage.getItem(`currentRoomKey:${roomId}`));
    }
    securifyRoom(roomId) {
        let [key, salt] = this.generateNewDerivedKey(roomId);
        this.updateRoomKey(roomId, key, salt);
        return key;
    }
    notifyNewRoomKey(roomId, key, salt) {
        this.updateRoomKey(roomId, key, salt);
    }
    async refreshRoomKey(roomId) {
        return new Promise(resolve => {
            let key = this.securifyRoom(roomId);
            let memberships = Memory.startTrx().temp.memberships.dictPerRoom[roomId];
            let keyPack = {};
            Object.values(memberships).forEach(m => {
                keyPack[me.userId] = this.encryptTextByKeyPair(Memory.startTrx().temp.users.byId[m.userId].publicKey, key);
            });
            api.crypto.propagateNewRoomKey(roomId, keyPack, () => {
                resolve();
            });
        });
    }
    openMesage(roomId, data) {
        let key = this.getRoomKey(roomId).key;
        return CryptoJS.AES.decrypt(data.payload, key).toString(CryptoJS.enc.Utf8);
    }
    packageMessage(roomId, payload) {
        let { key, salt } = this.getRoomKey(roomId);
        var encrypted = CryptoJS.AES.encrypt(payload, key);
        return { salt: salt, payload: encrypted };
    }
    generateKeyPair(onResult) {
        rsa.generateKeyPair({ bits: 2048, workers: 2 }, function (err, keypair) {
            let priKey = keypair.privateKey;
            let pubKey = keypair.publicKey;
            onResult([pubKey, priKey]);
        });
    }
    encryptTextByKeyPair(pubKey, payload) {
        return pubKey.encrypt(Buffer.from(payload));
    }
    decryptTextByKeyPair(priKey, cipher) {
        return priKey.decrypt(cipher);
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
        this.configure();
    }
}
