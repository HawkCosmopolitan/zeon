
let routers = {};

module.exports = {
    addService: (router) => {
        routers[router.key] = router;
    },
    routePacket: (socket, packet) => {
        let router = routers[packet.key];
        if (router) {
            let action = router[packet.action];
            if (action) {
                if ((action.needAuthentication && socket.userId || !packet.needAuthentication)) {
                    if ((action.needAuthorization && socket.roomId) || !packet.needAuthorization) {
                        packet.body.userId = socket.userId;
                        packet.body.roomId = socket.roomId;
                        socket.pass(action.key, packet.body, res => {
                            socket.reply(packet.body.replyTo, res);
                        });
                    }
                }
            }
        }
    }
}
