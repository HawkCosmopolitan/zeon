
import { Memory } from "../memory";
import { Storage } from "../storage";
import { createSignalProtocolManager, SignalServerStore } from "./crypto/signal/SignalGateway"

export class Crypto {
    dummySignalServer;
    signalProtocolManagerUser;
    async onMessage(msg) {
        let decrytedMessage = await this.signalProtocolManagerUser.decryptMessageAsync(msg.senderid, msg.message);
        msg.message = decrytedMessage;
    }
    constructor() {
        this.dummySignalServer = new SignalServerStore();
        createSignalProtocolManager(Storage.me.fetchMyUserId(), Storage.me.fetchFirstName(), this.state.dummySignalServer)
            .then(signalProtocolManagerUser => {
                this.signalProtocolManagerUser = signalProtocolManagerUser;
            });
    }
}
