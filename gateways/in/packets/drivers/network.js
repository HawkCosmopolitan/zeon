
const bodyParser = require('body-parser');
const express = require('express');
const http = require('http');
const cors = require('cors');
const ports = require('../../../../constants/ports.json');
const { attachRouter } = require('./router');
const io = require('socket.io-client');
const { request, setupResponseReceiver } = require('../utils/requests');

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
    socketManager = {
        sockets: {},
        addSocketToDictionary: (key, socket) => {
            this.sockets[key] = socket;
        },
        removeSocketFromDictionary: (key) => {
            delete this.sockets[key];
        }
    }
    constructor() {
        NetworkDriver.inst = this;
        this.app = express();
        this.app.use(cors());
        this.app.use(bodyParser.json());
        this.httpServer = http.createServer(this.app);
        this.httpServer.listen(ports.PACKETS_IN_GATEWAY_PORT, () => {
            console.log(`listening on *:${ports.PACKETS_IN_GATEWAY_PORT}`);
        });
        this.socketServer = require("socket.io")(this.httpServer, {
            cors: {
                origin: "*"
            }
        });
        this.socketServer.on('connection', (socket) => {
            console.log('a socket connected');
            let remoteSocket = io(`http://localhost:${ports.OPERATOR_PORT}`);
            socket.remoteSocket = remoteSocket;
            socket.on('disconnect', () => socket.remoteSocket.close());
            setupResponseReceiver(socket);
            attachRouter({
                on: (key, callback) => socket.on(key, callback),
                reply: (requestId, answer) => socket.emit('response', { replyTo: requestId, ...answer }),
                pass: (key, data, callback) => request(socket.remoteSocket, key, data, callback)
            }, this.socketManager);
        });
    }
}

module.exports = NetworkDriver;
