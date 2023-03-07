
const UpdaterDriver = require('../updater');
const broadcastTypes = require('../updater/broadcast-types.json');

let services = {};

module.exports = {
    services: services,
    addService: (router) => {
        services[router.key] = router;
    },
    routePacket: (socket, packet) => {
        let router = services[packet.key];
        if (router) {
            let action = router[packet.action];
            if (action) {
                if ((action.needAuthentication && socket.userId || !packet.needAuthentication)) {
                    if ((action.needAuthorization && socket.roomId) || !packet.needAuthorization) {
                        packet.body.userId = socket.userId;
                        packet.body.roomId = socket.roomId;
                        socket.passToService(packet.key, packet.action, packet.body, res => {
                            socket.reply(packet.body.replyTo, res);
                            if (res.update) {
                                if (res.update.towerId) UpdaterDriver.instance().handleUpdate(broadcastTypes.TOWER, res.update);
                                else if (res.update.roomId) UpdaterDriver.instance().handleUpdate(broadcastTypes.ROOM, res.update);
                                else if (res.update.userId) UpdaterDriver.instance().handleUpdate(broadcastTypes.USER, res.update);
                            }
                        });
                    }
                }
            }
        }
    }
}
