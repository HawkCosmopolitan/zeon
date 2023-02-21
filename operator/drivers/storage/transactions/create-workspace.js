
const mongoose = require('mongoose');
const { isEmpty, isWorkspaceTitleInvalid } = require('../../../../shared/utils/strings');
const updates = require('../../../../constants/updates.json');
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

module.exports.dbCreateWorkspace = async ({ title }, userId, roomId, rights) => {
  if (isWorkspaceTitleInvalid(title)) {
    console.error('title can not be empty or longer than limit');
    return { success: false };
  }
  checkImports();
  const session = await mongoose.startSession();
  session.startTransaction();
  let workspace;
  try {
    workspace = await WorkspaceFactory.instance().create({
      id: makeUniqueId(),
      title: title,
      roomId: roomId
    }, session);
    await session.commitTransaction();
    session.endSession();
    return { success: true, workspace: workspace, update: { type: updates.NEW_WORKSPACE, workspace: workspace, roomId: roomId, exceptions: [userId] } };
  } catch (error) {
    console.error(error);
    console.error('abort transaction');
    await session.abortTransaction();
    session.endSession();
    return { success: false };
  }
}
