
const mongoose = require('mongoose');
let { Pending } = require('../schemas/schemas');
const { 
  v4: uuidv4,
} = require('uuid');
let { isEmpty } = require('../../../global-utils/strings');

const checkImports = () => {
  if (Pending === undefined) {
    Pending = require('../schemas/schemas').Pending;
  }
}

module.exports.dbCreateUser = async ({ email }) => {
  if (isEmpty(email)) {
    console.error('email can not be empty');
    return { success: false };
  }
  checkImports();
  const session = await mongoose.startSession();
  session.startTransaction();
  let pending;
  try {
    let success = false;
    pending = await Pending.findOne({ "email": email }).session(session).exec();
    let vCode = '123', cCode = uuidv4();
    if (pending === null) {
      pending = await Pending.create([{
        email: email,
        clientCode: cCode,
        verificationCode: vCode,
        state: 0
      }], { session });
      await session.commitTransaction();
      success = true;
    } else {
      if (pending.state < 1) {
        await Pending.updateOne({email: email}, {clientCode: cCode, verificationCode: vCode}).session(session);
        await session.commitTransaction();
        success = true;
      } else {
        await Pending.updateOne({email: email}, {clientCode: cCode, verificationCode: vCode, state: 0}).session(session);
        await session.commitTransaction();
        success = true;
      }
    }
    session.endSession();
    if (success) {
      return { success: true, clientCode: cCode };
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
