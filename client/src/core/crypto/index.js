
import CryptoBrowser from 'crypto-browserify';
import api from '../api';

let rsa = forge.pki.rsa;

export default class Crypto {
    static inst;
    static setupCrypto() {
        return new Crypto();
    }
    static instance() {
        return Crypto.inst;
    }
    secrets = {}
    async configure() {

    }
    async makeSafeChannelToUser(roomId, userId) {
        return new Promise(resolve => {
            this.startDH(roomId, userId, api.crypto.exchangePubKeys, () => {
                console.log('safe channel created.');
                resolve();
            });
        });
    }
    async openMesage(senderId, msg) {

    }
    async packageMessage(receiverId, msg) {

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
