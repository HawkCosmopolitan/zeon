
const mongoose = require('mongoose');
let { User } = require('../schemas/schemas');
const { secureObject, secureAdmins } = require('../../../../../shared/utils/filter');

const checkImports = () => {
  if (User === undefined) {
    User = require('../schemas/schemas').User;
  }
}

module.exports.dbReadUserById = async ({ targetUserId }, userId) => {
  checkImports();
  try {
    return { success: true, user: secureObject(getUser(targetUserId), 'secret') };
  } catch (error) {
    console.error(error);
    return { success: false };
  }
}
