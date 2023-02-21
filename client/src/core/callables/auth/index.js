import PubSub, { unsubscribe } from 'pubsub-js';
import { isTopTag } from '../../../App';
import { publish, subscribe } from '../../bus';
import topics from '../../events/topics.json';
import { blocksDict, blogsDict, blogsDictById, centralHeader, disksDict, disksDictById, docsDictById, filespacesDict, filespacesDictById, foldersDictById, homeHeader, interactionsDict, me, membershipsDict, membershipsDictByTowerId, messagesDict, postsDict, postsDictById, roomsDict, roomsDictById, sampleImages, towersDictById, towersList, usersDict, workspacesDict, workspacesDictById } from '../../memory';
import { setWorkspaceAfterEnteringRoom, socket } from '../../network/socket';
import { saveSessionToken, fetchSessionToken, saveEmail, fetchEmail, saveCurrentTowerId, saveCurrentRoomId, saveCurrentWorkspaceId } from '../../storage/auth';
import { dbSaveBlog, dbSaveBlogAtOnce, dbSavePostAtOnce } from '../../storage/blog';
import { dbSaveDocument } from '../../storage/file';
import { dbSaveInteractionAtOnce } from '../../storage/interactions';
import { fetchFirstName, fetchMyHomeId, saveAvatarBackColor, saveCentralTowerId, saveFirstName, saveLastName, saveMyHomeId, saveMyUserId } from '../../storage/me';
import { dbFindTowerById, dbSaveMember, dbSaveMemberAtOnce, dbSaveRoom, dbSaveRoomAtOnce, dbSaveTower, dbSaveTowerAtOnce, dbSaveWorkspace, dbSaveWorkspaceAtOnce } from '../../storage/spaces';
import { dbSaveDiskAtOnce, dbSaveFilespaceAtOnce, dbSaveFolderAtOnce } from '../../storage/storage';
import recursivelyFetchFoldersAndFiles from '../../utils/file-tree-resolver';
import { request } from '../../utils/requests';
import { readDocById } from '../file';
import { readMessages } from '../messenger';
import { readUserById } from '../users';

export function verify(auth0AccessToken, callback) {
    request('verifyUser', { auth0AccessToken: auth0AccessToken }, res => {
        if (res.status === 1) {
            if (res.session !== undefined) {
                let newColor = (Math.random() * 10).toString()[0];
                res.user.avatarBackColor = newColor;
                saveAvatarBackColor(newColor);
                saveSessionToken(res.session.token);
                saveMyUserId(res.user.id);
                saveFirstName(res.user.firstName);
                saveLastName(res.user.lastName);
                saveMyHomeId(res.user.secret.homeId);
                saveEmail(res.user.secret.email);

                me.id = res.user.id;
                me.firstName = res.user.firstName;
                me.lastName = res.user.lastName;
                me.homeId = res.user.secret.homeId;
                me.email = res.user.secret.email;
                me.avatarBackColor = newColor;

                usersDict[me.id] = me;

                let towers = res.towers;
                let rooms = res.rooms;
                let workspaces = res.workspaces;
                let myMemberships = res.myMemberships;
                let allMemberships = res.allMemberships;
                let interactions = res.interactions;
                let filespaces = res.filespaces;
                let disks = res.disks;
                let folders = res.folders;
                let files = res.files;
                let documents = res.documents;
                let blogs = res.blogs;
                let posts = res.posts;

                towers.forEach(tower => {
                    if (!tower.headerId) {
                        tower.headerId = sampleImages[Math.floor(Math.random() * sampleImages.length)];
                    } else {
                        if (tower.headerId === 'help') {
                            tower.headerId = centralHeader;
                        } else if (tower.id === me.homeId) {
                            tower.headerId = homeHeader;
                        }
                    }
                    dbSaveTowerAtOnce(tower);
                    towersDictById[tower.id] = tower;
                    towersList.push(tower);
                    roomsDict[tower.id] = [];
                });

                rooms.forEach(room => {
                    dbSaveRoomAtOnce(room);
                    roomsDictById[room.id] = room;
                    roomsDict[room.towerId].push(room);
                    room.tower = towersDictById[room.towerId];
                    workspacesDict[room.id] = [];
                    filespacesDict[room.id] = [];
                    blogsDict[room.id] = [];
                    blocksDict[room.id] = [];
                    membershipsDict[room.id] = {};
                });

                workspaces.forEach(workspace => {
                    let newColor = (Math.random() * 10).toString()[0];
                    workspace.avatarBackColor = newColor;
                    dbSaveWorkspaceAtOnce(workspace);
                    workspacesDictById[workspace.id] = workspace;
                    workspacesDict[workspace.roomId].push(workspace);
                    workspace.room = roomsDictById[workspace.roomId];
                    workspace.tower = towersDictById[workspace.room.towerId];
                    messagesDict[workspace.id] = [];
                });

                myMemberships.forEach(member => {
                    dbSaveMemberAtOnce(member);
                    member.tower = towersDictById[member.towerId];
                    member.room = roomsDictById[member.roomId];
                    membershipsDictByTowerId[member.tower.id] = member;
                    membershipsDict[member.roomId][member.userId] = member;
                });

                allMemberships.forEach(member => {
                    dbSaveMemberAtOnce(member);
                    member.tower = towersDictById[member.towerId];
                    member.room = roomsDictById[member.roomId];
                    membershipsDict[member.roomId][member.userId] = member;
                    readUserById(member.userId, user => { });
                });

                interactions.forEach(interaction => {
                    dbSaveInteractionAtOnce(interaction);
                    let peerId = (interaction.user1Id === me.id ? interaction.user2Id : interaction.user1Id);
                    interactionsDict[peerId] = interaction;
                    if (!usersDict[peerId]) {
                        readUserById(peerId, (user, onlineState, lastSeen) => {
                            usersDict[peerId] = user;
                            towersDictById[roomsDictById[interaction.roomId]?.towerId].contact = user;
                        });
                    }
                });

                filespaces.forEach(filespace => {
                    dbSaveFilespaceAtOnce(filespace);
                    filespace.room = roomsDictById[filespace.roomId];
                    filespace.tower = towersDictById[filespace.room.id];
                    filespace.disks = [];
                    filespacesDictById[filespace.id] = filespace;
                    filespacesDict[filespace.roomId].push(filespace);
                    disksDict[filespace.id] = [];
                });

                disks.forEach(disk => {
                    dbSaveDiskAtOnce(disk);
                    disk.filespace = filespacesDictById[disk.filespaceId];
                    disksDictById[disk.id] = disk;
                    disksDict[disk.filespaceId].push(disk);
                });

                folders.forEach(folder => {
                    dbSaveFolderAtOnce(folder);
                    folder.filespace = filespacesDictById[folder.filespaceId];
                    foldersDictById[folder.id] = folder;
                });

                documents.forEach(doc => {
                    doc.roomId = doc.roomIds[0];
                    dbSaveDocument(doc);
                    docsDictById[doc.id] = doc;
                });

                blogs.forEach(blog => {
                    dbSaveBlogAtOnce(blog);
                    blog.room = roomsDictById[blog.roomId];
                    blogsDictById[blog.id] = blog;
                    blogsDict[blog.roomId].push(blog);
                    postsDict[blog.id] = [];
                });

                posts.forEach(post => {
                    dbSavePostAtOnce(post);
                    post.blog = blogsDictById[post.blogId];
                    postsDictById[post.id] = post;
                    postsDict[post.blogId].push(post);
                });

                // revision of folders ( more references )
                folders.forEach(folder => {
                    folder.folders = folder.folderIds.map(folderId => { return foldersDictById[folderId]; });
                    folder.files = folder.fileIds.map(fileId => { return docsDictById[fileId]; });
                });

                // revision of disks ( more references )
                disks.forEach(async disk => {
                    disk.dataFolder = foldersDictById[disk.dataFolderId];
                    disk.dataFolder.disk = disk;
                    filespacesDictById[disk.filespaceId].disks.push(disk);
                });

                if (callback !== undefined) callback(res);
                PubSub.publish(topics.SETUP_DONE, {});
            } else {
                if (callback !== undefined) callback(res);
                PubSub.publish(topics.VERIFIED, {});
            }
        }
    });
}

export function setup(accessToken, firstName, lastName, callback) {
    request('setupUser', { auth0AccessToken: accessToken, firstName: firstName, lastName: lastName }, res => {
        if (res.status === 1) {
            if (res.session !== undefined) {

                saveEmail(res.user.secret.email);
                me.email = res.user.secret.email;
                let newColor = (Math.random() * 10).toString()[0];
                res.user.avatarBackColor = newColor;
                saveAvatarBackColor(newColor);
                saveSessionToken(res.session.token);
                saveMyUserId(res.user.id);
                me.id = res.user.id;
                saveFirstName(firstName);
                me.firstName = firstName;
                saveLastName(lastName);
                me.lastName = lastName;
                saveMyHomeId(res.user.secret.homeId);
                me.homeId = res.user.secret.homeId;

                res.workspace.avatarBackColor = newColor;

                if (!res.tower.headerId) {
                    res.tower.headerId = sampleImages[Math.floor(Math.random() * sampleImages.length)];
                } else {
                    if (res.tower.headerId === 'help') {
                        res.tower.headerId = centralHeader;
                    } else if (res.tower.id === me.homeId) {
                        res.tower.headerId = homeHeader;
                    }
                }
                dbSaveTowerAtOnce(res.tower);

                towersDictById[res.tower.id] = res.tower;
                towersList.push(res.tower);
                dbSaveRoomAtOnce(res.room);
                roomsDictById[res.room.id] = res.room;
                roomsDict[res.tower.id] = [res.room];
                dbSaveMemberAtOnce(res.member);
                dbSaveWorkspaceAtOnce(res.workspace);
                workspacesDictById[res.workspace.id] = res.workspace;
                workspacesDict[res.room.id] = [res.workspace];
                filespacesDict[res.room.id] = [];
                blogsDict[res.room.id] = [];
                blocksDict[res.room.id] = [];
                membershipsDict[res.room.id] = { [res.member.userId]: res.member };
                res.workspace.tower = res.tower;
                res.workspace.room = res.room;
                messagesDict[res.workspace.id] = [];
                res.member.tower = res.tower;
                res.member.room = res.room;
                membershipsDictByTowerId[res.tower.id] = res.member;

                let defaultMembership = res.defaultMembership;
                let centralTower = res.centralTower;
                let centralTowerHall = res.centralTowerHall;
                let filespaces = res.filespaces;
                let disks = res.disks;
                let folders = res.folders;
                let files = res.files;
                let documents = res.documents;
                let blogs = res.blogs;
                let posts = res.posts;
                let workspaces = res.workspaces;

                dbSaveTowerAtOnce(centralTower);
                towersDictById[centralTower.id] = centralTower;
                centralTower.headerId = 'help';
                towersList.push(centralTower);
                roomsDict[centralTower.id] = [];

                dbSaveRoomAtOnce(centralTowerHall);
                roomsDictById[centralTowerHall.id] = centralTowerHall;
                roomsDict[centralTowerHall.towerId].push(centralTowerHall);
                centralTowerHall.tower = towersDictById[centralTowerHall.towerId];
                workspacesDict[centralTowerHall.id] = [];
                filespacesDict[centralTowerHall.id] = [];
                blogsDict[centralTowerHall.id] = [];
                blocksDict[centralTowerHall.id] = [];
                membershipsDict[centralTowerHall.id] = {};

                dbSaveMemberAtOnce(defaultMembership);
                defaultMembership.tower = towersDictById[defaultMembership.towerId];
                defaultMembership.room = roomsDictById[defaultMembership.roomId];
                membershipsDictByTowerId[defaultMembership.tower.id] = defaultMembership;
                membershipsDict[defaultMembership.roomId][defaultMembership.userId] = defaultMembership;

                workspaces.forEach(workspace => {
                    let newColor = (Math.random() * 10).toString()[0];
                    workspace.avatarBackColor = newColor;
                    dbSaveWorkspaceAtOnce(workspace);
                    workspacesDictById[workspace.id] = workspace;
                    workspacesDict[workspace.roomId].push(workspace);
                    workspace.room = roomsDictById[workspace.roomId];
                    workspace.tower = towersDictById[workspace.room.towerId];
                    messagesDict[workspace.id] = [];
                });

                filespaces.forEach(filespace => {
                    dbSaveFilespaceAtOnce(filespace);
                    filespace.room = roomsDictById[filespace.roomId];
                    filespace.tower = towersDictById[filespace.room.id];
                    filespace.disks = [];
                    filespacesDictById[filespace.id] = filespace;
                    filespacesDict[filespace.roomId].push(filespace);
                    disksDict[filespace.id] = [];
                });

                disks.forEach(disk => {
                    dbSaveDiskAtOnce(disk);
                    disk.filespace = filespacesDictById[disk.filespaceId];
                    disksDictById[disk.id] = disk;
                    disksDict[disk.filespaceId].push(disk);
                });

                folders.forEach(folder => {
                    dbSaveFolderAtOnce(folder);
                    folder.filespace = filespacesDictById[folder.filespaceId];
                    foldersDictById[folder.id] = folder;
                });

                documents.forEach(doc => {
                    doc.roomId = doc.roomIds[0];
                    dbSaveDocument(doc);
                    docsDictById[doc.id] = doc;
                });

                blogs.forEach(blog => {
                    dbSaveBlogAtOnce(blog);
                    blog.room = roomsDictById[blog.roomId];
                    blogsDictById[blog.id] = blog;
                    blogsDict[blog.roomId].push(blog);
                    postsDict[blog.id] = [];
                });

                posts.forEach(post => {
                    dbSavePostAtOnce(post);
                    post.blog = blogsDictById[post.blogId];
                    postsDictById[post.id] = post;
                    postsDict[post.blogId].push(post);
                });

                // revision of folders ( more references )
                folders.forEach(folder => {
                    folder.folders = folder.folderIds.map(folderId => { return foldersDictById[folderId]; });
                    folder.files = folder.fileIds.map(fileId => { return docsDictById[fileId]; });
                });

                // revision of disks ( more references )
                disks.forEach(async disk => {
                    disk.dataFolder = foldersDictById[disk.dataFolderId];
                    disk.dataFolder.disk = disk;
                    filespacesDictById[disk.filespaceId].disks.push(disk);
                });

                if (callback !== undefined) callback(res);
                PubSub.publish(topics.SETUP_DONE, {});
            }
        }
    });
}

export function authenticate() {
    setTimeout(() => {
        console.log('authenticating...');
        socket.emit('authenticate', { token: fetchSessionToken() });
    });
}

export function enterRoom(roomId, openWorkspace, workspaceId, tag) {
    if (!tag || isTopTag(tag)) {
        setTimeout(() => {
            saveCurrentWorkspaceId(undefined);
            console.log('entering room...');
            saveCurrentRoomId(roomId);
            if (workspaceId) {
                saveCurrentWorkspaceId(workspaceId);
            }
            setWorkspaceAfterEnteringRoom(workspaceId);
            socket.emit('enterRoom', { roomId: roomId, openWorkspace: openWorkspace });
        });
    }
}

export function enterWorkspace(workspaceId, openWorkspace) {
    console.log('entering workspace...');
    setTimeout(() => {
        saveCurrentWorkspaceId(workspaceId);
        socket.emit('enterWorkspace', { workspaceId, openWorkspace });
    });
}

export function enterRoomAndWorkspace(workspaceId, tag) {
    if (!tag || isTopTag(tag)) {
        console.log('entering room and workspace...');
        const roomId = workspacesDictById[workspaceId].roomId;
        setTimeout(() => {
            saveCurrentRoomId(roomId);
            saveCurrentWorkspaceId(workspaceId);
            socket.emit('enterRoomAndWorkspace', { roomId, workspaceId });
        });
    }
}

export function enterTower(towerId, tag) {
    if (!tag || isTopTag(tag)) {
        saveCurrentRoomId(undefined);
        saveCurrentWorkspaceId(undefined);
        console.log('entering tower...');
        saveCurrentTowerId(towerId);
        console.log('entered tower.');
        publish(topics.ENTERED_TOWER, {});
    }
}
