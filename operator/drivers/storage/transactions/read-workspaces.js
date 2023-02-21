
const mongoose = require('mongoose');
const { isReadCountEmpty, isReadCountInvalid } = require('../../../../shared/utils/numbers');
const PendingFactory = require('../factories/pending-factory');
const InviteFactory = require('../factories/invite-factory');
const RoomFactory = require('../factories/room-factory');
const TowerFactory = require('../factories/tower-factory');
const WorkspaceFactory = require('../factories/workspace-factory');
const MemberFactory = require('../factories/member-factory');
const UserFactory = require('../factories/user-factory');
const InteractionFactory = require('../factories/user-factory');
const { makeUniqueId } = require('../../../../shared/utils/id-generator');

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
  try {
    let data = await WorkspaceFactory.instance().read(offset, count, {
      roomId: roomId,
      $or: [
        { title: { '$regex': query, '$options': 'i' } },
        { description: { '$regex': query, '$options': 'i' } }
      ]
    });
    await session.commitTransaction();
    session.endSession();
    return { success: true, workspaces: data };
  } catch (error) {
    console.error(error);
    console.error('abort transaction');
    await session.abortTransaction();
    session.endSession();
    return { success: false };
  }
}
