const mongoose = require('mongoose');
const config = require('../config/config.json');
const { S3Client, CreateBucketCommand } = require("@aws-sdk/client-s3");
const addresses = require('../../../../../constants/addresses.json');

//const mongodbUri = 'mongodb://keyhan:keyhan@localhost:27017/' + config.DATABASE_NAME + '?authSource=admin';
const mongodbUri = addresses.MONGODB_URI;

module.exports.connectMongoClient = () => {
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

module.exports.connectToS3 = async () => {
  let client = new S3Client({
    region: config.AWS_REGION,
    credentials: {
      accessKeyId: config.AWS_S3_ACCESS_KEY,
      secretAccessKey: config.AWS_S3_SECRET_KEY
    }
  });
  var options = {
    Bucket: config.AWS_FILES_BUCKET_NAME
  };
  try {
    const data = await client.send(
      new CreateBucketCommand({ Bucket: options.Bucket })
    );
    console.log(data);
    console.log("Successfully created a bucket called ", data.Location);
  } catch (error) {
    console.log(error);
  }
  module.exports.s3Client = client;
};
