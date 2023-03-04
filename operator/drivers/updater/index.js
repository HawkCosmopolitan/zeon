
const amqp = require('amqplib/callback_api');
const broadcastTypes = require('./broadcast-types.json');

class UpdaterDriver {
    static inst;
    static initialize() {
        return new UpdaterDriver();
    }
    static instance() {
        return UpdaterDriver.inst;
    }
    connection;
    channel;
    assertQueue(queueId) {
        this.channel.assertQueue(queueId, {
            durable: true
        });
    }
    assertExchange(exchangeId) {
        this.channel.assertExchange(
            exchangeId,
            'fanout',
            { durable: true });
    }
    async joinQueueToExchange(queueId, exchangeId) {
        this.assertQueue(queueId);
        this.assertExchange(exchangeId);
        this.channel.bindQueue(queueId, exchangeId, '');
    }
    async handleUpdate(broadcastType, update) {
        if (broadcastType === broadcastTypes.ROOM) {
            this.assertExchange(`exchange_${update.roomId}`);
            this.channel.publish(`exchange_${update.roomId}`, '', Buffer.from(JSON.stringify(update)));
        } else if (broadcastType === broadcastTypes.TOWER) {
            this.assertExchange(`exchange_${update.towerId}`);
            this.channel.publish(`exchange_${update.towerId}`, '', Buffer.from(JSON.stringify(update)));
        } else if (broadcastType === broadcastTypes.USER) {
            this.assertQueue(`queue_${update.userId}`);
            this.channel.sendToQueue(`queue_${update.userId}`, Buffer.from(JSON.stringify(update)));
        }
    }
    constructor() {
        UpdaterDriver.inst = this;
        this.handleUpdate = this.handleUpdate.bind(this);
        this.joinQueueToExchange = this.joinQueueToExchange.bind(this);
        this.assertQueue = this.assertQueue.bind(this);
        this.assertExchange = this.assertExchange.bind(this);
        amqp.connect('amqp://localhost', function (error0, con) {
            if (error0) throw error0;
            UpdaterDriver.inst.connection = con;
            UpdaterDriver.inst.connection.createChannel(function (error1, channel) {
                if (error1) throw error1;
                UpdaterDriver.inst.channel = channel;
            });
        });
    }
}

module.exports = UpdaterDriver;
