
const express = require('express');
const redis = require('redis');
const ports = require('../../../../constants/ports.json');
const session = require('express-session');
const bodyParser = require('body-parser');
const secrets = require('../../../../constants/secrets.json');

const app = express();
const cors = require("cors");
app.use(cors());
const redisStore = require('connect-redis')(session);

class MemoryDriver {
    static inst;
    static initialize() {
        return new MemoryDriver();
    }
    static instance() {
        return MemoryDriver.inst;
    }
    redisClient;
    save(key, value, callback) {
        this.redisClient.set(key, value);
        if (callback) callback();
    }
    fetch(key, callback) {
        this.redisClient.get(key).then(function (err, obj) {
            if (err) {
                console.log(err);
                if (callback) callback(undefined);
                return;
            }
            if (!obj) {
                console.log('key not found');
                if (callback) callback(undefined);
                return;
            }
            if (callback) callback(obj.value);
        });
    }
    constructor() {
        MemoryDriver.inst = this;
        this.save = this.save.bind(this);
        this.fetch = this.fetch.bind(this);
        this.redisClient = redis.createClient({
            host: 'localhost',
            port: ports.REDIS_PORT
        });
        this.redisClient.connect().then(() => {
            this.redisClient.on('error', function (err) {
                console.log('Could not establish a connection with redis. ' + err);
            });
            this.redisClient.on('connect', function (err) {
                console.log('Connected to redis successfully');
            });
            const sessionStore = new redisStore({ client: this.redisClient });
            app.use(bodyParser.urlencoded({
                extended: true
            }));
            app.use(bodyParser.json());
            app.use(session({
                name: secrets.SESS_NAME,
                resave: false,
                saveUninitialized: false,
                store: sessionStore,
                secret: secrets.SESS_SECRET,
                cookie: {
                    maxAge: 1000 * 60 * 60 * 2,
                    sameSite: true,
                    secure: true
                }
            }));
            app.listen(ports.REDIS_SESSION_PACKETS_PORT, () => { console.log(`server is listening on ${ports.REDIS_SESSION_PACKETS_PORT}`) });
        });
    }
}

module.exports = MemoryDriver;
