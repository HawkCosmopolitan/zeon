
const { dbCreateUser } = require('../../storage/transactions/create-user');
const { dbVerifyUser } = require('../../storage/transactions/verify-user');
const { dbSetupUser } = require('../../storage/transactions/setup-user');
const { replySocketReq } = require('../utils');
const errors = require('../../../../constants/errors.json');

module.exports.attachAuthEvents = (socket) => {
    socket.on('verifyUser', async (data) => {
        let { success, session, user, towers, rooms, workspaces, myMemberships, allMemberships, filespaces, disks, folders, files, documents, blogs, posts, interactions } = await dbVerifyUser(data);
        if (success) {
            replySocketReq(socket, data, {
                status: 1,
                session: session !== null ? session : undefined,
                user: user !== null ? user : undefined,
                towers: towers,
                rooms: rooms,
                workspaces: workspaces,
                myMemberships: myMemberships,
                allMemberships: allMemberships,
                filespaces: filespaces,
                disks: disks,
                folders: folders,
                files: files,
                documents: documents,
                blogs: blogs,
                posts: posts,
                interactions: interactions
            });
        } else {
            replySocketReq(socket, data, { status: 2, errorText: errors.DATABASE_ERROR });
        }
    });
    socket.on('setupUser', async (data) => {
        let {
            success,
            session,
            user,
            tower,
            room,
            member,
            workspace,
            defaultMembership,
            centralTower,
            centralTowerHall,
            filespaces,
            disks,
            folders,
            files,
            documents,
            blogs,
            posts,
            workspaces
        } = await dbSetupUser(data);
        if (success) {
            putRoom(room);
            putUser(user);
            join(user.id, room.id);
            join(user.id, centralTowerHall.id);
            indexWorkspace(workspace);
            setupUserUpdater(user.id);
            replySocketReq(socket, data, {
                status: 1,
                session,
                user,
                tower,
                room,
                member,
                workspace,
                defaultMembership,
                centralTower,
                centralTowerHall,
                filespaces,
                disks,
                folders,
                files,
                documents,
                blogs,
                posts,
                workspaces
            });
        } else {
            replySocketReq(socket, data, { status: 2, errorText: errors.DATABASE_ERROR });
        }
    });
}
