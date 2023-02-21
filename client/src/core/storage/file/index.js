

import { db } from '../setup';

export async function dbSaveDocument(doc) {
    await db.post({
        id: doc.id,
        roomId: doc.roomId,
        type: 'document',
        data: doc
    });
}

export function dbSavePreview(preview) {
    db.post({
        id: preview.id,
        type: 'preview',
        data: preview
    });
}

export function dbUpdateDocument(id, rev, doc) {
    db.put({
        _id: id,
        _rev: rev,
        id: doc.id,
        roomId: doc.roomId,
        type: 'document',
        data: doc
    });
}

export function dbUpdatePreview(id, rev, preview) {
    db.put({
        _id: id,
        _rev: rev,
        id: preview.id,
        type: 'preview',
        data: preview
    });
}

export async function dbFetchDocById(docId) {
    let data;
    try {
        data = await db.find({
            selector: { type: { $eq: "document" }, id: { $eq: docId } },
        });
    } catch (ex) { }
    if (data?.docs?.length > 0) {
        return data.docs[0].data;
    } else {
        return null;
    }
}
