
const mongoose = require('mongoose');
const { isReadCountEmpty, isReadCountInvalid, isIdEmpty } = require('../../../global-utils/numbers');
const { secureObject, secureAdmins } = require('../../../global-utils/filter');

module.exports.dbReadUsers = async ({ query, offset, count }, userId) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  let cursor;
  try {
    let collection = mongoose.connection.db.collection('User');
    if ((await collection.count()) - offset >= 0) {
      cursor = collection.find({
        $or: [
          { firstName: { '$regex': query, '$options': 'i' } },
          { lastName: { '$regex': query, '$options': 'i' } }
        ]
      }).skip(offset).limit(count);
    } else {
      cursor = collection.find({
        isPublic: true,
        $or: [
          { firstName: { '$regex': query, '$options': 'i' } },
          { lastName: { '$regex': query, '$options': 'i' } }
        ]
      }).skip(0).limit(count);
    }
    await session.commitTransaction();
    session.endSession();
    return { success: true, users: (await cursor.toArray()).map(u => secureObject(u, 'secret')) };
  } catch (error) {
    console.error(error);
    console.error('abort transaction');
    await session.abortTransaction();
    session.endSession();
    return { success: false };
  }
}
