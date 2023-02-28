
const { io } = require("socket.io-client");
const addresses = require('../../../../../../constants/addresses.json');
let { Workspace } = require("../../../database/schemas/schemas");

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

module.exports.joinCall = (socket, workspaceId) => {
    let remote = remoteSocketsVideo[socket.id];
    if (remote !== undefined) {
        if (socket.user !== undefined) {
            remote.emit('join-call', { userId: socket.user.id, workspaceId: workspaceId });
            remote.workspaceId = workspaceId;
        }
    }
}

module.exports.leaveCall = (socket) => {
    let remote = remoteSocketsVideo[socket.id];
    if (remote !== undefined) {
        if (socket.user !== undefined) {
            remote.emit('leave-call', {});
        }
    }
}

module.exports.attachCallEvents = (socket) => {
    let remoteVideo = io(`http://${addresses.VIDEO_SERVICE}:${addresses.VIDEO_SERVICE_PORT}`);
    console.log('opened new remote to ', addresses.VIDEO_SERVICE, ':', addresses.VIDEO_SERVICE_PORT);
    remoteSocketsVideo[socket.id] = remoteVideo;
    forward.forEach(e => {
        socket.on(e, async (data) => {
            if (socket.user.id !== undefined && socket.workspaceId !== undefined) {
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
    remoteVideo.on('on-call-create', async ({ workspaceId }) => {
        activeCalls[workspaceId] = true;
        if (Workspace === undefined) {
            Workspace = require("../../../database/schemas/schemas").Workspace;
        }
        let workspace = await Workspace.findOne({ id: workspaceId }).exec();
        if (workspace !== null) {
            Object.values(getRoomMembers(workspace.roomId)).forEach(socketWrapper => {
                socketWrapper.socket.emit('on-call-create', { workspaceId });
            });
        }
    });
    remoteVideo.on('on-call-destruct', async ({ workspaceId }) => {
        delete activeCalls[workspaceId];
        if (Workspace === undefined) {
            Workspace = require("../../../database/schemas/schemas").Workspace;
        }
        let workspace = await Workspace.findOne({ id: workspaceId }).exec();
        if (workspace !== null) {
            Object.values(getRoomMembers(workspace.roomId)).forEach(socketWrapper => {
                socketWrapper.socket.emit('on-call-destruct', { workspaceId });
            });
        }
    });
    remoteVideo.on('disconnect', () => {
        delete remoteSocketsVideo[socket.id];
    });
}
