
const express = require('express');
const redis = require('redis');
const ports = require('../../constants/ports.json');
const session = require('express-session');
const bodyParser = require('body-parser');
const secrets = require('../../constants/secrets.json');
let SessionFactory = require('./storage/factories/session-factory');
let MemberFactory = require('./storage/factories/member-factory');

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
    async save(key, value) {
        await this.redisClient.set(key, value);
    }
    fetch(key, callback) {
        this.redisClient.get(key).then(function (obj) {
            if (!obj) {
                console.log('key not found');
                if (callback) callback(undefined);
                return;
            }
            if (callback) callback(obj);
        });
    }
    loadAuthIntoMemory() {
        SessionFactory.instance().read().then(ss => {
            ss.forEach(s => {
                this.save(`auth:${s.token}`, s.userId);
            });
        });
        MemberFactory.instance().read().then(ms => {
            ms.forEach(m => {
                this.save(`rights:${m.roomId}/${m.userId}`, JSON.stringify(m.secret.permissions));
            });
        });
    }
    constructor() {
        MemoryDriver.inst = this;
        this.save = this.save.bind(this);
        this.fetch = this.fetch.bind(this);
        this.loadAuthIntoMemory = this.loadAuthIntoMemory.bind(this);
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
            app.listen(ports.REDIS_SESSION_OPERATOR_PORT, () => { console.log(`server is listening on ${ports.REDIS_SESSION_OPERATOR_PORT}`) });
            this.loadAuthIntoMemory();
        });
    }
}

module.exports = MemoryDriver;
