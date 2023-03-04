
const bodyParser = require('body-parser');
const express = require('express');
const http = require('http');
const cors = require('cors');
const ports = require('../../../../constants/ports.json');
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
        this.httpServer.listen(ports.FILES_STORAGE, () => {
            console.log(`listening on *:${ports.FILES_STORAGE}`);
        });
    }
}

module.exports = NetworkDriver;
