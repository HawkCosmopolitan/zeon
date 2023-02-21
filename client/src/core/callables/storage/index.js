import PubSub from 'pubsub-js';
import topics from '../../events/topics.json';
import { disksDict, disksDictById, filespacesDict, filespacesDictById, foldersDictById } from '../../memory';
import { fetchCurrentRoomId } from '../../storage/auth';
import {
    dbDeleteDiskById,
    dbDeleteFilespaceById, dbDeleteFolderById, dbFetchDisks, dbFetchFolders,
    dbFetchRoomFilespaces, dbFindDiskById, dbFindFilespaceById, dbFindFolderById, dbSaveDisk,
    dbSaveFileAtOnce,
    dbSaveFilespace, dbSaveFolder, dbSaveFolderAtOnce, dbUpdateDisk, dbUpdateDiskById, dbUpdateFilespace,
    dbUpdateFilespaceById, dbUpdateFolder, dbUpdateFolderById
} from '../../storage/storage';
import { request } from '../../utils/requests';

export function createFilespace(title, callback) {
    let pendingFilespace = { title };
    dbSaveFilespace(pendingFilespace).then(({ filespace, rev }) => {
        PubSub.publish(topics.FILESPACE_CREATION_PENDING, { filespace: filespace });
        request('createFilespace', { title }, res => {
            if (res.status === 1) {
                dbUpdateFilespace(filespace.id, rev, res.filespace);
                if (callback !== undefined) callback(res.filespace);
                res.filespace.disks = [];
                filespacesDictById[res.filespace.id] = res.filespace;
                filespacesDict[res.filespace.roomId]?.push(res.filespace);
                disksDict[res.filespace.id] = [];
                PubSub.publish(topics.FILESPACE_CREATED, { filespace: res.filespace });
            }
        });
    });
}

export function updateFilespace(filespaceId, title, callback) {
    dbFindFilespaceById(filespaceId).then((newFilespace) => {
        newFilespace.title = title;
        PubSub.publish(topics.FILESPACE_UPDATE_PENDING, { filespace: newFilespace });
        request('updateFilespace', { title, filespaceId }, res => {
            if (res.status === 1) {
                dbUpdateFilespaceById(filespaceId, newFilespace).then(() => {
                    callback(newFilespace);
                    PubSub.publish(topics.FILESPACE_UPDATED, { filespace: newFilespace });
                });
            }
        });
    });
}

export function deleteFilespace(filespaceId, callback) {
    PubSub.publish(topics.FILESPACE_DELETE_PENDING, { filespaceId: filespaceId });
    request('deleteFilespace', { filespaceId }, res => {
        if (res.status === 1) {
            dbDeleteFilespaceById(filespaceId).then(() => {
                callback(res);
                PubSub.publish(topics.FILESPACE_DELETED, { filespaceId: filespaceId });
            });
        }
    });
}

export function readFilespaces(callback, callback2, offset, count) {
    if (callback !== undefined) {
        dbFetchRoomFilespaces(fetchCurrentRoomId()).then(filespaces => {
            callback(filespaces);
        });
    }
    request('readFilespaces', { offset, count }, res => {
        if (res.status === 1) {
            let filespaces = res.filespaces;
            filespaces.forEach(netFilespace => {
                dbUpdateFilespaceById(netFilespace.id, netFilespace);
            });
            if (callback !== undefined) callback(filespaces);
            if (callback2 !== undefined) callback2(filespaces);
        }
    });
}

export function createDisk(title, filespaceId, callback) {
    let pendingDisk = { title, filespaceId };
    dbSaveDisk(pendingDisk).then(({ disk, rev }) => {
        PubSub.publish(topics.DISK_CREATION_PENDING, { disk: disk });
        request('createDisk', { title, fsId: filespaceId }, res => {
            if (res.status === 1) {
                dbUpdateDisk(disk.id, rev, res.disk);
                res.disk.filespace = filespacesDictById[filespaceId];
                disksDictById[res.disk.id] = res.disk;
                disksDict[filespaceId].push(res.disk);
                res.disk.dataFolder = res.folder;
                dbSaveFolderAtOnce(res.folder);
                res.folder.folders = [];
                res.folder.files = [];
                res.folder.filespace = filespacesDictById[filespaceId];
                foldersDictById[res.folder.id] = res.folder;
                filespacesDictById[filespaceId].disks.push(res.disk);
                if (callback !== undefined) callback(res.disk, res.folder);
                PubSub.publish(topics.DISK_CREATED, { disk: res.disk, folder: res.folder });
            }
        });
    });
}

export function updatedisk(diskId, title, callback) {
    dbFindDiskById(diskId).then((newDisk) => {
        newDisk.title = title;
        PubSub.publish(topics.DISK_UPDATE_PENDING, { disk: newDisk });
        request('updateDisk', { title, diskId }, res => {
            if (res.status === 1) {
                dbUpdateDiskById(diskId, newDisk).then(() => {
                    callback(newDisk);
                    PubSub.publish(topics.DISK_UPDATED, { disk: newDisk });
                });
            }
        });
    });
}

export function deleteDisk(diskId, callback) {
    PubSub.publish(topics.DISK_DELETE_PENDING, { diskId: diskId });
    request('deleteDisk', { diskId }, res => {
        if (res.status === 1) {
            dbDeleteDiskById(diskId).then(() => {
                callback(res);
                PubSub.publish(topics.DISK_DELETED, { diskId: diskId });
            });
        }
    });
}

export function readDisks(callback, callback2, offset, count, filespaceId) {
    if (callback !== undefined) {
        dbFetchDisks(filespaceId).then(disks => {
            callback(disks);
        });
    }
    request('readDisks', { fsId: filespaceId, offset, count }, res => {
        if (res.status === 1) {
            let disks = res.disks;
            disks.forEach(netDisk => {
                dbUpdateDiskById(netDisk.id, netDisk);
            });
            if (callback !== undefined) callback(disks);
            if (callback2 !== undefined) callback2(disks);
        }
    });
}

export function createFolder(title, folderId, callback) {
    let parentFolder = foldersDictById[folderId];
    let pendingFolder = { title, folderId, fileIds: [], folderIds: [], folders: [] };
    dbSaveFolder(pendingFolder).then(({ folder, rev }) => {
        PubSub.publish(topics.FOLDER_CREATION_PENDING, { folder: folder });
        request('createFolder', { title, folderId }, res => {
            if (res.status === 1) {
                res.folder.folders = [];
                dbUpdateFolder(folder.id, rev, res.folder);
                parentFolder.folderIds.push(res.folder.id);
                let miniParentFolder = {
                    id: parentFolder.id,
                    folderIds: parentFolder.folderIds,
                    fileIds: parentFolder.fileIds,
                    title: parentFolder.title,
                    filespaceId: parentFolder.filespaceId
                };
                dbUpdateFolderById(miniParentFolder.id, miniParentFolder);
                res.folder.folders = [];
                res.folder.files = [];
                res.folder.filespace = filespacesDictById[parentFolder.filespaceId];
                foldersDictById[res.folder.id] = res.folder;
                parentFolder.folders.push(res.folder);
                if (callback !== undefined) callback(res.folder);
                PubSub.publish(topics.FOLDER_CREATED, { folder: res.folder });
            }
        });
    });
}

export function updateFolder(folderId, title, callback) {
    dbFindFolderById(folderId).then((newFolder) => {
        newFolder.title = title;
        PubSub.publish(topics.FOLDER_UPDATE_PENDING, { folder: newFolder });
        request('updateFolder', { title, folderId }, res => {
            if (res.status === 1) {
                dbUpdateFolderById(folderId, newFolder).then(() => {
                    callback(newFolder);
                    PubSub.publish(topics.FOLDER_UPDATED, { folder: newFolder });
                });
            }
        });
    });
}

export function deleteFolder(folderId, callback) {
    PubSub.publish(topics.FOLDER_DELETE_PENDING, { folderId: folderId });
    request('deleteFolder', { folderId }, res => {
        if (res.status === 1) {
            dbDeleteFolderById(folderId).then(() => {
                callback(res);
                PubSub.publish(topics.FOLDER_DELETED, { folderId: folderId });
            });
        }
    });
}

export function readFolders(callback, callback2, offset, count, diskId) {
    if (callback !== undefined) {
        dbFetchFolders(diskId).then(folders => {
            callback(folders);
        });
    }
    request('readFolders', { diskId, offset, count }, res => {
        if (res.status === 1) {
            let folders = res.folders;
            folders.forEach(netFolder => {
                dbUpdateFolderById(netFolder.id, netFolder);
            });
            if (callback !== undefined) callback(folders);
            if (callback2 !== undefined) callback2(folders);
        }
    });
}

export function createFile(folderId, docId, callback) {
    request('createFile', { folderId, docId }, async res => {
        if (res.status === 1) {
            await dbSaveFileAtOnce(folderId, docId);
            foldersDictById[folderId].fileIds.push(docId);
            if (callback !== undefined) callback();
            PubSub.publish(topics.FOLDER_CREATED, { docId: docId });
        }
    });
}
