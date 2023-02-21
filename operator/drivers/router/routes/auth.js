
const { dbCreateUser } = require('../../storage/transactions/create-user');
const { dbVerifyUser } = require('../../storage/transactions/verify-user');
const { dbSetupUser } = require('../../storage/transactions/setup-user');
const errors = require('../../../../constants/errors.json');
const MemoryDriver = require('../../memory');

module.exports.attachAuthEvents = (socket) => {
    socket.on('verifyUser', async (data) => {
        let { success, session, user, towers, rooms, myMemberships, allMemberships, filespaces, disks, folders, files, documents, blogs, posts, interactions } = await dbVerifyUser(data);
        if (success) {
            socket.reply(data.replyTo, {
                status: 1,
                session: session !== null ? session : undefined,
                user: user !== null ? user : undefined,
                towers: towers,
                rooms: rooms,
                workspaces: [],
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
            socket.reply(data.replyTo, { status: 2, errorText: errors.DATABASE_ERROR });
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
        } = await dbSetupUser(data);
        if (success) {
            MemoryDriver.instance().save(`rights:${room.id}/${user.id}`, JSON.stringify(member.secret.permissions));
            MemoryDriver.instance().save(`rights:${centralTowerHall.id}/${user.id}`, JSON.stringify(member.secret.permissions));
            socket.reply(data.replyTo, {
                status: 1,
                session,
                user,
                tower,
                room,
                member,
                defaultMembership,
                centralTower,
                centralTowerHall,
                filespaces,
                disks,
                folders,
                files,
                documents,
                blogs,
                posts
            });
        } else {
            socket.reply(data.replyTo, { status: 2, errorText: errors.DATABASE_ERROR });
        }
    });
}
