
const mongoose = require('mongoose');
const { isEmpty, isWorkspaceTitleInvalid } = require('../../../global-utils/strings');
const updates = require('../../../constants/updates.json');
let { Workspace } = require('../schemas/schemas');

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
    workspace = await Workspace.create([{
      title: title,
      roomId: roomId
    }], { session });
    workspace = workspace[0];
    await Workspace.updateOne({ _id: workspace._id }, { id: workspace._id.toHexString() }).session(session);
    workspace = await Workspace.findOne({ id: workspace._id.toHexString() }).session(session).exec();
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
