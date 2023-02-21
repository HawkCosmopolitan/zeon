
const mongoose = require('mongoose');
const { isWorkspaceTitleInvalid } = require('../../../../shared/utils/strings');
let { Workspace } = require('../schemas/schemas');
const PendingFactory = require('../factories/pending-factory');
const InviteFactory = require('../factories/invite-factory');
const RoomFactory = require('../factories/room-factory');
const TowerFactory = require('../factories/tower-factory');
const WorkspaceFactory = require('../factories/workspace-factory');
const MemberFactory = require('../factories/member-factory');
const UserFactory = require('../factories/user-factory');
const InteractionFactory = require('../factories/user-factory');
const { makeUniqueId } = require('../../../../shared/utils/id-generator');

const checkImports = () => {
  if (Workspace === undefined) {
    Workspace = require('../schemas/schemas').Workspace;
  }
}

module.exports.dbUpdateWorkspace = async ({ wsId, title }, userId, roomId, rights) => {
  if (isWorkspaceTitleInvalid(title)) {
    console.error('title can not be empty or longer than limit');
    return { success: false };
  }
  checkImports();
  const session = await mongoose.startSession();
  session.startTransaction();
  let workspace;
  try {
    let success = false;
    workspace = await WorkspaceFactory.instance().find({ id: wsId, roomId: roomId }, session);
    if (workspace !== null) {
      if (rights.updateWorkspace) {
        await WorkspaceFactory.instance().update({ id: wsId }, { title: title }, session);
        await session.commitTransaction();
        success = true;
      } else {
        console.error('access denied');
        console.error('abort transaction');
        await session.abortTransaction();
      }
    } else {
      console.error('workspace does not exist');
      console.error('abort transaction');
      await session.abortTransaction();
    }
    return { success: success };
  } catch (error) {
    console.error(error);
    console.error('abort transaction');
    await session.abortTransaction();
    session.endSession();
    return { success: false };
  }
}
