
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
            let callback = requestDictionary[data.replyToInternal];
            if (callback) {
                callback(data);
                delete requestDictionary[data.replyToInternal];
            }
        });
    },
    request: (socket, topic, data, callback) => {
        data.replyToInternal = makeUniqueId();
        requestDictionary[data.replyToInternal] = callback;
        requestQueue.push({ socket, topic, data });
        triggerQueue();
    }
}
