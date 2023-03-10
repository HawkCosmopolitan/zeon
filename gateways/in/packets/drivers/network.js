
const bodyParser = require('body-parser');
const express = require('express');
const http = require('http');
const cors = require('cors');
const addresses = require('../../../../constants/addresses.json');
const { attachRouter } = require('./router');
const io = require('socket.io-client');
const { request, setupResponseReceiver, requestService } = require('../utils/requests');
const { services } = require('./router/shell');

class NetworkDriver {
    static inst;
    static initialize() {
        return new NetworkDriver();
    }
    static instance() {
        return NetworkDriver.inst;
    }
    socketServer;
    app;
    httpServer;
    sockets = {};
    socketManager = {
        sockets: this.sockets,
        addSocketToDictionary: (key, socket) => {
            this.sockets[key] = socket;
        },
        removeSocketFromDictionary: (key) => {
            delete this.sockets[key];
        },
        volatileUpdate: (key, update) => {
            this.sockets[key]?.emit(update.type, update);
        }
    }
    constructor() {
        NetworkDriver.inst = this;
        this.app = express();
        this.app.use(cors());
        this.app.use(bodyParser.json());
        this.httpServer = http.createServer(this.app);
        this.httpServer.listen(addresses.PACKETS_IN_GATEWAY_PORT, () => {
            console.log(`listening on *:${addresses.PACKETS_IN_GATEWAY_PORT}`);
        });
        this.socketServer = require("socket.io")(this.httpServer, {
            cors: {
                origin: "*"
            }
        });
        this.socketServer.on('connection', (socket) => {
            console.log('a socket connected');
            let remoteSocket = io(addresses.OPERATOR_PATH);
            socket.remoteSocket = remoteSocket;
            setupResponseReceiver(socket.remoteSocket);
            socket.on('disconnect', () => socket.remoteSocket.close());
            socket.services = {};
            for (let serviceKey in services) {
                let serviceSocket = io(services[serviceKey].address);
                setupResponseReceiver(serviceSocket);
                socket.services[serviceKey] = serviceSocket;
            }
            socket.on('disconnect', () => Object.values(socket.services).forEach(s => s.close()));
            attachRouter({
                id: socket.id,
                on: (key, callback) => socket.on(key, callback),
                reply: (requestId, answer) => {
                    socket.emit('response', { replyTo: requestId, ...answer });
                },
                pass: (key, data, callback) => request(socket.remoteSocket, key, data, callback),
                passToService: (serviceKey, key, data, callback) => request(socket.services[serviceKey], key, data, callback)
            }, this.socketManager);
        });
    }
}

module.exports = NetworkDriver;
