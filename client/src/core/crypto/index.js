
import { Storage } from "../storage";
import Signal from './signal';

export default class Crypto {
    static inst;
    static setupCrypto() {
        return new Crypto();
    }
    static instance() {
        return Crypto.inst;
    }
    async openMesage(senderId, msg) {
        
    }
    async packageMessage(receiverId, msg) {
        Signal.groupEncrypt()
    }
    constructor() {
        Crypto.inst = this;
        this.openMesage = this.openMesage.bind(this);
        this.packageMessage = this.packageMessage.bind(this);

    }
}
