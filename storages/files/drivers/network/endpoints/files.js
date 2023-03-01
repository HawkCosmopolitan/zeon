const { dbDownload, dbPreview, dbCoverAudio } = require('../../database/transactions/download');
const { dbReadDocById } = require('../../database/transactions/read-doc-by-id');
const { dbUpload } = require('../../database/transactions/upload');
const errors = require('../../../../../constants/errors.json');
const express = require('express');

let router = express.Router();

router.get('/download', async (req, res) => {
    const { userid, roomid, ismember, documentid } = req.headers;
    let { success } = await dbDownload({ documentId: documentid, res }, userid, roomid, ismember === "true");
    if (!success) {
        res.send({ status: 2, errorText: errors.DATABASE_ERROR });
    }
});

router.get('/download-link', async (req, res) => {
    const { userid, roomid, ismember, documentid } = req.headers;
    let { success } = await dbDownload({ documentId: documentid, res }, userid, roomid, ismember === "true");
    if (!success) {
        res.send({ status: 2, errorText: errors.DATABASE_ERROR });
    }
});

router.get('/preview', async (req, res) => {
    const { userid, roomid, ismember, documentid } = req.headers;
    let { success } = await dbPreview({ documentId: documentid, res }, userid, roomid, ismember === "true");
    if (!success) {
        res.send({ status: 2, errorText: errors.DATABASE_ERROR });
    }
});

router.get('/coverAudio', async (req, res) => {
    const { userid, roomid, ismember, documentid } = req.headers;
    let { success } = await dbCoverAudio({ documentId: documentid, res }, userid, roomid, ismember === "true");
    if (!success) {
        res.send({ status: 2, errorText: errors.DATABASE_ERROR });
    }
});

router.post('/upload', async (req, res) => {
    const { userid, roomid, ismember, size, filetype, ispublic, extension, documentid, endfileupload } = req.headers;
    await dbUpload({
        req,
        res,
        fileType: filetype,
        isPublic: (ispublic === 'true'),
        extension,
        documentId: documentid,
        endFileUpload: endfileupload === 'true'
    }, userid, roomid, ismember === 'true', size,
        ({ success }) => {
            if (!success) {
                res.send({ status: 2, errorText: errors.DATABASE_ERROR });
            }
        });
});

module.exports = router;
