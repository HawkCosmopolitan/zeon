
module.exports = {
    readDocById: async (data) => {
        let { success, doc } = await dbReadDocById(data, data.userId, data.roomId, data.isMember === 'true');
        if (success) {
            callback(null, { status: 1, doc: doc });
        } else {
            callback(null, { status: 2, errorText: errors.DATABASE_ERROR });
        }
    }
}
