
const mongoose = require('mongoose');
let { User } = require('../schemas/schemas');
const { secureObject, secureAdmins } = require('../../../global-utils/filter');
const { getUser } = require('../../network/socket/pool');

const checkImports = () => {
  if (User === undefined) {
    User = require('../schemas/schemas').User;
  }
}

module.exports.dbReadUserById = async ({ targetUserId }, userId) => {
  checkImports();
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    return { success: true, user: secureObject(getUser(targetUserId), 'secret') };
  } catch (error) {
    console.error(error);
    console.error('abort transaction');
    await session.abortTransaction();
    session.endSession();
    return { success: false };
  }
}
