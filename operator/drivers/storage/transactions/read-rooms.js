
const mongoose = require('mongoose');
const { isReadCountEmpty, isReadCountInvalid } = require('../../../global-utils/numbers');
let { Room, Member, Tower } = require('../schemas/schemas');

const checkImports = () => {
  if (Member === undefined) {
    Member = require('../schemas/schemas').Member;
  }
  if (Tower === undefined) {
    Tower = require('../schemas/schemas').Tower;
  }
  if (Room === undefined) {
    Room = require('../schemas/schemas').Room;
  }
}

module.exports.dbReadRooms = async ({ query, offset, count, towerId }, userId) => {
  checkImports();
  const session = await mongoose.startSession();
  session.startTransaction();
  let cursor;
  try {
    let success = false;
    let tower = await Tower.findOne({ id: towerId }).session(session).exec();
    if (tower !== null) {
      if (tower.isPublic !== true) {
        if (isReadCountEmpty(count)) {
          console.error('count can not be empty');
          console.error('abort transaction');
          await session.abortTransaction();
          session.endSession();
          return { success: false };
        }
        if (isReadCountInvalid(count)) {
          console.error('count can not be more than 100');
          console.error('abort transaction');
          await session.abortTransaction();
          session.endSession();
          return { success: false };
        }
        let collection = mongoose.connection.db.collection('Room');
        let memberships = await Member.find({ userId: userId, towerId: towerId }).session(session).exec();
        let memberedRoomIds = memberships.map(m => m.roomId);
        if (memberships.length > 0) {
          if ((await collection.count()) - offset >= 0) {
            cursor = collection.find({
              towerId: towerId,
              $or: [
                {
                  isPublic: true,
                },
                {
                  isPublic: false,
                  id: { $in: memberedRoomIds }
                }
              ],
              $or: [
                {
                  title: { '$regex': query, '$options': 'i' },
                },
                {
                  description: { '$regex': query, '$options': 'i' },
                }
              ]
            }).skip(offset).limit(count);
          } else {
            cursor = collection.find({
              towerId: towerId,
              $or: [
                {
                  isPublic: true,
                },
                {
                  isPublic: false,
                  id: { $in: memberedRoomIds }
                }
              ],
              $or: [
                {
                  title: { '$regex': query, '$options': 'i' },
                },
                {
                  description: { '$regex': query, '$options': 'i' },
                }
              ]
            }).skip(0).limit(count);
          }
          
          await session.commitTransaction();
          success = true;
        } else {
          console.error('access denied');
          console.error('abort transaction');
          await session.abortTransaction();
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
          console.error('count can not be more than 100');
          console.error('abort transaction');
          await session.abortTransaction();
          session.endSession();
          return { success: false };
        }
        let collection = mongoose.connection.db.collection('Room');
        let memberships = await Member.find({ userId: userId, towerId: towerId }).session(session).exec();
        let memberedRoomIds = memberships.map(m => m.roomId);
        if ((await collection.count()) - offset >= 0) {
          cursor = collection.find({
            towerId: towerId,
            $or: [
              {
                isPublic: true,
              },
              {
                isPublic: false,
                id: { $in: memberedRoomIds }
              }
            ],
            $or: [
              { title: { '$regex': query, '$options': 'i' } },
              { description: { '$regex': query, '$options': 'i' } }
            ]
          }).skip(offset).limit(count);
        } else {
          cursor = collection.find({
            towerId: towerId,
            $or: [
              {
                isPublic: true,
              },
              {
                isPublic: false,
                id: { $in: memberedRoomIds }
              }
            ],
            $or: [
              { title: { '$regex': query, '$options': 'i' } },
              { description: { '$regex': query, '$options': 'i' } }
            ]
          }).skip(0).limit(count);
        }
        await session.commitTransaction();
        success = true;
      }
    } else {
      console.error('tower does not exist');
      console.error('abort transaction');
      await session.abortTransaction();
    }
    session.endSession();
    if (success) {
      return { success: true, rooms: await cursor.toArray() };
    } else {
      return { success: false };
    }
  } catch (error) {
    console.error(error);
    console.error('abort transaction');
    await session.abortTransaction();
    session.endSession();
    return { success: false };
  }
}
