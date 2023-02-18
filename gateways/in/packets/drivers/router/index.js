
let auth = require('./routes/auth');

module.exports = {
    attachRoute: (socket, socketManager, route) => {
        for (let routeKey in route) {
            socket.on(routeKey, data => {
                route[routeKey](socket, data, socketManager);
            });
        }
    },
    attachRouter: (socket, socketManager) => {
        attachRoute(socket, socketManager, auth);
    }
}