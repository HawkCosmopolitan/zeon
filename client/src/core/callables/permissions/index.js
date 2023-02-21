

import { request } from '../../utils/requests';
import { dbDeleteInviteById, dbFetchInvites, dbFindInviteById, dbSaveInviteAtOnce } from '../../storage/invites';
import { dbSaveMemberAtOnce, dbSaveRoomAtOnce, dbSaveTowerAtOnce, dbSaveWorkspaceAtOnce } from '../../storage/spaces';
import { blocksDict, blogsDict, blogsDictById, disksDict, disksDictById, docsDictById, filespacesDict, filespacesDictById, foldersDictById, invitesDictById, me, membershipsDictByTowerId, messagesDict, postsDict, postsDictById, roomsDict, roomsDictById, sampleImages, towersDictById, towersList, workspacesDict, workspacesDictById } from '../../memory';
import { dbSaveMessageAtOnce } from '../../storage/messenger';
import { dbSaveDiskAtOnce, dbSaveFilespaceAtOnce, dbSaveFolderAtOnce } from '../../storage/storage';
import { dbSaveBlogAtOnce, dbSavePostAtOnce } from '../../storage/blog';
import { dbSaveDocument } from '../../storage/file';
import { publish } from '../../bus';
import topics from '../../events/topics.json';

export function modifyPermissions(targetUserId, roomId, permissions) {
    request('modifyPermissions', { targetUserId, roomId, permissions }, res => {
        if (res.status === 1) {}
    });
}

export function fetchPermissions(targetUserId, roomId, callback) {
    request('fetchPermissions', { targetUserId, roomId }, res => {
        if (res.status === 1) {
            if (callback) callback(res.permissions);
        }
    });
}
