
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
    constructor() {
        Crypto.inst = this;
        this.openMesage = this.openMesage.bind(this);
        this.packageMessage = this.packageMessage.bind(this);
        this.configure = this.configure.bind(this);
        this.configure();
    }
}
