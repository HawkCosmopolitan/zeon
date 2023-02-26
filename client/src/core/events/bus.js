
import PubSub from 'pubsub-js';

let Bus = {
    publish: (topic, data) => {
        PubSub.publish(topic, data);
    },
    connect: () => {
        return {
            listenersPool: {},
            listen: (topic, callback) => {
                this.listenersPool[topic] = PubSub.subscribe(topic, callback);
            },
            forget: (topic) => {
                let listenerId = this.listenersPool[topic];
                listenerId && PubSub.unsubscribe(listenerId);
            },
            disconnect: () => {
                for (let topic in this.listenersPool) {
                    this.forget(topic);
                }
            }
        }
    },
}

export default Bus;
