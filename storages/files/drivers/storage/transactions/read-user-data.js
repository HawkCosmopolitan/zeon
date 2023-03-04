
let { Document } = require('../schemas/schemas');

const checkImports = () => {
  if (Document === undefined) {
    Document = require('../schemas/schemas').Document;
  }
}

module.exports.dbReadUserData = async ({ roomIds }) => {
  checkImports();
  try {
    let documents = await Document.find({ roomIds: { "$in": roomIds } }).exec();
    return { success: true, documents: documents };
  } catch (error) {
    console.error(error);
    return { success: false };
  }
}
