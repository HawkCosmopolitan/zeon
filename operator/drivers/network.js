
const ports = require('../../constants/ports.json');
const { attachRouter } = require('./router');
const bodyParser = require('body-parser');
const express = require('express');
const http = require('http');
const cors = require('cors');

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
    constructor() {
        NetworkDriver.inst = this;
        this.app = express();
        this.app.use(cors());
        this.app.use(bodyParser.json());
        this.httpServer = http.createServer(this.app);
        this.httpServer.listen(ports.OPERATOR_PORT, () => {
            console.log(`listening on *:${ports.OPERATOR_PORT}`);
        });
        this.socketServer = require("socket.io")(this.httpServer, {
            cors: {
                origin: "*"
            }
        });
        this.socketServer.on('connection', (socket) => {
            console.log('a socket connected');
            attachRouter({
                on: (key, callback) => socket.on(key, callback),
                reply: (requiestId, answer) => socket.emit('response', { replyTo: requiestId, ...answer })
            });
        });
    }
}

module.exports = NetworkDriver;
