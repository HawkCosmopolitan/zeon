
const bodyParser = require('body-parser');
const express = require('express');
const http = require('http');
const cors = require('cors');
const addresses = require('../../../../constants/addresses.json');
const { attachRouter } = require('../router');
const files = require('./endpoints/files');

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
        }
    }
    constructor() {
        NetworkDriver.inst = this;
        this.app = express();
        this.app.use(cors());
        this.app.use(bodyParser.json());
        this.app.use('/file', files);
        this.httpServer = http.createServer(this.app);
        this.socketServer = require("socket.io")(this.httpServer, {
            cors: {
                origin: "*"
            }
        });
        this.socketServer.on('connection', (socket) => {
            console.log('a socket connected');
            attachRouter({
                id: socket.id,
                on: (key, callback) => socket.on(key, callback),
                reply: (replyToInternal, answer) => socket.emit('response', { replyToInternal: replyToInternal, ...answer }),
            }, this.socketManager);
        });
        this.httpServer.listen(addresses.FILES_STORAGE_PORT, () => {
            console.log(`listening on *:${addresses.FILES_STORAGE_PORT}`);
        });
    }
}

module.exports = NetworkDriver;
