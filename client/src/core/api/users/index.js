
import { Memory, usersDict } from '../../memory';
import { Storage } from '../../storage';
import { dbUpdateUserById } from '../../storage/users';
import { request } from '../../utils/requests';

export function readUserById(targetUserId, callback) {
    request('readUserById', { targetUserId }, res => {
        if (res.status === 1) {
            res.user.onlineState = res.onlineState;
            res.user.lastSeen = res.lastSeen;
            Storage.users.dbUpdateUserById(res.user.id, res.user).then(() => { });
            Memory.startTrx().updateUser(res.user).commit();
            if (callback !== undefined) callback(res.user, res.onlineState, res.lastSeen);
        }
    });
}

export function readUsers(callback, offset, count, query) {
    request('readUsers', { offset, count, query: query ? query : '' }, async res => {
        if (res.status === 1) {
            let users = res.users;
            let trx = Memory.startTrx();
            for (let i = 0; i < users.length; i++) {
                let netUser = users[i];
                Storage.users.dbUpdateUserById(netUser.id, netUser);
                trx.updateUser(netUser);
            }
            trx.commit();
            if (callback !== undefined) callback(users);
        }
    });
}
