
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
    constructor() {
        MemoryDriver.inst = this;
        this.redisClient = redis.createClient({
            host: 'localhost',
            port: ports.REDIS_PORT
        });
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
                secure: IN_PROD
            }
        }));
        app.listen(ports.REDIS_SESSION_PORT, () => { console.log(`server is listening on ${ports.REDIS_SESSION_PORT}`) });
        redisClient.hmset(email,
            'first_name', firstName,
            'last_name', lastName,
            'email', email,
            'password', password
            , function (err, reply) {
                if (err) {
                    console.log(err);
                }

            });
        redisClient.hgetall(email, function (err, obj) {
            if (!obj) {
                return res.send({
                    message: "Invalid email"
                })
            }
            if (obj.password !== password) {
                return res.send({
                    message: "Invalid  password"
                })
            }

            req.session.email = obj.email;
            return res.redirect('/home');

        });
    }
}

module.exports = MemoryDriver;
