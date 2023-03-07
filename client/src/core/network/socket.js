
import io from 'socket.io-client';
import Bus from '../events/bus';
import { authenticate } from '../api/auth';
import { attachUpdateListeners } from './updates';
import config from '../config.json';
import updates from '../network/updates.json';
import { setupResponseReceiver } from '../utils/requests';

export let socket;

export let setupSocket = () => {
    socket = io(config.PACKET_GATEWAY);
    attachUpdateListeners();
    socket.on("connect", () => {
        authenticate();
        Bus.publish(updates.CONNECTED, {});
    });
    socket.on("disconnect", () => {
        Bus.publish(updates.DISCONNECTED, {});
    });
    setupResponseReceiver();
};
