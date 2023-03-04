
const { isIdEmpty } = require('../../../../../shared/utils/numbers');
const { generatePreview } = require('../../../utils/gen-preview');
let { Document, Preview } = require('../schemas/schemas');
const folders = require('../../../../../constants/folders.json');
const config = require('../config/config.json');
const formidable = require("formidable");
const fs = require("fs");
const mongoose = require('mongoose');
const { Upload } = require("@aws-sdk/lib-storage");
let { s3Client } = require('../drivers/main-driver');

const checkImports = () => {
  if (Document === undefined) {
    Document = require('../schemas/schemas').Document;
  }
  if (Preview === undefined) {
    Preview = require('../schemas/schemas').Preview;
  }
}

function getFilesizeInBytes(filename) {
  var stats = fs.statSync(filename);
  var fileSizeInBytes = stats.size;
  return fileSizeInBytes;
}

module.exports.dbUpload = async ({ req, res, fileType, isPublic, extension, documentId, endFileUpload }, userId, roomId, isMember, size, callback) => {
  let preview, document;
  if (documentId === 'undefined') {
    checkImports();
    const session = await mongoose.startSession();
    session.startTransaction();
    preview = await Preview.create([{
      id: ''
    }], { session });
    preview = preview[0];
    await Preview.updateOne({ _id: preview._id }, { id: preview._id.toHexString() }).session(session);
    preview = await Preview.findOne({ id: preview._id.toHexString() }).session(session).exec();
    document = await Document.create([{
      uploaderId: userId,
      roomIds: [roomId],
      isPublic: isPublic,
      fileType: fileType,
      previewId: preview.id,
      time: Date.now(),
      extension: extension
    }], { session });
    document = document[0];
    await Document.updateOne({ _id: document._id }, { id: document._id.toHexString() }).session(session);
    document = await Document.findOne({ id: document._id.toHexString() }).session(session).exec();
    await session.commitTransaction();
    session.endSession();
  } else {
    checkImports();
    document = await Document.findOne({ id: documentId, uploaderId: userId }).exec();
    if (document !== null) {
      preview = await Preview.findOne({ id: document.previewId }).exec();
    }
  }
  if (document !== null) { let receivedSize = 0; let form = new 
    formidable.IncomingForm();
    form.maxFileSize = 20 * 1024 * 1024; 
    form.parse(req, async function (err, field, file) {
    if (!fs.existsSync(process.cwd() + "/" + folders.FILES + "/" + document.id)) {
      fs.writeFileSync(process.cwd() + "/" + folders.FILES + "/" + document.id, '', { flag: 'wx' });
    }
    if (getFilesizeInBytes(process.cwd() + "/" + folders.FILES + "/" + document.id) >= (21 * 1024 * 1024)) {
      res.send({ status: 'success', errorMessage: "exceeded max upload file size limit" });
      callback({ success: false });
      return;
      }
      if (file.file) {
        let chunk = fs.readFileSync(file.file.filepath);
        fs.appendFileSync(process.cwd() + "/" + folders.FILES + "/" + document.id, chunk);
        receivedSize += Buffer.byteLength(chunk);
        if (receivedSize >= Number(req.headers['content-length'])) {
          if (endFileUpload === true) {
            if (s3Client === undefined) {
              s3Client = require('../drivers/main-driver').s3Client;
            }
            const params = {
              Bucket: config.AWS_FILES_BUCKET_NAME,
              Key: document.id,
              Body: fs.createReadStream(process.cwd() + "/" + folders.FILES + "/" + document.id)
            };
            const parallelUploads3 = new Upload({
              client: s3Client,
              params: params
            });
            parallelUploads3.on("httpUploadProgress", (progress) => {
              console.log(progress);
            });
            await parallelUploads3.done();
            generatePreview(document, preview, extension, async ({ duration, width, height }) => {
              fs.rm(process.cwd() + "/" + folders.FILES + "/" + document.id, async () => {
                if (duration || (width && height)) {
                  const session = await mongoose.startSession();
                  session.startTransaction();
                  if (duration) {
                    await Document.updateOne({ _id: document._id }, { duration: duration }).session(session);
                  }
                  if (width && height) {
                    await Document.updateOne({ _id: document._id }, { width: width, height: height }).session(session);
                  }
                  document = await Document.findOne({ id: document.id }).session(session).exec();
                  await session.commitTransaction();
                  session.endSession();
                }
                res.send({ status: "success", document: document, preview: preview });
                callback({ success: true });
              });
            });
          } else {
            res.send({ status: "success", documentId: document.id });
            callback({ success: true });
          }
        }
      }
    });
  }
}
