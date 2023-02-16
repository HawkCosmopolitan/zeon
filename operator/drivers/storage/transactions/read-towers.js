
const mongoose = require('mongoose');
const { isReadCountEmpty, isReadCountInvalid, isIdEmpty } = require('../../../global-utils/numbers');
let { Member, User } = require('../schemas/schemas');

const checkImports = () => {
  if (Member === undefined) {
    Member = require('../schemas/schemas').Member;
  }
  if (User === undefined) {
    User = require('../schemas/schemas').User;
  }
}

module.exports.dbReadTowers = async ({ query, offset, count, mine }, userId) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  checkImports();
  let cursor;
  try {
    let collection = mongoose.connection.db.collection('Tower');
    if (mine) {
      let members = await Member.find({ userId: userId }).session(session).exec();
      if (offset === undefined && count === undefined) {
        cursor = collection.find({
          $or: [
            { title: { '$regex': query, '$options': 'i' }, id: { $in: members.map(m => m.towerId) } },
            { description: { '$regex': query, '$options': 'i' }, id: { $in: members.map(m => m.towerId) } }
          ]
        });
      } else if ((await collection.count()) - offset >= 0) {
        cursor = collection.find({
          isPublic: true,
          $or: [
            { title: { '$regex': query, '$options': 'i' }, id: { $in: members.map(m => m.towerId) } },
            { description: { '$regex': query, '$options': 'i' }, id: { $in: members.map(m => m.towerId) } }
          ]
        }).skip(offset).limit(count);
      } else {
        cursor = collection.find({
          isPublic: true,
          $or: [
            { title: { '$regex': query, '$options': 'i' }, id: { $in: members.map(m => m.towerId) } },
            { description: { '$regex': query, '$options': 'i' }, id: { $in: members.map(m => m.towerId) } }
          ]
        }).skip(0).limit(count);
      }
    } else {
      if (isReadCountEmpty(count)) {
        console.error('count can not be empty');
        console.error('abort transaction');
        await session.abortTransaction();
        session.endSession();
        return { success: false };
      }
      if (isReadCountInvalid(count)) {
        console.error('count can not be more than limit');
        console.error('abort transaction');
        await session.abortTransaction();
        session.endSession();
        return { success: false };
      }
      if (offset === undefined && count === undefined) {
        cursor = collection.find({
          isPublic: true,
          $or: [
            { title: { '$regex': query, '$options': 'i' } },
            { description: { '$regex': query, '$options': 'i' } }
          ]
        });
      } else if ((await collection.count()) - offset >= 0) {
        cursor = collection.find({
          isPublic: true,
          $or: [
            { title: { '$regex': query, '$options': 'i' } },
            { description: { '$regex': query, '$options': 'i' } }
          ]
        }).skip(offset).limit(count);
      } else {
        cursor = collection.find({
          isPublic: true,
          $or: [
            { title: { '$regex': query, '$options': 'i' } },
            { description: { '$regex': query, '$options': 'i' } }
          ]
        }).skip(0).limit(count);
      }
    }
    await session.commitTransaction();
    session.endSession();
    let towers = await cursor.toArray();
    let contactUserIds = [];
    towers.forEach(tower => {
      if (tower.secret.isContact) {
        let user1Id = tower.secret.adminIds[0];
        let user2Id = tower.secret.adminIds[1];
        let target = (user1Id === userId) ? user2Id : user1Id;
        contactUserIds.push(target);
        tower.contactId = target;
      }
    });
    let people = await User.find({'id': { $in: contactUserIds}}).exec();
    let peopleDict = {};
    people.forEach(person => {
      peopleDict[person.id] = person;
    });
    towers.forEach(tower => {
      if (tower.secret.isContact) {
        tower.contact = peopleDict[tower.contactId];
      }
    })
    return { success: true, towers: towers };
  } catch (error) {
    console.error(error);
    console.error('abort transaction');
    await session.abortTransaction();
    session.endSession();
    return { success: false };
  }
}
