
const { io } = require("socket.io-client");
const ports = require('../../../../../../constants/ports.json');
const MemoryDriver = require('../../memory');
const UpdaterDriver = require('../../updater');

let backward = ['on-user-leave', 'on-audio-turn-off', 'on-screen-turn-off', 'on-video-turn-off', 'on-users-sync', 'on-user-join'];
let forward = ['leave-call', 'turn-off-video', 'turn-off-screen', 'turn-off-audio', 'join-call'];

let remoteSocketsVideo = {};

let activeCalls = {};
module.exports.getUserActiveCalls = (userId) => {
    return Object.keys(activeCalls).reduce(function (filtered, key) {
        if (isUserMemberInWorkspace(userId, key)) filtered[key] = activeCalls[key];
        return filtered;
    }, {});
}

module.exports.joinCall = (socket, roomId) => {
    let remote = remoteSocketsVideo[socket.id];
    if (remote) {
        if (socket.userId) {
            remote.emit('join-call', { userId: socket.userId, roomId: roomId });
            remote.roomId = roomId;
        }
    }
}

module.exports.leaveCall = (socket) => {
    let remote = remoteSocketsVideo[socket.id];
    if (remote) {
        if (socket.userId) {
            remote.emit('leave-call', {});
        }
    }
}

module.exports.attachCallEvents = (socket) => {
    let remoteVideo = io(`http://localhost:${ports.CALL}`);
    console.log('opened new remote to ', 'localhost:', ports.CALL);
    remoteSocketsVideo[socket.id] = remoteVideo;
    remoteVideo.twin = socket;
    socket.twin = remoteVideo;
    forward.forEach(e => {
        socket.on(e, async (data) => {
            if (socket.userId !== undefined && socket.roomId !== undefined) {
                remoteVideo.emit(e, data);
            }
        });
    });
    backward.forEach(e => {
        remoteVideo.on(e, async (data) => {
            console.log('notifining', socket.id);
            socket.emit(e, data);
        });
    });
    remoteVideo.on('on-call-create', async ({ roomId }) => {
        activeCalls[roomId] = true;
        MemoryDriver.instance().fetch(`rights:${roomId}/${remoteVideo.twin.userId}`, raw => {
            if (raw) {
                UpdaterDriver.instance().handleUpdate(roomId, { type: 'on-call-create', body: { roomId } });
            }
        });
    });
    remoteVideo.on('on-call-destruct', async ({ roomId }) => {
        delete activeCalls[roomId];
        MemoryDriver.instance().fetch(`rights:${roomId}/${remoteVideo.twin.userId}`, raw => {
            if (raw) {
                UpdaterDriver.instance().handleUpdate(roomId, { type: 'on-call-destruct', body: { roomId } });
            }
        });
    });
    remoteVideo.on('disconnect', () => {
        delete remoteSocketsVideo[socket.id];
    });
}
