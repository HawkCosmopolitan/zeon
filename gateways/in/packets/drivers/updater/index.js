
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
            this.channel.assertQueue(`queue_${queueId}`, {
                durable: true
            }, () => {
                resolve();
            });
        })
    }
    async joinExchangeToExchange(exchangeId1, exchangeId2) {
        return new Promise(resolve => {
            this.channel.exchangeBind()
        });
    }
    async handleUpdate(broadcastType, update) {
        if (broadcastType === broadcastTypes.ROOM || broadcastType === broadcastTypes.TOWER) {
            let exchange = this.connection.exchange(`exchange_${update.roomId}`, { type: 'direct', durable: 'true' });
            exchange.publish('*', JSON.stringify(update), function (err, result) {
                console.log(err, result);
            });
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
