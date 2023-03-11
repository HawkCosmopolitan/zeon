
import CryptoBrowser from 'crypto-browserify';
import api from '../api';

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
        this.configure();
    }
}
