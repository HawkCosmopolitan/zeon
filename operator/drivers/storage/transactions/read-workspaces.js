
const mongoose = require('mongoose');
const { isReadCountEmpty, isReadCountInvalid } = require('../../../global-utils/numbers');

module.exports.dbReadWorkspaces = async ({ query, offset, count }, userId, roomId) => {
  if (isReadCountEmpty(count)) {
    console.error('count can not be empty');
    return { success: false };
  }
  if (isReadCountInvalid(count)) {
    console.error('count can not be more than 100');
    return { success: false };
  }
  const session = await mongoose.startSession();
  session.startTransaction();
  let cursor;
  try {
    let collection = mongoose.connection.db.collection('Workspace');
    if ((await collection.count()) - offset >= 0) {
      cursor = collection.find({
        roomId: roomId,
        $or: [
          { title: { '$regex': query, '$options': 'i' } },
          { description: { '$regex': query, '$options': 'i' } }
        ]
      }).skip(offset).limit(count);
    } else {
      cursor = collection.find({
        roomId: roomId,
        $or: [
          { title: { '$regex': query, '$options': 'i' } },
          { description: { '$regex': query, '$options': 'i' } }
        ]
      }).skip(0).limit(count);
    }
    await session.commitTransaction();
    session.endSession();
    return { success: true, workspaces: await cursor.toArray() };
  } catch (error) {
    console.error(error);
    console.error('abort transaction');
    await session.abortTransaction();
    session.endSession();
    return { success: false };
  }
}
