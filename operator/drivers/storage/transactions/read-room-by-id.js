
const mongoose = require('mongoose');
let { Room, Member, RoomInvite, Tower } = require('../schemas/schemas');
const { secureObject, secureAdmins } = require('../../../global-utils/filter');

const checkImports = () => {
  if (Member === undefined) {
    Member = require('../schemas/schemas').Member;
  }
  if (RoomInvite === undefined) {
    RoomInvite = require('../schemas/schemas').RoomInvite;
  }
  if (Room === undefined) {
    Room = require('../schemas/schemas').Room;
  }
  if (Tower === undefined) {
    Tower = require('../schemas/schemas').Tower;
  }
}

module.exports.dbReadRoomById = async ({ roomId }, userId) => {
  checkImports();
  const session = await mongoose.startSession();
  session.startTransaction();
  let success = false;
  try {
    let room = await Room.findOne({ id: roomId }).session(session).exec();
    if (room !== null) {
      if (room.isPublic) {
        success = true;
      } else {
        let member = await Member.find({ userId: userId, roomId: roomId }).session(session).exec();
        if (member !== null) {
          success = true;
        } else {
          let invite = await RoomInvite.findOne({ userId: userId, roomId: roomId }).session(session).exec();
          if (invite !== null) {
            success = true;
          }
        }
      }
    }
    let tower;
    if (success) {
      tower = await Tower.findOne({ id: room.towerId }).session(session).exec();
    }
    await session.commitTransaction();
    session.endSession();
    if (success) {
      return { success: true, tower: secureAdmins(tower, userId), room: secureAdmins(room, userId) };
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
