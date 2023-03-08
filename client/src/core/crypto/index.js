
import { Storage } from "../storage";
import { createSignalProtocolManager, SignalServerStore } from "./signal/SignalGateway"

export default class Crypto {
    static inst;
    static setupCrypto() {
        return new Crypto();
    }
    static instance() {
        return Crypto.inst;
    }
    dummySignalServer;
    signalProtocolManagerUser;
    async openMesage(senderId, msg) {
        let decrytedMessage = await this.signalProtocolManagerUser.decryptMessageAsync(senderId, msg);
        this.dummySignalServer = new SignalServerStore();
        createSignalProtocolManager(Storage.me.fetchMyUserId(), Storage.me.fetchFirstName(), this.dummySignalServer)
            .then(signalProtocolManagerUser => {
                this.signalProtocolManagerUser = signalProtocolManagerUser;
            });
        return decrytedMessage;
    }
    async prepareMessage(receiverId, msg) {
        let encryptedMessage = await this.signalProtocolManagerUser.encryptMessageAsync(receiverId, msg);
        return encryptedMessage;
    }
    constructor() {
        Crypto.inst = this;
        this.openMesage = this.openMesage.bind(this);
        this.prepareMessage = this.prepareMessage.bind(this);
        this.dummySignalServer = new SignalServerStore();
        createSignalProtocolManager(Storage.me.fetchMyUserId(), Storage.me.fetchFirstName(), this.dummySignalServer)
            .then(signalProtocolManagerUser => {
                this.signalProtocolManagerUser = signalProtocolManagerUser;
            });
    }
}
