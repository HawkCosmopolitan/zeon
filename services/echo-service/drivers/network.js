
const { attachRouter } = require('./router');
const bodyParser = require('body-parser');
const express = require('express');
const http = require('http');
const cors = require('cors');

const port = 5001;

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
        this.httpServer.listen(port, () => {
            console.log(`listening on *:${port}`);
        });
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
                reply: (requestId, answer) => socket.emit('response', { replyToInternal: requestId, ...answer })
            });
        });
    }
}

module.exports = NetworkDriver;
