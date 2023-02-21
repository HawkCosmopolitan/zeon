
import { db } from '../setup';

export function dbSaveData(docId, fileType, data) {
    try {
        if (fileType === 'image') {
            if (data.type === 'image/jpeg') {
                db.putAttachment(docId + '_data', docId + '_attachment', data, 'image/jpeg');
            } else {
                db.putAttachment(docId + '_data', docId + '_attachment', data, 'image/png');
            }
        } else if (fileType === 'audio') {
            db.putAttachment(docId + '_data', docId + '_attachment', data, 'application/json');
        } else if (fileType === 'video') {
            db.putAttachment(docId + '_data', docId + '_attachment', data, 'image/png');
        }
    } catch (ex) { }
}

export async function dbFetchData(docId) {
    let data;
    try {
        data = await db.getAttachment(docId + '_data', docId + '_attachment');
    } catch (ex) {
        data = null;
    }
    return data;
}
