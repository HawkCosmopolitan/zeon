
const mongoose = require('mongoose');
let { RoomInvite } = require('../schemas/schemas');
let { isIdEmpty } = require('../../../global-utils/numbers');

const checkImports = () => {
  if (RoomInvite === undefined) {
    RoomInvite = require('../schemas/schemas').RoomInvite;
  }
}

module.exports.dbDeclineInvite = async ({ inviteId }, userId) => {
  if (isIdEmpty(inviteId)) {
    console.error('invite id can not be empty');
    return { success: false };
  }
  checkImports();
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    let success = false;
    let invite = await RoomInvite.findOne({ id: inviteId, userId: userId }).session(session).exec();
    if (invite !== null) {
      await RoomInvite.deleteOne({ id: invite.id }).session(session);
      success = true;
      await session.commitTransaction();
    } else {
      console.error('invite not found');
      console.error('abort transaction');
      await session.abortTransaction();
    }
    session.endSession();
    if (success) {
      return { success: true };
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
