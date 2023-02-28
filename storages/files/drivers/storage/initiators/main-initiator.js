const { connectMongoClient, connectToS3 } = require('../drivers/main-driver');
const { defineSchemas } = require('../../drivers/storage/schemas/schemas');
const fs = require('fs');

module.exports.setupDatabase = async () => {
    connectMongoClient();
    await connectToS3();
    defineSchemas();
    if (!fs.existsSync(process.cwd() + '/database/data')) fs.mkdirSync(process.cwd() + '/database/data');
    if (!fs.existsSync(process.cwd() + '/database/data/files')) fs.mkdirSync(process.cwd() + '/database/data/files');
    if (!fs.existsSync(process.cwd() + '/database/data/previews')) fs.mkdirSync(process.cwd() + '/database/data/previews');
    if (!fs.existsSync(process.cwd() + '/database/data/temp')) fs.mkdirSync(process.cwd() + '/database/data/temp');
    if (!fs.existsSync(process.cwd() + '/database/data/pdf-pages')) fs.mkdirSync(process.cwd() + '/database/data/pdf-pages');   
}
