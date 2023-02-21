
import { fetchMyUserId } from '../me';
import { db } from '../setup';

export async function dbSeeMessage(messageId, viewerId) {
    let messages = await db.find({
        selector: { type: { $eq: "message" }, id: { $eq: messageId } },
    });
    let message = messages.docs[0];
    if (message !== undefined) {
        if (message.data.authorId !== viewerId) {
            message.data.seen = true;
            dbUpdateMessage(message._id, message._rev, message.data);
            let messageSeen = await db.find({
                selector: { type: { $eq: "messageSeen" }, data: { $eq: `${messageId}_${viewerId}` } },
            });
            if (messageSeen.docs[0] === undefined) {
                await db.post({
                    type: 'messageSeen',
                    data: `${messageId}_${viewerId}`
                });
            }
        }
    }
    return true;
}

export async function dbSaveMessageAtOnce(message) {
    message.status = 'created';
    await db.post({
        type: 'message',
        workspaceId: message.wid,
        data: message,
        id: message.id,
    });
}

export async function dbSaveMessage(message) {
    let result = await db.post({
        type: 'message',
        workspaceId: message.wid,
        data: message
    });
    message.id = result.id;
    return { message: message, rev: result.rev };
}

export function dbUpdateMessage(id, rev, message) {
    db.put({
        _id: id,
        _rev: rev,
        id: message.id,
        workspaceId: message.wid,
        type: 'message',
        data: message
    });
}

export async function dbUpdateMessageById(messageId, message, resent) {
    let data = await db.find({
        selector: { type: { $eq: "message" }, id: { $eq: messageId } },
    });
    if (data.docs.length > 0) {
        if (resent) {
            await db.put({
                _id: data.docs[0].id,
                _rev: data.docs[0].rev,
                id: message.id,
                type: 'message',
                workspaceId: message.workspaceId,
                data: message
            });
        } else {
            await db.put({
                _id: data.docs[0]._id,
                _rev: data.docs[0]._rev,
                id: message.id,
                type: 'message',
                workspaceId: message.workspaceId,
                data: message
            });
        }
        return true;
    } else {
        return false;
    }
}

export async function dbFetchWorkspaceMessages(workspaceId) {
    let data = await db.find({
        selector: { type: { $eq: "message" }, workspaceId: { $eq: workspaceId } },
    });
    return data.docs.map(packet => packet.data);
}

export async function dbFetchUnsentMessages() {
    let data = await db.find({
        selector: { type: { $eq: "message" }, data: { status: { $eq: 'pending' } } },
    });
    return data.docs.map(packet => packet.data);
}

export async function dbFindMessageById(messageId) {
    let data = await db.find({
        selector: { type: { $eq: "message" }, id: { $eq: messageId } },
    });
    if (data.docs.length > 0) {
        return data.docs[0].data;
    } else {
        return null;
    }
}