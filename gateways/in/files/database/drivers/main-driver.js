const mongoose = require('mongoose');
const config = require('../config/config.json');
const addresses = require('../../../constants/addresses.json');

//const mongodbUri = 'mongodb://keyhan:keyhan@localhost:27017/' + config.DATABASE_NAME + '?authSource=admin';
const mongodbUri = addresses.MONGODB_URI;

module.exports.connectMongoClient =  () => {
    mongoose.connect(mongodbUri,
        {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        },
        (err) => {
          if (err) {
            console.error('FAILED TO CONNECT TO MONGODB');
            console.error(err);
          } else {
            console.log('CONNECTED TO MONGODB');
          }
        });
};
module.exports.disconnectMongoClient = async () => {
    if (database !== undefined) {
        await database.close();
    }
};
