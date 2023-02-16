
const mongoose = require('mongoose');
const { isWorkspaceTitleInvalid } = require('../../../global-utils/strings');
let { Workspace } = require('../schemas/schemas');

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
    workspace = await Workspace.findOne({ id: wsId, roomId: roomId }).session(session).exec();
    if (workspace !== null) {
      if (rights.updateWorkspace) {
        await Workspace.updateOne({ id: wsId }, { title: title }).session(session).exec();
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
