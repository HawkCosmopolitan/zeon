
import { dbFindInteractionByPeerId, dbSaveInteractionAtOnce, dbUpdateInteraction } from '../../storage/interactions';
import PubSub from 'pubsub-js';
import { dbFetchRoomWorkspaces, dbFindRoomById, dbSaveMemberAtOnce, dbSaveRoomAtOnce, dbSaveTowerAtOnce, dbSaveWorkspaceAtOnce } from '../../storage/spaces';
import { request } from '../../utils/requests';
import topics from '../../events/topics.json';
import { dbFindUserById, dbSaveUserAtOnce } from '../../storage/users';
import { blogsDict, centralHeader, filespacesDict, homeHeader, interactionsDict, me, membershipsDict, membershipsDictByTowerId, messagesDict, roomsDict, roomsDictById, sampleImages, towersDictById, towersList, usersDict, workspacesDict, workspacesDictById } from '../../memory';
import { dbSaveMessageAtOnce } from '../../storage/messenger';

export function createInteraction(peerId, callback) {
    dbFindInteractionByPeerId(peerId).then(inter => {
        if (inter === null) {
            request('createInteraction', { peerId }, async res => {
                if (res.status === 1 || res.status === 3) {
                    res.tower.secret = { isContact: true };
                    res.tower.contact = res.contact;
                    let cachedUser = await dbFindUserById(peerId);
                    if (cachedUser !== null) {
                        res.contact.avatarBackColor = cachedUser.avatarBackColor;
                        res.workspace.avatarBackColor = cachedUser.avatarBackColor;
                    } else {
                        if (res.status === 1) {
                            let newColor = (Math.random() * 10).toString()[0];
                            res.contact.avatarBackColor = newColor;
                            res.workspace.avatarBackColor = newColor;
                        }
                    }
                    if (!res.tower.headerId) {
                        res.tower.headerId = sampleImages[Math.floor(Math.random() * sampleImages.length)];
                    } else {
                        if (res.tower.headerId === 'help') {
                            res.tower.headerId = centralHeader;
                        } else if (res.tower.id === me.homeId) {
                            res.tower.headerId = homeHeader;
                        }
                    }
                    await dbSaveTowerAtOnce(res.tower);
                    await dbSaveRoomAtOnce(res.room);
                    await dbSaveWorkspaceAtOnce(res.workspace);
                    await dbSaveMemberAtOnce(res.member1);
                    await dbSaveMemberAtOnce(res.member2);
                    await dbSaveUserAtOnce(res.contact);
                    await dbSaveInteractionAtOnce(res.interaction);
                    for (let i = 0; i < res.messages.length; i++) {
                        await dbSaveMessageAtOnce(res.messages[i]);
                    }
                    res.workspace.tower = res.tower;
                    res.workspace.room = res.room;
                    towersDictById[res.tower.id] = res.tower;
                    towersList.push(res.tower);
                    roomsDictById[res.room.id] = res.room;
                    roomsDict[res.tower.id] = [res.room];
                    workspacesDict[res.room.id] = [res.workspace];
                    workspacesDictById[res.workspace.id] = res.workspace;
                    filespacesDict[res.room.id] = [];
                    blogsDict[res.room.id] = [];
                    usersDict[res.contact.id] = res.contact;
                    messagesDict[res.workspace.id] = res.messages;
                    membershipsDict[res.member1.roomId] = {};
                    interactionsDict[res.contact.id] = res.interaction;
                    res.member1.tower = res.tower;
                    res.member1.room = res.room;
                    res.member2.tower = res.tower;
                    res.member2.room = res.room;
                    if (res.member1.userId === me.id) {
                        membershipsDictByTowerId[res.tower.id] = res.member1;
                    } else {
                        membershipsDictByTowerId[res.tower.id] = res.member2;
                    }
                    membershipsDict[res.member1.roomId][res.member1.userId] = res.member1;
                    membershipsDict[res.member2.roomId][res.member2.userId] = res.member2;
                    if (callback !== undefined) callback(res.interaction, res.workspace, res.contact);
                    PubSub.publish(topics.INTERACTION_CREATED, { interaction: res.interaction });
                }
            });
        } else {
            if (callback !== undefined) {
                dbFetchRoomWorkspaces(inter.roomId).then(workspaces => {
                    dbFindUserById(peerId).then(peer => {
                        callback(inter, workspaces[0], peer);
                    });
                });
            }
        }
    });
}

export function readInteractions(callback) {
    request('readInteractions', {}, res => {
        if (res.status === 1) {
            let interactions = res.interactions;
            interactions.forEach(netInteraction => {
                dbUpdateInteraction(netInteraction.id, netInteraction).then(() => { });
            });
            if (callback !== undefined) callback(interactions);
        }
    });
}
