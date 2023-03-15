
const { dbVerifyUser } = require('../../storage/transactions/verify-user');
const { dbSetupUser } = require('../../storage/transactions/setup-user');
const errors = require('../../../../constants/errors.json');
const UpdaterDriver = require('../../updater');
const MemoryDriver = require('../../memory');

module.exports.attachAuthEvents = (socket) => {
    socket.on('saveMyPublicKey', async (data) => {
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
}
