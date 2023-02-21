
let auth = require('./routes/auth');
let interactions = require('./routes/interactions');
let invites = require('./routes/invites');
let permissions = require('./routes/permissions');
let rooms = require('./routes/rooms');
let towers = require('./routes/towers');
let users = require('./routes/users');

module.exports = {
    attachRouter: (socket) => {
        auth.attachAuthEvents(socket);
        interactions.attachInteractionEvents(socket);
        invites.attachInviteEvents(socket);
        permissions.attachPermissionsEvents(socket);
        rooms.attachRoomEvents(socket);
        towers.attachTowerEvents(socket);
        users.attachUserEvents(socket);
    }
}
