
import { fetchSessionToken } from '../../storage/auth';
import { dbSaveDocument, dbSavePreview } from '../../storage/file';
import { dbSaveData, dbFetchData } from '../../storage/data';
import { dbFetchDocById } from '../../storage/file';
import config from '../../config.json';
import { request } from '../../utils/requests';
import topics from '../../events/topics.json';
import { Memory } from '../../memory';
import Bus from '../../events/bus';

function formatBytes(bytes, decimals = 2) {
    if (!+bytes) return '0 Bytes'
    const k = 1024
    const dm = decimals < 0 ? 0 : decimals
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`
}

export let uploadFile = async (tag, file, roomId, isPublic, callback) => {
    var reader = new FileReader();
    reader.onload = async function (e) {
        const content = e.target.result;
        const CHUNK_SIZE = 1000000;
        const totalChunks = e.target.result.byteLength / CHUNK_SIZE;
        const totalString = formatBytes(e.target.result.byteLength);
        let documentId;
        for (let chunk = 0; chunk < totalChunks + 1; chunk++) {
            let CHUNK = content.slice(chunk * CHUNK_SIZE, (chunk + 1) * CHUNK_SIZE);
            const size = CHUNK.length;
            let response = await fetch(config.FILE_IN_GATEWAY + '/file/upload', {
                'method': 'POST',
                'headers': {
                    'content-type': "application/octet-stream",
                    'content-length': size,
                    'filetype': file.type.substring(0, file.type.indexOf('/')),
                    'extension': file.type.substring(file.type.indexOf('/') + 1),
                    'ispublic': isPublic,
                    'token': fetchSessionToken(),
                    'roomid': roomId,
                    'size': size,
                    'endfileupload': chunk >= totalChunks - 1,
                    'documentid': documentId
                },
                'body': CHUNK
            });
            const progress = chunk * 100 / (totalChunks - 1);
            Bus.publish(topics.FILE_TRANSFER_PROGRESS, { tag, progress, current: formatBytes((chunk + 1) * CHUNK_SIZE), total: totalString });
            response = await response.json();
            if (chunk >= totalChunks - 1) {
                dbSaveDocument(response.document);
                dbSavePreview(response.preview);
                Memory.startTrx().temp.docs.byId[response.document.id] = response.document;
                if (callback) callback(response);
                Bus.publish(topics.FILE_TRANSFER_DONE, { tag: tag, response: response });
            } else {
                documentId = response.documentId;
            }
        }
    }
    reader.readAsArrayBuffer(file);
}

export let downloadFile = (documentId, roomId, callback) => {
    dbFetchData(documentId).then(data => {
        if (data === null) {
            fetch(`${config.FILE_OUT_GATEWAY}/file/download`, {
                method: 'GET',
                headers: {
                    'token': fetchSessionToken(),
                    'roomid': roomId,
                    'documentid': documentId
                }
            })
                .then(temp => temp.blob())
                .then(res => {
                    dbFetchDocById(documentId).then(doc => {
                        if (doc !== null) {
                            dbSaveData(documentId, doc.fileType, res);
                        }
                        callback(res);
                    });
                });
        } else {
            callback(data);
        }
    });
}

export let generatePreviewLink = (documentId, roomId) => {
    return `${config.FILE_OUT_GATEWAY}/file/preview?token=${fetchSessionToken()}&roomid=${roomId}&documentid=${documentId}`;
}

export let downloadPreview = (type, documentId, roomId, callback) => {
    dbFetchData(documentId).then(data => {
        if (data === null) {
            fetch(`${config.FILE_OUT_GATEWAY}/file/preview?token=${fetchSessionToken()}&roomid=${roomId}&documentid=${documentId}`)
                .then(temp => temp.blob())
                .then(res => {
                    dbFetchDocById(documentId).then(doc => {
                        if (doc !== null) {
                            dbSaveData(documentId, type, res);
                            if (type === 'audio') {
                                let fr = new FileReader();
                                fr.onload = function () {
                                    callback(JSON.parse(this.result));
                                };
                                fr.readAsText(res);
                            } else {
                                callback(res);
                            }
                        } else {
                            console.log('doc does not exist.');
                        }
                    });
                });
        } else {
            if (type === 'audio') {
                let fr = new FileReader();
                fr.onload = function () {
                    callback(JSON.parse(this.result));
                };
                fr.readAsText(data);
            } else {
                callback(data);
            }
        }
    });
}

export let generateCoverLink = (documentId, roomId) => {
    return `${config.FILE_OUT_GATEWAY}/file/coverAudio?token=${fetchSessionToken()}&roomid=${roomId}&documentid=${documentId}`;
}

export let downloadAudioCover = (documentId, roomId, callback) => {
    dbFetchData(`${documentId}_cover`).then(data => {
        if (data === null) {
            fetch(`${config.FILE_OUT_GATEWAY}/file/coverAudio`, {
                method: 'GET',
                headers: {
                    'token': fetchSessionToken(),
                    'roomid': roomId,
                    'documentid': documentId
                }
            })
                .then(temp => temp.blob())
                .then(res => {
                    dbFetchDocById(documentId).then(doc => {
                        if (doc !== null) {
                            dbSaveData(`${documentId}_cover`, 'image', res);
                            callback(res);
                        } else {
                            console.log('doc does not exist.');
                        }
                    });
                });
        } else {
            callback(data);
        }
    });
}

export function generateFileLink(documentId, roomId) {
    return `${config.FILE_OUT_GATEWAY}/file/download-link?token=${fetchSessionToken()}&roomid=${roomId}&documentid=${documentId}`;
}

export function readDocById(documentId, roomId, callback) {
    request('readDocById', { documentId, roomId }, async res => {
        if (res.status === 1) {
            await dbSaveDocument(res.document);
            Memory.startTrx().temp.docs.byId[res.document.id] = res.document;
            if (callback !== undefined) callback(res.document);
        }
    });
}
