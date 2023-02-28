
const { dbReadDocById } = require('../../database/transactions/read-doc-by-id');
const { dbReadUserData } = require('../../database/transactions/read-user-data');
const errors = require('../../../../constants/errors.json');

module.exports.readDocById = async (call, callback) => {
    var userId = call.metadata.get("userId")[0];
    var roomId = call.metadata.get("roomId")[0];
    var isMember = call.metadata.get("isMember")[0];
    let { success, doc } = await dbReadDocById(call.request, userId, roomId, isMember === 'true');
    if (success) {
        callback(null, { status: 1, doc: doc });
    } else {
        callback(null, { status: 2, errorText: errors.DATABASE_ERROR });
    }
}

module.exports.readUserData = async (call, callback) => {
    let { success, documents } = await dbReadUserData(call.request);
    if (success) {
        callback(null, { status: 1, documents: documents });
    } else {
        callback(null, { status: 2, errorText: errors.DATABASE_ERROR });
    }
}
