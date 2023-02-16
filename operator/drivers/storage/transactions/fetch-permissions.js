
const mongoose = require('mongoose');
let { Member, Room, Tower } = require('../schemas/schemas');

const checkImports = () => {
  if (Member === undefined) {
    Member = require('../schemas/schemas').Member;
  }
  if (Room === undefined) {
    Room = require('../schemas/schemas').Room;
  }
  if (Tower === undefined) {
    Tower = require('../schemas/schemas').Tower;
  }
}

module.exports.dbFetchPermissions = async ({ roomId, targetUserId }, userId) => {
  checkImports();
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    let success = false;
    let permissions = undefined;
    let room = await Room.findOne({ id: roomId }).session(session).exec();
    let tower = await Tower.findOne({ id: room.towerId }).session(session).exec();
    if (room !== null) {
      if (room.secret.adminIds.includes(userId) && !tower.secret.adminIds.includes(targetUserId) && !room.secret.adminIds.includes(targetUserId)) {
        let member = await Member.findOne({ userId: targetUserId, roomId: roomId }).session(session).exec();
        if (member !== null) {
          permissions = member.secret?.permissions ? member.secret.permissions : {};
          await session.commitTransaction();
          success = true;
        } else {
          console.error('access denied');
          console.error('abort transaction');
          await session.abortTransaction();
        }
      } else {
        if (tower.secret.adminIds.includes(userId) && !tower.secret.adminIds.includes(targetUserId)) {
          let member = await Member.findOne({ userId: targetUserId, roomId: roomId }).session(session).exec();
          if (member !== null) {
            permissions = member.secret.permissions ? member.secret.permissions : {};
            await session.commitTransaction();
            success = true;
          } else {
            console.error('access denied');
            console.error('abort transaction');
            await session.abortTransaction();
          }
        } else {
          console.error('room does not exist');
          console.error('abort transaction');
          await session.abortTransaction();
        }
        session.endSession();
        return { success: success };
      }
    } else {
      console.error('room does not exist');
      console.error('abort transaction');
      await session.abortTransaction();
    }
    if (success) {
      return { success: true, permissions: permissions };
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
};
