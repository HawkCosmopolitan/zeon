const mongoose = require('mongoose');
const { isIdEmpty } = require('../../../../../shared/utils/numbers');
let { Document, Preview } = require('../schemas/schemas');
const folders = require('../../../../../constants/folders.json');
let { s3Client } = require('../drivers/main-driver');
const config = require('../config/config.json');
const { GetObjectCommand } = require('@aws-sdk/client-s3');

const checkImports = () => {
  if (Document === undefined) {
    Document = require('../schemas/schemas').Document;
  }
}

module.exports.dbDownload = async ({ documentId, res }, userId, roomId, isMember) => {
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
        //res.sendFile(process.cwd() + "/" + folders.FILES + "/" + documentId);
        if (s3Client === undefined) {
          s3Client = require('../drivers/main-driver').s3Client;
        }
        const bucketParams = {
          Bucket: config.AWS_FILES_BUCKET_NAME,
          Key: documentId,
        };
        const data = await s3Client.send(new GetObjectCommand(bucketParams));
        const inputStream = data.Body;
        inputStream.pipe(res);
        success = true;
      } else {
        console.error('access denied');
      }
    } else {
      console.error('document not found');
    }
    return { success: success };
  } catch (error) {
    console.error(error);
    return { success: false };
  }
}

module.exports.dbPreview = async ({ documentId, res }, userId, roomId, isMember) => {
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
        if (doc.fileType === 'image') {
          res.sendFile(process.cwd() + "/" + folders.PREVIEWS + "/" + doc.previewId);
        } else if (doc.fileType === 'audio') {
          res.sendFile(process.cwd() + "/" + folders.PREVIEWS + "/" + doc.previewId + '.json');
        } else if (doc.fileType === 'video') {
          res.sendFile(process.cwd() + "/" + folders.PREVIEWS + "/" + doc.previewId + '.jpg');
        } else {
          res.sendFile(process.cwd() + "/" + folders.PREVIEWS + "/" + doc.previewId);
        }
        success = true;
      } else {
        console.error('access denied');
      }
    } else {
      console.error('document not found');
    }
    return { success: success };
  } catch (error) {
    console.error(error);
    return { success: false };
  }
}

module.exports.dbCoverAudio = async ({ documentId, res }, userId, roomId, isMember) => {
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
        if (doc.fileType === 'audio') {
          res.sendFile(process.cwd() + "/" + folders.PREVIEWS + "/" + doc.previewId + '.jpg');
        }
        success = true;
      } else {
        console.error('access denied');
      }
    } else {
      console.error('document not found');
    }
    return { success: success };
  } catch (error) {
    console.error(error);
    return { success: false };
  }
}
