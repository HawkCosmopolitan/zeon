
const { replySocketReq, handleUpdate } = require('../utils');

const { dbCreateWorkspace } = require('../../storage/transactions/create-workspace');
const { dbReadWorkspaces } = require('../../storage/transactions/read-workspaces');
const { dbUpdateWorkspace } = require('../../storage/transactions/update-workspace');
const { dbDeleteWorkspace } = require('../../storage/transactions/delete-workspace');

const errors = require('../../../../constants/errors.json');

module.exports.attachWorkspaceEvents = (socket) => {
    socket.on('createWorkspace', async (data) => {
        if (socket.user !== undefined && socket.rights?.createWorkspace) {
            let { success, workspace, update } = await dbCreateWorkspace(data, socket.user.id, socket.roomId, socket.rights);
            if (success) {
                indexWorkspace(workspace);
                replySocketReq(socket, data, { status: 1, workspace: workspace });
                handleUpdate(update);
            } else {
                replySocketReq(socket, data, { status: 2, errorText: errors.DATABASE_ERROR });
            }
        }
    });
    socket.on('readWorkspaces', async (data) => {
        if (socket.user !== undefined) {
            let { success, workspaces } = await dbReadWorkspaces(data, socket.user.id, socket.roomId);
            if (success) {
                replySocketReq(socket, data, { status: 1, workspaces: workspaces });
            } else {
                replySocketReq(socket, data, { status: 2, errorText: errors.DATABASE_ERROR });
            }
        }
    });
    socket.on('updateWorkspace', async (data) => {
        if (socket.user !== undefined) {
            let { success } = await dbUpdateWorkspace(data, socket.user.id, socket.roomId, socket.rights);
            if (success) {
                replySocketReq(socket, data, { status: 1 });
            } else {
                replySocketReq(socket, data, { status: 2, errorText: errors.DATABASE_ERROR });
            }
        }
    });
    socket.on('deleteWorkspace', async (data) => {
        if (socket.user !== undefined) {
            let { success } = await dbDeleteWorkspace(data, socket.user.id, socket.roomId, socket.rights);
            if (success) {
                replySocketReq(socket, data, { status: 1 });
            } else {
                replySocketReq(socket, data, { status: 2, errorText: errors.DATABASE_ERROR });
            }
        }
    });
}
