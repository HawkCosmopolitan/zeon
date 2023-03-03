
import { request } from '../../utils/requests';
import topics from '../../events/topics.json';
import { dbFindUserById } from '../../storage/users';
import { Storage } from '../../storage';
import Bus from '../../events/bus';
import { Memory } from '../../memory';

export function createInteraction(peerId, callback) {
    let trx = Memory.startTrx();
    let inter = trx.temp.interactions.byPeerId[peerId];
    if (!inter) {
        request('createInteraction', { peerId }, async res => {
            if (res.status === 1 || res.status === 3) {
                res.tower.secret = { isContact: true };
                res.tower.contact = res.contact;
                let cachedUser = await dbFindUserById(peerId);
                if (cachedUser !== null) {
                    res.contact.avatarBackColor = cachedUser.avatarBackColor;
                } else {
                    if (res.status === 1) {
                        let newColor = (Math.random() * 10).toString()[0];
                        res.contact.avatarBackColor = newColor;
                    }
                }
                Storage.spaces.dbSaveTowerAtOnce(res.tower);
                Storage.spaces.dbSaveRoomAtOnce(res.room);
                Storage.spaces.dbSaveMemberAtOnce(res.member1);
                Storage.spaces.dbSaveMemberAtOnce(res.member2);
                Storage.users.dbSaveUserAtOnce(res.contact);
                Storage.interactions.dbSaveInteractionAtOnce(res.interaction);

                trx.addTower(res.tower);
                trx.addRoom(res.room);
                trx.addUser(res.contact);
                trx.addInteraction(res.interaction);
                trx.addMembership(res.member1);
                trx.addMembership(res.member2);
                trx.commit();

                if (callback !== undefined) callback(res.interaction, res.room, res.contact);
                Bus.publish(topics.INTERACTION_CREATED, { interaction: res.interaction, room: res.room, contact: res.contact });
            }
        });
    } else {
        if (callback !== undefined) {
            callback(inter, trx.temp.rooms.byId[inter.roomId], trx.temp.users.byId[peerId]);
        }
    }
}

export function readInteractions(callback) {
    request('readInteractions', {}, res => {
        if (res.status === 1) {
            let interactions = res.interactions;
            interactions.forEach(netInteraction => {
                Storage.interactions.dbUpdateInteraction(netInteraction.id, netInteraction);
            });
            if (callback !== undefined) callback(interactions);
        }
    });
}

let interactions = {
    createInteraction,
    readInteractions
};

export default interactions;
