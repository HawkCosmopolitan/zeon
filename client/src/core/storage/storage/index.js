
import { db } from '../setup';

export async function dbSaveFilespace(filespace) {
    let result = await db.post({
        type: 'filespace',
        data: filespace,
        roomId: filespace.roomId
    });
    filespace.id = result.id;
    return { filespace: filespace, rev: result.rev };
}

export function dbUpdateFilespace(id, rev, filespace) {
    db.put({
        _id: id,
        _rev: rev,
        id: filespace.id,
        type: 'filespace',
        data: filespace,
        roomId: filespace.roomId
    });
}

export async function dbSaveFilespaceAtOnce(filespace) {
    await db.post({
        type: 'filespace',
        data: filespace,
        id: filespace.id,
        roomId: filespace.roomId
    });
}

export async function dbFindFilespaceById(filespaceId) {
    let data = await db.find({
        selector: { type: { $eq: "filespace" }, id: { $eq: filespaceId } },
    });
    if (data.docs.length > 0) {
        return data.docs[0].data;
    } else {
        return null;
    }
}

export async function dbUpdateFilespaceById(filespaceId, filespace) {
    let data = await db.find({
        selector: { type: { $eq: "filespace" }, id: { $eq: filespaceId } },
    });
    if (data.docs.length > 0) {
        db.put({
            _id: data.docs[0]._id,
            _rev: data.docs[0]._rev,
            id: filespace.id,
            type: 'filespace',
            data: filespace,
            roomId: filespace.roomId
        });
    }
}

export async function dbDeleteFilespaceById(filespaceId) {
    let data = await db.find({
        selector: { type: { $eq: "filespace" }, id: { $eq: filespaceId } },
    });
    if (data.docs.length > 0) {
        db.remove(data.docs[0]);
    }
}

export async function dbFetchRoomFilespaces(roomId) {
    let data = await db.find({
        selector: { type: { $eq: "filespace"}, roomId: { $eq: roomId } },
    });
    return data.docs.map(packet => packet.data);
}

export async function dbSaveDisk(disk) {
    let result = await db.post({
        type: 'disk',
        data: disk,
        filespaceId: disk.filespaceId
    });
    disk.id = result.id;
    return { disk: disk, rev: result.rev };
}

export function dbUpdateDisk(id, rev, disk) {
    db.put({
        _id: id,
        _rev: rev,
        id: disk.id,
        type: 'disk',
        data: disk,
        filespaceId: disk.filespaceId
    });
}

export async function dbSaveDiskAtOnce(disk) {
    await db.post({
        type: 'disk',
        data: disk,
        id: disk.id,
        filespaceId: disk.filespaceId
    });
}

export async function dbFindDiskById(diskId) {
    let data = await db.find({
        selector: { type: { $eq: "disk" }, id: { $eq: diskId } },
    });
    if (data.docs.length > 0) {
        return data.docs[0].data;
    } else {
        return null;
    }
}

export async function dbUpdateDiskById(diskId, disk) {
    let data = await db.find({
        selector: { type: { $eq: "disk" }, id: { $eq: diskId } },
    });
    if (data.docs.length > 0) {
        db.put({
            _id: data.docs[0]._id,
            _rev: data.docs[0]._rev,
            id: disk.id,
            type: 'disk',
            data: disk,
            filespaceId: disk.filespaceId
        });
    }
}

export async function dbDeleteDiskById(diskId) {
    let data = await db.find({
        selector: { type: { $eq: "disk" }, id: { $eq: diskId } },
    });
    if (data.docs.length > 0) {
        db.remove(data.docs[0]);
    }
}

export async function dbFetchDisks(filespaceId) {
    let data = await db.find({
        selector: { type: { $eq: "disk"}, filespaceId: { $eq: filespaceId } },
    });
    return data.docs.map(packet => packet.data);
}







export async function dbSaveFolder(folder) {
    let result = await db.post({
        type: 'folder',
        folder: folder,
        parentFolderId: folder.parentFolderId
    });
    folder.id = result.id;
    return { folder: folder, rev: result.rev };
}

export function dbUpdateFolder(id, rev, folder) {
    db.put({
        _id: id,
        _rev: rev,
        id: folder.id,
        type: 'folder',
        data: folder,
        parentFolderId: folder.parentFolderId
    });
}

export async function dbSaveFolderAtOnce(folder) {
    await db.post({
        type: 'folder',
        data: folder,
        id: folder.id,
        parentFolderId: folder.parentFolderId
    });
}

export async function dbFindFolderById(folderId) {
    let data = await db.find({
        selector: { type: { $eq: "folder" }, id: { $eq: folderId } },
    });
    if (data.docs.length > 0) {
        return data.docs[0].data;
    } else {
        return null;
    }
}

export async function dbUpdateFolderById(folderId, folder) {
    let data = await db.find({
        selector: { type: { $eq: "folder" }, id: { $eq: folderId } },
    });
    if (data.docs.length > 0) {
        db.put({
            _id: data.docs[0]._id,
            _rev: data.docs[0]._rev,
            id: folder.id,
            type: 'folder',
            data: folder,
            parentFolderId: folder.parentFolderId
        });
    }
}

export async function dbDeleteFolderById(folderId) {
    let data = await db.find({
        selector: { type: { $eq: "folder" }, id: { $eq: folderId } },
    });
    if (data.docs.length > 0) {
        db.remove(data.docs[0]);
    }
}

export async function dbFetchFolders(parentFolderId) {
    let data = await db.find({
        selector: { type: { $eq: "folder"}, parentFolderId: { $eq: parentFolderId } },
    });
    return data.docs.map(packet => packet.data);
}








export async function dbSaveFileAtOnce(folderId, docId) {
    dbFindFolderById(folderId).then(folder => {
        folder.fileIds.push(docId);
        dbUpdateFolderById(folderId, folder);
    });
}
