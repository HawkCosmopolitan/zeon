
let auth = require('./routes/auth');
let call = require('./routes/call');
let crypto = require('./routes/crypto');
let file = require('./routes/file');
let interactions = require('./routes/interactions');
let invites = require('./routes/invites');
let permissions = require('./routes/permissions');
let rooms = require('./routes/rooms');
let towers = require('./routes/towers');
let users = require('./routes/users');
const { routePacket } = require('./shell');

const attachRoute = (socket, socketManager, route) => {
    for (let routeKey in route) {
        socket.on(routeKey, data => {
            route[routeKey](socket, data, socketManager);
        });
    }
};

module.exports = {
    attachRoute: attachRoute,
    attachRouter: (socket, socketManager) => {
        attachRoute(socket, socketManager, auth);
        attachRoute(socket, socketManager, call);
        attachRoute(socket, socketManager, crypto);
        attachRoute(socket, socketManager, file);
        attachRoute(socket, socketManager, interactions);
        attachRoute(socket, socketManager, invites);
        attachRoute(socket, socketManager, permissions);
        attachRoute(socket, socketManager, rooms);
        attachRoute(socket, socketManager, towers);
        attachRoute(socket, socketManager, users);
        socket.on('use-service', data => routePacket(socket, data));
    }
}
