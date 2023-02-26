import PubSub from 'pubsub-js';
import Bus from '../../events/bus';
import topics from '../../events/topics.json';
import { Memory } from '../../memory';
import { Storage } from '../../storage';
import { request } from '../../utils/requests';

export function createTower(title, avatarId, isPublic, callback) {
    request('createTower', { title, avatarId, isPublic }, res => {
        if (res.status === 1) {

            Storage.spaces.dbSaveTowerAtOnce(res.tower);
            Storage.spaces.dbSaveRoomAtOnce(res.room);
            Storage.spaces.dbSaveMemberAtOnce(res.member);

            let trx = Memory.startTrx();
            trx.addTower(res.tower);
            trx.addRoom(res.room);
            trx.addMembership(res.member);
            trx.commit();

            if (callback !== undefined) callback(res.tower, res.room, res.member);
            Bus.publish(topics.TOWER_CREATED, { tower: res.tower, room: res.room, member: res.member });
        }
    });
}

export function readTowers(callback, offset, count, mine) {
    request('readTowers', { offset, count, query: '', mine }, res => {
        if (res.status === 1) {
            let towers = res.towers;
            let trx = Memory.startTrx();
            towers.forEach(netTower => {
                Storage.spaces.dbUpdateTowerById(netTower.id, netTower).then(() => { });
                trx.updateTower(netTower);
            });
            trx.commit();
            if (callback !== undefined) callback(towers);
        }
    });
}

export function createRoom(title, avatarId, isPublic, towerId, floor, callback) {
    request('createRoom', { title, avatarId, isPublic, towerId, floor }, async res => {
        if (res.status === 1) {

            Storage.spaces.dbSaveRoomAtOnce(res.room);
            Storage.spaces.dbSaveMemberAtOnce(res.member);

            let trx = Memory.startTrx();
            trx.addRoom(res.room);
            trx.addMembership(res.member);
            trx.commit();

            PubSub.publish(topics.ROOM_CREATED, { room: res.room, member: res.member });
        }
    });
}

export function readRooms(callback, offset, count, towerId) {
    request('readRooms', { offset, count, query: '', towerId }, res => {
        if (res.status === 1) {
            let rooms = res.rooms;
            let trx = Memory.startTrx();
            rooms.forEach(netRoom => {
                Storage.spaces.dbUpdateRoomById(netRoom.id, netRoom);
                trx.updateRoom(netRoom);
            });
            trx.commit();
            if (callback !== undefined) callback(rooms);
        }
    });
}

export function readRoomById(roomId, callback) {
    request('readRoomById', { roomId }, res => {
        if (res.status === 1) {
            if (callback !== undefined) callback(res.room, res.tower);
        }
    });
}
