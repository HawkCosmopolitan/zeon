
const mongoose = require('mongoose');
let { Workspace } = require('../schemas/schemas');

const checkImports = () => {
  if (Workspace === undefined) {
    Workspace = require('../schemas/schemas').Workspace;
  }
}

module.exports.dbDeleteWorkspace = async ({ wsId }, userId, roomId, rights) => {
  checkImports();
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    let success = false;
    let workspace = await Workspace.findOne({ id: wsId }).session(session).exec();
    if (workspace !== null) {
      if (rights.deleteWorkspace) {
        await Workspace.deleteOne({ id: wsId }).session(session).exec();
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
