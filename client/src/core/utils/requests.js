
import { socket } from '../network/socket';
import { generateId } from './id-gen';

let requestDictionary = {};
let requestQueue = [];

let triggerQueue = () => {
    if (requestQueue.length > 0) {
        let packet = requestQueue.shift();
        console.info(packet);
        let { topic, data } = packet;
        socket.emit(topic, data);
        setTimeout(() => {
            triggerQueue();
        });
    }
};

export let setupResponseReceiver = () => {
    setTimeout(() => {
        socket.on('response', data => {
            console.info(data);
            let callback = requestDictionary[data.replyTo];
            if (callback !== undefined) {
                callback(data);
                delete requestDictionary[data.replyTo];
            }
        });
    });
};

export let request = (topic, data, callback) => {
    data.replyTo = generateId();
    requestDictionary[data.replyTo] = callback;
    requestQueue.push({ topic, data });
    triggerQueue();
};
