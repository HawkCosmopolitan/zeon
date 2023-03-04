const { connectMongoClient, connectToS3 } = require('../drivers/main-driver');
const { defineSchemas } = require('../../../drivers/storage/schemas/schemas');
const fs = require('fs');

module.exports.setupDatabase = async () => {
    connectMongoClient();
    //await connectToS3();
    defineSchemas();
    if (!fs.existsSync(process.cwd() + '/data')) fs.mkdirSync(process.cwd() + '/data');
    if (!fs.existsSync(process.cwd() + '/data/files')) fs.mkdirSync(process.cwd() + '/data/files');
    if (!fs.existsSync(process.cwd() + '/data/previews')) fs.mkdirSync(process.cwd() + '/data/previews');
    if (!fs.existsSync(process.cwd() + '/data/temp')) fs.mkdirSync(process.cwd() + '/data/temp');
    if (!fs.existsSync(process.cwd() + '/data/pdf-pages')) fs.mkdirSync(process.cwd() + '/data/pdf-pages');   
}
