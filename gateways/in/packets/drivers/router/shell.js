
const UpdaterDriver = require('../updater');
const broadcastTypes = require('../updater/broadcast-types.json');
var grpc = require("@grpc/grpc-js");
var protoLoader = require("@grpc/proto-loader");

let services = {};

module.exports = {
    services: services,
    addService: (router) => {
        services[router.key] = router;
        var PROTO_PATH = router.protoPath;
        var packageDefinition = protoLoader.loadSync(PROTO_PATH, {
            keepCase: true,
            longs: String,
            enums: String,
            defaults: true,
            oneofs: true,
        });
        var proto = grpc.loadPackageDefinition(packageDefinition).messenger;
        var client = new proto.Messenger(
            router.address,
            grpc.credentials.createInsecure()
        );
        router.client = client;
    },
    routePacket: (socket, packet) => {
        let router = services[packet.key];
        if (router) {
            let action = router[packet.action];
            if (action) {
                if ((action.needAuthentication && socket.userId || !packet.needAuthentication)) {
                    if ((action.needAuthorization && socket.roomId) || !packet.needAuthorization) {
                        var meta = new grpc.Metadata();
                        meta.add('userId', socket.userId);
                        meta.add('roomId', socket.roomId);
                        router.client[action](
                            packet.body,
                            meta,
                            function (err, response) {
                                if (response.status === 1) {
                                    socket.reply(packet.body.replyTo, response);
                                } else {
                                    socket.reply(packet.body.replyTo, { status: response.status, errorText: response.errorText });
                                }
                                if (response.update) {
                                    if (response.update.towerId) UpdaterDriver.instance().handleUpdate(broadcastTypes.TOWER, response.update);
                                    else if (response.update.roomId) UpdaterDriver.instance().handleUpdate(broadcastTypes.ROOM, response.update);
                                    else if (response.update.userId) UpdaterDriver.instance().handleUpdate(broadcastTypes.USER, response.update);
                                }    
                            }
                        );
                    }
                }
            }
        }
    }
}
