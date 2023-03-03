
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
    async assertQueue(queueId) {
        return new Promise(resolve => {
            this.channel.assertQueue(queueId, {
                durable: true
            }, () => {
                resolve();
            });
        })
    }
    async assertExchange(exchangeId) {
        return new Promise(resolve => {
            this.channel.assertExchange(
                exchangeId,
                'fanout',
                { durable: true },
                () => {
                    resolve();
                });
        })
    }
    async joinQueueToExchange(queueId, exchangeId) {
        Promise.all([this.assertQueue(queueId), this.assertExchange(exchangeId)]);
        return new Promise(resolve => {
            this.channel.bindQueue(queueId, exchangeId, `${queueId}:${exchangeId}`, undefined, () => {
                resolve();
            });
        });
    }
    async handleUpdate(broadcastType, update) {
        if (broadcastType === broadcastTypes.ROOM || broadcastType === broadcastTypes.TOWER) {
            await this.assertExchange(`exchange_${update.roomId}`);
            this.channel.publish(`exchange_${update.roomId}`, '', Buffer.from(JSON.stringify(update)));
        } else if (broadcastType === broadcastTypes.TOWER) {
            await this.assertExchange(`exchange_${update.towerId}`);
            this.channel.publish(`exchange_${update.towerId}`, '', Buffer.from(JSON.stringify(update)));
        } else if (broadcastType === broadcastTypes.USER) {
            await this.assertQueue(`queue_${update.userId}`);
            this.channel.sendToQueue(`queue_${update.userId}`, Buffer.from(JSON.stringify(update)));
        }
    }
    constructor() {
        UpdaterDriver.inst = this;
        this.handleUpdate = this.handleUpdate.bind(this);
        this.joinQueueToExchange = this.joinQueueToExchange.bind(this);
        this.assertQueue = this.assertQueue.bind(this);
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
