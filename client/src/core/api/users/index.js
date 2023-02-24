
import { usersDict } from '../../memory';
import { dbUpdateUserById } from '../../storage/users';
import { request } from '../../utils/requests';

export function readUserById(targetUserId, callback) {
    request('readUserById', { targetUserId }, res => {
        if (res.status === 1) {
            res.user.onlineState = res.onlineState;
            res.user.lastSeen = res.lastSeen;
            dbUpdateUserById(res.user.id, res.user).then(() => { });
            usersDict[targetUserId] = res.user;
            if (callback !== undefined) callback(res.user, res.onlineState, res.lastSeen);
        }
    });
}

export function readUsers(callback, offset, count, query) {
    request('readUsers', { offset, count, query: query ? query : '' }, async res => {
        if (res.status === 1) {
            let users = res.users;
            for (let i = 0; i < users.length; i++) {
                let netUser = users[i];
                usersDict[netUser.id] = netUser;
                dbUpdateUserById(netUser.id, netUser);
            }
            if (callback !== undefined) callback(users);
        }
    });
}
