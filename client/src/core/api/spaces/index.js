import PubSub from 'pubsub-js';
import topics from '../../events/topics.json';
import { messagesDict, roomsDict, workspacesDict, workspacesDictById, towersList, membershipsDictByTowerId, towersDictById, roomsDictById, filespacesDict, blogsDict, sampleImages, membershipsDict } from '../../memory';
import { fetchCurrentRoomId, fetchCurrentTowerId } from '../../storage/auth';
import { fetchMyUserId } from '../../storage/me';
import { dbSaveTower, dbSaveRoom, dbSaveWorkspace, dbUpdateTower, dbUpdateRoom, dbUpdateWorkspace, dbSaveMember, dbUpdateMember, dbFindTowerById, dbUpdateTowerById, dbFindRoomById, dbFindWorkspaceById, dbUpdateWorkspaceById, dbUpdateRoomById, dbDeleteTowerById, dbDeleteRoomById, dbDeleteWorkspaceById, dbFetchTowers, dbFetchTowerRooms, dbFetchRoomWorkspaces, dbSaveWorkspaceAtOnce } from '../../storage/spaces';
import { request } from '../../utils/requests';

export function createTower(title, avatarId, isPublic, callback) {
    let pendingTower = { title, avatarId, isPublic };
    dbSaveTower(pendingTower).then(({ tower, rev }) => {
        let pendingRoom = { title: 'untitled', avatarId: -1, isPublic: false };
        dbSaveRoom(pendingRoom).then(({ room, rev: rev2 }) => {
            let pendingMember = { userId: fetchMyUserId(), roomId: room.id, towerId: tower.id };
            dbSaveMember(pendingMember).then(({ member, rev: rev3 }) => {
                PubSub.publish(topics.TOWER_CREATION_PENDING, { tower: tower, room: room, member: member });
                request('createTower', { title, avatarId, isPublic }, res => {
                    if (res.status === 1) {
                        res.workspace.avatarBackColor = (Math.random() * 10).toString()[0];
                        res.tower.headerId = sampleImages[Math.floor(Math.random() * sampleImages.length)];
                        dbUpdateTower(tower.id, rev, res.tower);
                        dbUpdateRoom(room.id, rev2, res.room);
                        dbUpdateMember(member.id, rev3, res.member);
                        dbSaveWorkspaceAtOnce(res.workspace).then(() => {
                            if (callback !== undefined) callback(res.tower, res.room, res.member, res.workspace);
                            res.workspace.tower = res.tower;
                            res.workspace.room = res.room;
                            towersDictById[res.tower.id] = res.tower;
                            towersList.insert(0, res.tower);
                            roomsDict[res.tower.id] = [res.room];
                            roomsDictById[res.room.id] = res.room;
                            workspacesDict[res.room.id] = [res.workspace];
                            workspacesDictById[res.workspace.id] = res.workspace;
                            filespacesDict[res.room.id] = [];
                            blogsDict[res.room.id] = [];
                            messagesDict[res.workspace.id] = [];
                            res.member.tower = res.tower;
                            res.member.room = res.room;
                            membershipsDictByTowerId[res.tower.id] = res.member;
                            membershipsDict[res.room.id] = { [res.member.userId]: res.member };
                            PubSub.publish(topics.TOWER_CREATED, { tower: res.tower, room: res.room, member: res.member, workspace: res.workspace });
                        });
                    }
                });
            });
        });
    });
}

export function readTowers(callback, offset, count, mine) {
    request('readTowers', { offset, count, query: '', mine }, res => {
        if (res.status === 1) {
            let towers = res.towers;
            towers.forEach(netTower => {
                dbUpdateTowerById(netTower.id, netTower).then(() => { });
            });
            if (callback !== undefined) callback(towers);
        }
    });
}

export function updateTower(title, avatarId, isPublic, towerId, callback) {
    dbFindTowerById(towerId).then((newTower) => {
        newTower.title = title;
        newTower.avatarId = avatarId;
        newTower.isPublic = isPublic;
        PubSub.publish(topics.TOWER_UPDATE_PENDING, {});
        request('updateTower', { title, avatarId, isPublic, towerId }, res => {
            if (res.status === 1) {
                dbUpdateTowerById(towerId, newTower).then(() => {
                    if (callback !== undefined) callback(newTower);
                    PubSub.publish(topics.TOWER_UPDATED, { tower: newTower });
                });
            }
        });
    });
}

export function deleteTower(towerId, callback) {
    PubSub.publish(topics.TOWER_DELETE_PENDING, { towerId: towerId });
    request('deleteTower', { towerId }, res => {
        if (res.status === 1) {
            dbDeleteTowerById(towerId).then(() => {
                if (callback !== undefined) callback(res);
                PubSub.publish(topics.TOWER_DELETED, { towerId: towerId });
            });
        }
    });
}

export function createRoom(title, avatarId, isPublic, towerId, floor, callback) {
    let pendingRoom = { title, avatarId, isPublic, towerId };
    dbSaveRoom(pendingRoom).then(({ room, rev }) => {
        PubSub.publish(topics.ROOM_CREATION_PENDING, { room: room });
        request('createRoom', { title, avatarId, isPublic, towerId, floor }, async res => {
            if (res.status === 1) {
                res.workspace.avatarBackColor = (Math.random() * 10).toString()[0];
                dbUpdateRoom(room.id, rev, res.room);
                await dbSaveMember(res.member);
                await dbSaveWorkspaceAtOnce(res.workspace);
                let tower = towersDictById[towerId];
                res.room.tower = tower;
                res.workspace.tower = tower;
                res.workspace.room = res.room;
                res.member.tower = tower;
                res.member.room = res.room;
                roomsDictById[res.room.id] = res.room;
                roomsDict[tower.id].push(res.room);
                workspacesDictById[res.workspace.id] = res.workspace;
                workspacesDict[res.room.id] = [res.workspace];
                filespacesDict[res.room.id] = [];
                blogsDict[res.room.id] = [];
                messagesDict[res.workspace.id] = [];
                res.member.tower = res.tower;
                res.member.room = res.room;
                membershipsDictByTowerId[tower.id] = res.member;
                membershipsDict[res.room.id] = { [res.member.userId]: res.member };
                PubSub.publish(topics.ROOM_CREATED, { room: res.room, workspace: res.workspace });
            }
        });
    });
}

export function readRooms(callback, offset, count, towerId) {
    if (callback !== undefined) {
        dbFetchTowerRooms(towerId).then(rs => {
            callback(rs);
        });
    }
    request('readRooms', { offset, count, query: '', towerId }, res => {
        if (res.status === 1) {
            let rooms = res.rooms;
            rooms.forEach(netRoom => {
                dbUpdateRoomById(netRoom.id, netRoom).then(() => { });
            });
            if (callback !== undefined) callback(rooms);
        }
    });
}

export function updateRoom(title, avatarId, isPublic, roomId, callback) {
    dbFindRoomById(roomId).then((newRoom) => {
        newRoom.title = title;
        newRoom.avatarId = avatarId;
        newRoom.isPublic = isPublic;
        PubSub.publish(topics.ROOM_UPDATE_PENDING, {});
        request('updateRoom', { title, avatarId, isPublic, towerId: newRoom.towerId, roomId }, res => {
            if (res.status === 1) {
                dbUpdateRoomById(roomId, newRoom).then(() => {
                    if (callback !== undefined) callback(newRoom);
                    PubSub.publish(topics.ROOM_UPDATED, { room: newRoom });
                });
            }
        });
    });
}

export function deleteRoom(towerId, roomId, callback) {
    PubSub.publish(topics.ROOM_DELETE_PENDING, { roomId: roomId });
    request('deleteRoom', { towerId, roomId }, res => {
        if (res.status === 1) {
            dbDeleteRoomById(roomId).then(() => {
                if (callback !== undefined) callback(res);
                PubSub.publish(topics.ROOM_DELETED, { roomId: roomId });
            });
        }
    });
}

export function createWorkspace(title, callback) {
    const towerId = fetchCurrentTowerId();
    let pendingWorkspace = { title, roomId: fetchCurrentRoomId() };
    dbSaveWorkspace(pendingWorkspace).then(({ workspace, rev }) => {
        PubSub.publish(topics.WORKSPACE_CREATION_PENDING, { workspace: workspace });
        request('createWorkspace', { title }, res => {
            if (res.status === 1) {
                res.workspace.avatarBackColor = (Math.random() * 10).toString()[0];
                dbUpdateWorkspace(workspace.id, rev, res.workspace);
                if (callback !== undefined) callback(res.workspace);
                res.workspace.room = roomsDictById[res.workspace.roomId];
                res.workspace.tower = towersDictById[res.workspace.room.towerId];
                console.log(workspace.room);
                workspacesDictById[res.workspace.id] = res.workspace;
                workspacesDict[res.workspace.roomId]?.push(res.workspace);
                messagesDict[res.workspace.id] = [];
                PubSub.publish(topics.WORKSPACE_CREATED, { workspace: res.workspace });
            }
        });
    });
}

export function readWorkspaces(callback, callback2, offset, count) {
    let roomId = fetchCurrentRoomId();
    dbFetchRoomWorkspaces(roomId).then(ws => {
        if (callback !== undefined) callback(ws);
        request('readWorkspaces', { offset, count, query: '' }, res => {
            if (res.status === 1) {
                let workspaces = res.workspaces;
                workspaces.forEach(netWorkspace => {
                    dbUpdateWorkspaceById(netWorkspace.id, netWorkspace).then(() => { });
                });
                if (callback !== undefined) callback(workspaces);
                if (callback2 !== undefined) callback2(workspaces);
            }
        });
    });
}

export function updateWorkspace(title, workspaceId, callback) {
    dbFindWorkspaceById(workspaceId).then((newWorkspace) => {
        newWorkspace.title = title;
        PubSub.publish(topics.WORKSPACE_UPDATE_PENDING, {});
        request('updateWorkspace', { title, wsId: workspaceId }, res => {
            if (res.status === 1) {
                dbUpdateWorkspaceById(workspaceId, newWorkspace).then(() => {
                    if (callback !== undefined) callback(newWorkspace);
                    PubSub.publish(topics.WORKSPACE_UPDATED, { workspace: newWorkspace });
                });
            }
        });
    });
}

export function deleteWorkspace(workspaceId, callback) {
    PubSub.publish(topics.WORKSPACE_DELETE_PENDING, { workspaceId: workspaceId });
    request('deleteWorkspace', { wsId: workspaceId }, res => {
        if (res.status === 1) {
            dbDeleteWorkspaceById(workspaceId).then(() => {
                if (callback !== undefined) callback(res);
                PubSub.publish(topics.WORKSPACE_DELETED, { workspaceId: workspaceId });
            });
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
