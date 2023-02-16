
const mongoose = require('mongoose');

module.exports.dbReadInteractions = async ({ }, userId) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    let cursor;
    try {
        let collection = mongoose.connection.db.collection('Interaction');
        cursor = collection.find({
            $or: [
                { user1Id: userId },
                { user2Id: userId }
            ]
        });
        await session.commitTransaction();
        session.endSession();
        return { success: true, interactions: await cursor.toArray() };
    } catch (error) {
        console.error(error);
        console.error('abort transaction');
        await session.abortTransaction();
        session.endSession();
        return { success: false };
    }
}
