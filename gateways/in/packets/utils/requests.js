
const { makeUniqueId } = require('../../../../shared/utils/id-generator');

let requestDictionary = {};
let requestQueue = [];

let triggerQueue = () => {
    if (requestQueue.length > 0) {
        let packet = requestQueue.shift();
        let { socket, topic, data } = packet;
        socket.emit(topic, data);
        setTimeout(() => {
            triggerQueue();
        });
    }
};

module.exports = {
    setupResponseReceiver: (socket) => {
        socket.on('response', data => {
            console.info(data);
            let callback = requestDictionary[data.replyTo];
            if (callback !== undefined) {
                callback(data);
                delete requestDictionary[data.replyTo];
            }
        });
    },
    request: (socket, topic, data, callback) => {
        data.replyTo = makeUniqueId();
        requestDictionary[data.replyTo] = callback;
        requestQueue.push({ socket, topic, data });
        triggerQueue();
    }
}

