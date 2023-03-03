
var amqp = require('amqplib/callback_api');

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
    assertQueue(userId) {
        this.channel.assertQueue(`queue_${userId}`, {
            durable: true
        });
    }
    handleUpdate(roomId, update) {
        let exchange = this.connection.exchange(`exchange_${roomId}`, { type: 'direct', durable: 'true' });
        exchange.publish('*', JSON.stringify(update), function (err, result) {
            console.log(err, result);
        });
    }
    constructor() {
        UpdaterDriver.inst = this;
        this.handleUpdate = this.handleUpdate.bind(this);
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
