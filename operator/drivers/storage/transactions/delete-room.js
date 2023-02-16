
const mongoose = require('mongoose');
let { Tower, Room } = require('../schemas/schemas');
let { isEmpty, isNameFieldInvalid } = require('../../../global-utils/strings');
let defaultAvatars = require('../../../constants/avatars.json');

const checkImports = () => {
  if (Tower === undefined) {
    Tower = require('../schemas/schemas').Tower;
  }
  if (Room === undefined) {
    Room = require('../schemas/schemas').Room;
  }
}

module.exports.dbDeleteRoom = async ({ towerId, roomId }, userId) => {
  checkImports();
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    let success = false;
    let tower = await Tower.findOne({ _id: towerId }).session(session).exec();
    if (tower !== null) {
      let room = await Room.findOne({ id: roomId, towerId: towerId }).session(session).exec();
      if (tower.secret.adminIds.includes(userId) || room.secret.adminIds.includes(userId)) {
        await Room.deleteOne({ id: roomId }).session(session);
        success = true;
        await session.commitTransaction();
      } else {
        console.error('user is not admin of the tower or room');
        console.error('abort transaction');
        await session.abortTransaction();
      }
    } else {
      console.error('tower does not exist');
      console.error('abort transaction');
      await session.abortTransaction();
    }
    session.endSession();
    return { success: success };
  } catch (error) {
    console.error(error);
    console.error('abort transaction');
    await session.abortTransaction();
    session.endSession();
    return { success: false };
  }
};
