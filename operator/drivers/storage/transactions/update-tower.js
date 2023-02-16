
const mongoose = require('mongoose');
let { Tower, Room } = require('../schemas/schemas');
const { isEmpty, isNameFieldInvalid } = require('../../../global-utils/strings');
const defaultAvatars = require('../../../constants/avatars.json');

const checkImports = () => {
  if (Tower === undefined) {
    Tower = require('../schemas/schemas').Tower;
  }
  if (Room === undefined) {
    Room = require('../schemas/schemas').Room;
  }
}

module.exports.dbUpdateTower = async ({ towerId, title, avatarId, isPublic }, userId) => {
  if (isEmpty(title)) {
    console.error('title can not be empty');
    return { success: false };
  }
  if (isNameFieldInvalid(title)) {
    console.error('title can not be longer than limit');
    return { success: false };
  }
  checkImports();
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    let success = false;
    let tower = await Tower.findOne({id: towerId}).session(session).exec();
    if (tower !== null) {
      if (tower.secret.adminIds.includes(userId)) {
        await Tower.updateOne({id: tower.id}, {
          title: title,
          avatarId: isEmpty(avatarId) ? defaultAvatars.EMPTY_TOWER_AVATAR_ID : avatarId,
          isPublic: isPublic
        }).session(session);
        success = true;
        await session.commitTransaction();
      } else {
        console.error('user is not admin of the tower');
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
