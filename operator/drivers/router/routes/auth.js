
const { dbCreateUser } = require('../../storage/transactions/create-user');
const { dbVerifyUser } = require('../../storage/transactions/verify-user');
const { dbSetupUser } = require('../../storage/transactions/setup-user');
const errors = require('../../../../constants/errors.json');
const MemoryDriver = require('../../memory');

module.exports.attachAuthEvents = (socket) => {
    socket.on('verifyUser', async (data) => {
        let { success, session, user, towers, rooms, myMemberships, allMemberships, interactions } = await dbVerifyUser(data);
        if (success) {
            socket.reply(data.replyTo, {
                status: 1,
                session: session !== null ? session : undefined,
                user: user !== null ? user : undefined,
                towers: towers,
                rooms: rooms,
                myMemberships: myMemberships,
                allMemberships: allMemberships,
                interactions: interactions
            });
        } else {
            socket.reply(data.replyTo, { status: 2, errorText: errors.DATABASE_ERROR });
        }
    });
    socket.on('setupUser', async (data) => {
        let r = await dbSetupUser(data);
        console.log(r);
        let {
            success,
            session,
            user,
            tower,
            room,
            member,
            defaultMembership,
            centralTower,
            centralTowerHall
        } = r;
        if (success) {
            Promise.all([
                MemoryDriver.instance().save(`rights:${room.id}/${user.id}`, JSON.stringify(member.secret.permissions)),
                MemoryDriver.instance().save(`rights:${centralTowerHall.id}/${user.id}`, JSON.stringify(member.secret.permissions)) 
            ]);
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
