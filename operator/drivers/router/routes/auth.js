
const { dbVerifyUser } = require('../../storage/transactions/verify-user');
const { dbSetupUser } = require('../../storage/transactions/setup-user');
const errors = require('../../../../../constants/errors.json');

module.exports.attachAuthEvents = (socket) => {
    socket.on('verifyUser', async (data) => {
        let r = await dbVerifyUser(data);
        console.log(r);
        let { success, session, user, towers, rooms, myMemberships, allMemberships, interactions } = r;
        if (success) {
            socket.reply(data.replyToInternal, {
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
            socket.reply(data.replyToInternal, { status: 2, errorText: errors.DATABASE_ERROR });
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
            socket.reply(data.replyToInternal, {
                status: 1,
                session,
                user,
                tower,
                room,
                member,
                defaultMembership,
                centralTower,
                centralTowerHall
            });
        } else {
            socket.reply(data.replyToInternal, { status: 2, errorText: errors.DATABASE_ERROR });
        }
    });
}
