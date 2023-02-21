import PubSub from 'pubsub-js';
import topics from '../../events/topics.json';
import { dbFetchWorkspaceMessages, dbSaveMessage, dbSaveMessageAtOnce, dbSeeMessage, dbUpdateMessage, dbUpdateMessageById } from '../../storage/messenger';
import { fetchCurrentWorkspaceId } from '../../storage/auth';
import { fetchMyUserId } from '../../storage/me';
import { request } from '../../utils/requests';
import { messagesDict, messagesDictById, workspacesDict, workspacesDictById } from '../../memory';
import { getMeta } from '../../utils/meta';

function finalizeMessage(oldMessageId, message) {
    workspacesDictById[message.wid].lastMessage = message;
    let oldMessage = messagesDictById[oldMessageId];
    oldMessage.id = message.id;
    oldMessage.time = Number(message.time);
    oldMessage.status = message.status;
    messagesDictById[message.id] = oldMessage;
    messagesDictById[oldMessageId] = undefined;
}

export function seeMessage(messageId, callback) {
    dbSeeMessage(messageId, fetchMyUserId()).then(() => {
        request('seeMessage', { messageId }, res => {
            if (res.status === 1) {
                if (callback !== undefined) callback();
            }
        });
    });
}

export function createTextMessage(text, replyToMessageId, forwardFromModuleId, forwardFromMessageId, callback) {
    let pendingMessage = { status: 'pending', type: 'text', text, replyToMessageId, forwardFromModuleId, forwardFromMessageId, authorId: fetchMyUserId(), wid: fetchCurrentWorkspaceId(), time: Date.now() };
    dbSaveMessage(pendingMessage).then(({ message, rev }) => {
        messagesDictById[message.id] = message;
        messagesDict[message.wid].push(message);
        workspacesDictById[message.wid].lastMessage = message;
        if (callback !== undefined) callback(message);
        const oldMessageId = message.id;
        PubSub.publish(topics.MESSAGE_CREATION_PENDING, { message: message });
        request('createTextMessage', { text, replyToMessageId, forwardFromModuleId, forwardFromMessageId }, res => {
            if (res.status === 1) {
                res.message.status = 'created';
                dbUpdateMessage(message.id, rev, res.message);
                finalizeMessage(oldMessageId, res.message);
                if (callback !== undefined) callback(res.message);
                PubSub.publish(topics.MESSAGE_CREATED, { oldMessageId, message: res.message });
            }
        });
    });
}

export function createStickerMessage(stickerId, replyToMessageId, forwardFromModuleId, forwardFromMessageId, callback) {
    let pendingMessage = { status: 'pending', type: 'sticker', stickerId, replyToMessageId, forwardFromModuleId, forwardFromMessageId, authorId: fetchMyUserId(), wid: fetchCurrentWorkspaceId(), time: Date.now() };
    dbSaveMessage(pendingMessage).then(({ message, rev }) => {
        messagesDictById[message.id] = message;
        messagesDict[message.wid].push(message);
        workspacesDictById[message.wid].lastMessage = message;
        if (callback !== undefined) callback(message);
        const oldMessageId = message.id;
        PubSub.publish(topics.MESSAGE_CREATION_PENDING, { message: message });
        request('createStickerMessage', { stickerId, replyToMessageId, forwardFromModuleId, forwardFromMessageId }, res => {
            if (res.status === 1) {
                res.message.status = 'created';
                dbUpdateMessage(message.id, rev, res.message);
                finalizeMessage(oldMessageId, res.message);
                if (callback !== undefined) callback(res.message);
                PubSub.publish(topics.MESSAGE_CREATED, { oldMessageId, message: res.message });
            }
        });
    });
}

export function resendMessage(message, callback) {
    const oldMessageId = message.id;
    if (message.type === 'text') {
        request('allInOneCreateTextMessage', {
            text: message.text, replyToMessageId: message.replyToMessageId, forwardFromModuleId: message.forwardFromModuleId,
            forwardFromMessageId: message.forwardFromMessageId, wid: message.wid
        }, async res => {
            if (res.status === 1) {
                res.message.status = 'created';
                dbUpdateMessageById(oldMessageId, res.message, true);
                finalizeMessage(oldMessageId, res.message);
                if (callback !== undefined) callback(res.message);
                PubSub.publish(topics.MESSAGE_CREATED, { oldMessageId, message: res.message });
            }
        });
    }
}

export function createFileMessage(caption, fileIds, docType, replyToMessageId, forwardFromModuleId, forwardFromMessageId, callback) {
    let pendingMessage = { status: 'pending', type: 'file', caption, fileIds, docType, replyToMessageId, forwardFromModuleId, forwardFromMessageId, authorId: fetchMyUserId(), wid: fetchCurrentWorkspaceId(), time: Date.now() };
    dbSaveMessage(pendingMessage).then(({ message, rev }) => {
        const oldMessageId = message.id;
        messagesDictById[message.id] = message;
        messagesDict[message.wid].push(message);
        workspacesDictById[message.wid].lastMessage = message;
        PubSub.publish(topics.MESSAGE_CREATION_PENDING, { message: message });
        request('createFileMessage', { caption, fileIds, docType, replyToMessageId, forwardFromModuleId, forwardFromMessageId }, res => {
            if (res.status === 1) {
                res.message.status = 'created';
                dbUpdateMessage(message.id, rev, res.message);
                finalizeMessage(oldMessageId, res.message);
                if (callback !== undefined) callback(res.message);
                PubSub.publish(topics.MESSAGE_CREATED, { oldMessageId, message: res.message });
            }
        });
    });
}

export function trySendingFileMessage(caption, fileIds, file, replyToMessageId, forwardFromModuleId, forwardFromMessageId, callback) {
    const docType = file.type.substring(0, file.type.indexOf('/'));
    getMeta(docType, file, m => {
        let pendingMessage = { meta: m, id: Math.random(), status: 'pending', type: 'file', caption, fileIds, docType, replyToMessageId, forwardFromModuleId, forwardFromMessageId, authorId: fetchMyUserId(), wid: fetchCurrentWorkspaceId(), time: Date.now() };
        dbSaveMessage(pendingMessage).then(({ message, rev }) => {
            messagesDictById[message.id] = message;
            messagesDict[message.wid].push(message);
            workspacesDictById[message.wid].lastMessage = message;
            const oldMessageId = message.id;
            if (callback !== undefined) callback(message, rev);
            PubSub.publish(topics.MESSAGE_CREATION_PENDING, { message: message });
        });
    });
}

export function tryFinalizingFileMessage(localMessage, rev, callback) {
    request('createFileMessage', {
        caption: localMessage.caption,
        fileIds: localMessage.fileIds,
        docType: localMessage.docType,
        replyToMessageId: localMessage.replyToMessageId,
        forwardFromModuleId: localMessage.forwardFromModuleId,
        forwardFromMessageId: localMessage.forwardFromMessageId,
        meta: localMessage.meta
    }, res => {
        if (res.status === 1) {
            res.message.status = 'created';
            res.message.meta = localMessage.meta;
            dbUpdateMessage(localMessage.id, rev, res.message);
            finalizeMessage(localMessage.id, res.message);
            if (callback !== undefined) callback(res.message);
            PubSub.publish(topics.MESSAGE_CREATED, { oldMessageId: localMessage.id, message: res.message });
        }
    });
}

export function createStorageMessage(caption, storageId, replyToMessageId, forwardFromModuleId, forwardFromMessageId, callback) {
    let pendingMessage = { status: 'pending', type: 'storage', caption, storageId, replyToMessageId, forwardFromModuleId, forwardFromMessageId, authorId: fetchMyUserId(), wid: fetchCurrentWorkspaceId(), time: Date.now() };
    dbSaveMessage(pendingMessage).then(({ message, rev }) => {
        const oldMessageId = message.id;
        messagesDictById[message.id] = message;
        messagesDict[message.wid].push(message);
        workspacesDictById[message.wid].lastMessage = message;
        PubSub.publish(topics.MESSAGE_CREATION_PENDING, { message: message });
        request('createStorageMessage', { caption, storageId, replyToMessageId, forwardFromModuleId, forwardFromMessageId }, res => {
            if (res.status === 1) {
                res.message.status = 'created';
                dbUpdateMessage(message.id, rev, res.message);
                finalizeMessage(oldMessageId, res.message);
                if (callback !== undefined) callback(res.message);
                PubSub.publish(topics.MESSAGE_CREATED, { oldMessageId, message: res.message });
            }
        });
    });
}

export function createWorkspaceMessage(caption, workspaceId, replyToMessageId, forwardFromModuleId, forwardFromMessageId, callback) {
    let pendingMessage = { status: 'pending', type: 'workspace', caption, workspaceId, replyToMessageId, forwardFromModuleId, forwardFromMessageId, authorId: fetchMyUserId(), wid: fetchCurrentWorkspaceId(), time: Date.now() };
    dbSaveMessage(pendingMessage).then(({ message, rev }) => {
        const oldMessageId = message.id;
        messagesDictById[message.id] = message;
        messagesDict[message.wid].push(message);
        workspacesDictById[message.wid].lastMessage = message;
        PubSub.publish(topics.MESSAGE_CREATION_PENDING, { message: message });
        request('createWorkspaceMessage', { caption, workspaceId, replyToMessageId, forwardFromModuleId, forwardFromMessageId }, res => {
            if (res.status === 1) {
                res.message.status = 'created';
                dbUpdateMessage(message.id, rev, res.message);
                finalizeMessage(oldMessageId, res.message);
                if (callback !== undefined) callback(res.message);
                PubSub.publish(topics.MESSAGE_CREATED, { oldMessageId, message: res.message });
            }
        });
    });
}

export function readMessages(callback) {
    dbFetchWorkspaceMessages(fetchCurrentWorkspaceId()).then(messages => {
        if (callback !== undefined) callback(messages);
    });
}

export function fetchMessages(callback) {
    const workspaceId = fetchCurrentWorkspaceId();
    request('readMessages', {}, res => {
        let messages = res.messages;
        for (let i = 0; i < messages.length; i++) {
            let message = messages[i];
            dbSaveMessageAtOnce(message);
            messagesDictById[message.id] = message;
        }
        if (messages.length > 0 && workspacesDictById[workspaceId].lastMessage === undefined) {
            workspacesDictById[workspaceId].lastMessage = messages[messages.length - 1];
        }
        messagesDict[workspaceId] = messages;
        if (callback) callback(messages);
    });
}