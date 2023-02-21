
import { request } from '../../utils/requests';
import topics from '../../events/topics.json';
import PubSub from 'pubsub-js';
import { fetchCurrentRoomId } from '../../storage/auth';

export function createBlock(x, y, width, height, data, callback) {
    const roomId = fetchCurrentRoomId();
    request('createBlock', { x, y, width, height, data }, res => {
        PubSub.publish(topics.BLOCK_CREATED, { block: res.block, roomId });
        if (callback !== undefined) callback(res.block);
    });
}

export function deleteBlock(blockId, callback) {
    const roomId = fetchCurrentRoomId();
    request('deleteBlock', { blockId: blockId }, res => {
        PubSub.publish(topics.BLOCK_DELETED, { blockId: blockId, roomId });
        if (callback !== undefined) callback(res.block);
    });
}

export function readBlocks(callback) {
    request('readBlocks', { }, res => {
        if (callback !== undefined) callback(res.blocks);
    });
}

export function updateBlock(blockId, x, y, width, height, callback) {
    request('updateBlock', { blockId, x, y, width, height }, res => {
        if (callback !== undefined) callback();
    });
}
