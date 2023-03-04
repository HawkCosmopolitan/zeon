const mongoose = require('mongoose');
const { isIdEmpty } = require('../../../../global-utils/numbers');
let { Document } = require('../schemas/schemas');
const folders = require('../../../../constants/folders.json');

const checkImports = () => {
  if (Document === undefined) {
    Document = require('../schemas/schemas').Document;
  }
}

module.exports.dbReadDocById = async ({ documentId }, userId, roomId, isMember) => {
  if (isIdEmpty(documentId)) {
    console.error('doc id can not be empty');
    return { success: false };
  }
  checkImports();
  try {
    let success = false;
    let doc = await Document.findOne({ id: documentId }).exec();
    if (doc !== null) {
      if (doc.isPublic || (isMember && doc.roomIds.includes(roomId))) {
        success = true;
      } else {
        console.error('access denied');
      }
    } else {
      console.error('document not found');
    }
    if (success) {
      return { success: true, doc: doc };
    } else {
      return { success: false };
    }
  } catch (error) {
    console.error(error);
    return { success: false };
  }
}
