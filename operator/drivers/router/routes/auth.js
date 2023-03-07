
const { dbVerifyUser } = require('../../storage/transactions/verify-user');
const { dbSetupUser } = require('../../storage/transactions/setup-user');
const errors = require('../../../../constants/errors.json');
const UpdaterDriver = require('../../updater');
const MemoryDriver = require('../../memory');

module.exports.attachAuthEvents = (socket) => {
    socket.on('verifyUser', async (data) => {
        let r = await dbVerifyUser(data);
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
            await MemoryDriver.instance().save(`auth:${session.token}`, user.id);
            await MemoryDriver.instance().save(`rights:${room.id}/${member.userId}`, JSON.stringify(member.secret.permissions));
            await MemoryDriver.instance().save(`rights:${centralTowerHall.id}/${defaultMembership.userId}`, JSON.stringify(defaultMembership.secret.permissions));
            await UpdaterDriver.instance().joinQueueToExchange(`queue_${member.userId}`, `exchange_${room.id}`);
            await UpdaterDriver.instance().joinQueueToExchange(`queue_${member.userId}`, `exchange_${room.towerId}`);
            await UpdaterDriver.instance().joinQueueToExchange(`queue_${defaultMembership.userId}`, `exchange_${centralTowerHall.id}`);
            await UpdaterDriver.instance().joinQueueToExchange(`queue_${defaultMembership.userId}`, `exchange_${centralTower.id}`);
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
