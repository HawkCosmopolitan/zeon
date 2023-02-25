

import { request } from '../../utils/requests';

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
