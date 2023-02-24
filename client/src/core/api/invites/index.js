
import { request } from '../../utils/requests';
import { dbDeleteInviteById, dbFetchInvites, dbFindInviteById, dbSaveInviteAtOnce } from '../../storage/invites';
import { dbSaveMemberAtOnce, dbSaveRoomAtOnce, dbSaveTowerAtOnce, dbSaveWorkspaceAtOnce } from '../../storage/spaces';
import { blocksDict, blogsDict, blogsDictById, centralHeader, disksDict, disksDictById, docsDictById, filespacesDict, filespacesDictById, foldersDictById, homeHeader, invitesDictById, me, membershipsDict, membershipsDictByTowerId, messagesDict, postsDict, postsDictById, roomsDict, roomsDictById, sampleImages, towersDictById, towersList, workspacesDict, workspacesDictById } from '../../memory';
import { dbSaveMessageAtOnce } from '../../storage/messenger';
import { dbSaveDiskAtOnce, dbSaveFilespaceAtOnce, dbSaveFolderAtOnce } from '../../storage/storage';
import { dbSaveBlogAtOnce, dbSavePostAtOnce } from '../../storage/blog';
import { dbSaveDocument } from '../../storage/file';
import { publish } from '../../bus';
import topics from '../../events/topics.json';

export function createInvite(targetUserId, roomId, callback) {
    request('createInvite', { targetUserId, roomId }, res => {
        if (res.status === 1) {
            dbSaveInviteAtOnce(res.invite).then(() => {
                if (callback !== undefined) callback(res.invite);
            });
        }
    });
}

export function cancelInvite(inviteId, callback) {
    request('cancelInvite', { inviteId }, res => {
        if (res.status === 1) {
            dbDeleteInviteById(inviteId).then(() => {
                if (callback !== undefined) callback();
            });
        }
    });
}

export function acceptInvite(inviteId, callback) {
    request('acceptInvite', { inviteId }, async res => {
        if (res.status === 1) {
            if (!towersDictById[res.tower.id]) {
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
                towersDictById[res.tower.id] = res.tower;
            }

            let rooms = res.rooms;
            let workspaces = res.workspaces;
            let documents = res.documents;
            let memberships = res.memberships;
            let filespaces = res.filespaces;
            let disks = res.disks;
            let folders = res.folders;
            let files = res.files;
            let blogs = res.blogs;
            let posts = res.posts;

            let roomsThatExist = {};

            rooms.forEach(room => {
                if (!roomsDictById[room.id]) {
                    dbSaveRoomAtOnce(room);
                    roomsDictById[room.id] = room;
                    room.tower = towersDictById[room.towerId];
                }
                if (!workspacesDict[room.id]) {
                    workspacesDict[room.id] = [];
                } else {
                    roomsThatExist[room.id] = true;
                }
                if (!membershipsDict[room.id]) {
                    membershipsDict[room.id] = {};
                }
                if (!filespacesDict[room.id]) {
                    filespacesDict[room.id] = [];
                }
                if (!blogsDict[room.id]) {
                    blogsDict[room.id] = [];
                }
                if (!blocksDict[room.id]) {
                    blocksDict[room.id] = [];
                }
            });

            workspaces.forEach(workspace => {
                if (!workspacesDictById[workspace.id]) {
                    let newColor = (Math.random() * 10).toString()[0];
                    workspace.avatarBackColor = newColor;
                    dbSaveWorkspaceAtOnce(workspace);
                    workspacesDictById[workspace.id] = workspace;
                    workspacesDict[workspace.roomId].push(workspace);
                    workspace.room = roomsDictById[workspace.roomId];
                    workspace.tower = towersDictById[workspace.room.towerId];
                    messagesDict[workspace.id] = [];
                }
            });

            memberships.forEach(member => {
                if (!roomsThatExist[member.roomId]) {
                    dbSaveMemberAtOnce(member);
                }
                if (member.userId === me.id) {
                    member.tower = towersDictById[member.towerId];
                    member.room = roomsDictById[member.roomId];
                    membershipsDictByTowerId[member.towerId] = member;
                    roomsDict[member.tower.id] = [];
                    if (towersList.filter(tower => (tower.id === member.tower.id)).length === 0) {
                        towersList.push(member.tower);
                    }
                }
                membershipsDict[member.roomId][member.userId] = member;
            });

            filespaces.forEach(filespace => {
                if (!filespacesDictById[filespace.id]) {
                    dbSaveFilespaceAtOnce(filespace);
                    filespace.room = roomsDictById[filespace.roomId];
                    filespace.tower = towersDictById[filespace.room.id];
                    filespace.disks = [];
                    filespacesDictById[filespace.id] = filespace;
                    filespacesDict[filespace.roomId].push(filespace);
                    disksDict[filespace.id] = [];
                }
            });

            disks.forEach(disk => {
                if (!disksDictById[disk.id]) {
                    dbSaveDiskAtOnce(disk);
                    disk.filespace = filespacesDictById[disk.filespaceId];
                    disksDictById[disk.id] = disk;
                    disksDict[disk.filespaceId].push(disk);
                }
            });

            folders.forEach(folder => {
                if (!foldersDictById[folder.id]) {
                    dbSaveFolderAtOnce(folder);
                    folder.filespace = filespacesDictById[folder.filespaceId];
                    foldersDictById[folder.id] = folder;
                }
            });

            documents.forEach(doc => {
                if (!docsDictById[doc.id]) {
                    doc.roomId = doc.roomIds[0];
                    dbSaveDocument(doc);
                    docsDictById[doc.id] = doc;
                }
            });

            blogs.forEach(blog => {
                if (!blogsDictById[blog.id]) {
                    dbSaveBlogAtOnce(blog);
                    blog.room = roomsDictById[blog.roomId];
                    blogsDictById[blog.id] = blog;
                    blogsDict[blog.roomId].push(blog);
                    postsDict[blog.id] = [];
                }
            });

            posts.forEach(post => {
                if (!postsDictById[post.id]) {
                    dbSavePostAtOnce(post);
                    post.blog = blogsDictById[post.blogId];
                    postsDictById[post.id] = post;
                    postsDict[post.blogId].push(post);
                }
            });

            // revision of rooms ( more references )
            rooms.forEach(room => {
                roomsDict[room.towerId].push(room);
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

            await dbDeleteInviteById(inviteId);
            delete invitesDictById[res.room.id];

            publish(topics.TOWER_CREATED, { tower: res.tower });
            if (callback !== undefined) callback(res.member, res.tower, res.room, res.workspace);
        }
    });
}

export function declineInvite(inviteId, callback) {
    request('declineInvite', { inviteId }, async res => {
        let invite = invitesDictById[inviteId];
        await dbDeleteInviteById(inviteId);
        delete invitesDictById[invite.roomId];
        if (callback !== undefined) callback();
    });
}

export function readMyInvites(callback) {
    dbFetchInvites().then(invites => {
        if (callback !== undefined) callback(invites);
    });
}
