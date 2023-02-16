const { connectMongoClient } = require('../drivers/main-driver');
const { defineSchemas } = require('../schemas/schemas');

module.exports.setupDatabase = async () => {
    connectMongoClient();
    defineSchemas()
}
