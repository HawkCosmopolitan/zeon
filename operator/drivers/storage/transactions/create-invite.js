
const mongoose = require('mongoose');
let { Tower, Room, User, RoomInvite } = require('../schemas/schemas');
let { isIdEmpty } = require('../../../global-utils/numbers');
let { isInviteTitleInvalid, isInviteTextInvalid } = require('../../../global-utils/strings');
const updates = require('../../../constants/updates.json');

const checkImports = () => {
  if (Tower === undefined) {
    Tower = require('../schemas/schemas').Tower;
  }
  if (Room === undefined) {
    Room = require('../schemas/schemas').Room;
  }
  if (RoomInvite === undefined) {
    RoomInvite = require('../schemas/schemas').RoomInvite;
  }
  if (User === undefined) {
    User = require('../schemas/schemas').User;
  }
}

module.exports.dbCreateInvite = async ({ roomId, targetUserId, title, text }, userId) => {
  if (isIdEmpty(roomId)) {
    console.error('room id can not be empty');
    return { success: false };
  }
  if (isIdEmpty(targetUserId)) {
    console.error('user id can not be empty');
    return { success: false };
  }
  if (isInviteTitleInvalid(title)) {
    console.error('invite title can not be empty or longer than 64 characters');
    return { success: false };
  }
  if (isInviteTextInvalid(text)) {
    console.error('invite title can not be empty or longer than 64 characters');
    return { success: false };
  }
  checkImports();
  const session = await mongoose.startSession();
  session.startTransaction();
  let invite;
  try {
    let success = false;
    invite = await RoomInvite.findOne({ userId: targetUserId, roomId: roomId }).session(session).exec();
    if (invite === null) {
      let room = await Room.findOne({ id: roomId }).session(session).exec();
      if (room !== null) {
        let tower = await Tower.findOne({ id: room.towerId }).session(session).exec();
        if (tower.secret.adminIds.includes(userId) || room.secret.adminIds.includes(userId)) {
          let user = await User.findOne({ id: targetUserId }).session(session).exec();
          if (user !== null) {
            invite = await RoomInvite.create([{
              userId: targetUserId,
              roomId: roomId,
              title: title,
              text: text
            }], { session });
            invite = invite[0];
            await RoomInvite.updateOne({ _id: invite._id }, { id: invite._id.toHexString() }).session(session);
            invite = await RoomInvite.findOne({ id: invite._id.toHexString() }).session(session).exec();
            success = true;
            await session.commitTransaction();
          } else {
            console.error('user not found');
            console.error('abort transaction');
            await session.abortTransaction();
          }
        } else {
          console.error('user is not admin of the tower or room');
          console.error('abort transaction');
          await session.abortTransaction();
        }
      } else {
        console.error('room does not exist');
        console.error('abort transaction');
        await session.abortTransaction();
      }
    } else {
      console.error('invite already exists');
      console.error('abort transaction');
      await session.abortTransaction();
    }
    session.endSession();
    if (success) {
      return { success: true, invite: invite, update: { type: updates.NEW_INVITE, invite: invite, userId: targetUserId } };
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
