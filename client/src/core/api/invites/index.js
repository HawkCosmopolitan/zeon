
import { request } from '../../utils/requests';
import topics from '../../events/topics.json';
import { Storage } from '../../storage';
import Bus from '../../events/bus';
import { Memory } from '../../memory';

export function createInvite(targetUserId, roomId, callback) {
    request('createInvite', { targetUserId, roomId }, async res => {
        if (res.status === 1) {
            await Storage.invites.dbSaveInviteAtOnce(res.invite);
            if (callback !== undefined) callback(res.invite);
        }
    });
}

export function cancelInvite(inviteId, callback) {
    request('cancelInvite', { inviteId }, async res => {
        if (res.status === 1) {
            await Storage.invites.dbDeleteInviteById(inviteId);
            if (callback !== undefined) callback();
        }
    });
}

export function acceptInvite(inviteId, callback) {
    request('acceptInvite', { inviteId }, async res => {
        if (res.status === 1) {
            let trx = Memory.startTrx();
            if (!trx.temp.towers.byId[res.tower.id]) {
                await Storage.spaces.dbSaveTowerAtOnce(res.tower);
                trx.updateTower(res.tower);
            }

            let rooms = res.rooms;
            let memberships = res.memberships;

            rooms.forEach(room => {
                if (!trx.temp.rooms.byId[room.id]) {
                    Storage.spaces.dbSaveRoomAtOnce(room);
                    trx.addRoom(room);
                }
            });
            memberships.forEach(member => {
                Storage.spaces.dbSaveMemberAtOnce(member);
                if (member.userId === Memory.data.me.id) {
                    trx.addMembership(member);
                    trx.addTower(member.tower);
                }
            });
            await Storage.invites.dbDeleteInviteById(inviteId);
            trx.removeInvite(res.room.id);
            trx.commit();

            Bus.publish(topics.TOWER_CREATED, { tower: res.tower });
            if (callback !== undefined) callback(res.member, res.tower, res.room);
        }
    });
}

export function declineInvite(inviteId, callback) {
    request('declineInvite', { inviteId }, async res => {
        let invite = Memory.data.invites.byId[inviteId];
        await Storage.invites.dbDeleteInviteById(inviteId);
        Memory.startTrx().removeInvite(invite.roomId).commit();
        if (callback !== undefined) callback();
    });
}

export function readMyInvites(callback) {
    if (callback !== undefined) callback(Object.values(Memory.data.invites.byId));
}

let invites = {
    createInvite,
    cancelInvite,
    acceptInvite,
    declineInvite,
    readMyInvites
};

export default invites;
