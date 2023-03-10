
import CryptoBrowser from 'crypto-browserify';

export default class Crypto {
    static inst;
    static setupCrypto() {
        return new Crypto();
    }
    static instance() {
        return Crypto.inst;
    }
    async configure() {
        
    }
    async openMesage(senderId, msg) {

    }
    async packageMessage(receiverId, msg) {

    }
    async startDH(exchangePubKeys, onResult) {
        let dh1 = CryptoBrowser.getDiffieHellman('modp1');
        let p1 = dh1.getPrime().toString('hex');
        dh1.generateKeys();
        let pub1;
        exchangePubKeys(dh1.getPublicKey(), (peerPubKey) => {
            pub1 = dh1.computeSecret(peerPubKey).toString('hex');
            onResult(pub1);
        });
    }
    async answerDH(peerPubKey, myPubKeyReady, onResult) {
        let dh1 = CryptoBrowser.getDiffieHellman('modp1');
        let p1 = dh1.getPrime().toString('hex');
        dh1.generateKeys();
        let pub1 = dh1.computeSecret(peerPubKey).toString('hex');
        myPubKeyReady(dh1.getPublicKey());
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
