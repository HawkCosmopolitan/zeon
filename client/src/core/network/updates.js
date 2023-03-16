
import { socket } from "./socket";
import updates from './updates.json';
import { Memory } from "../memory";
import { readRoomById } from "../api/spaces";
import formatDate from "../utils/date-formatter";
import Bus from "../events/bus";
import { Storage } from "../storage";
import { stompClient } from './rabbitmq';
import Crypto from '../crypto';

let updatesDictionary = {};

export function attachUpdateListeners() {

    socket.on('onExchangePubKeys', ({ requesterId, roomId, peerPubKey }) => {
        Crypto.instance().answerDH(roomId, requesterId, peerPubKey, myPublicKey => {
            socket.emit('answerExchangePubKeys', { pubKey: myPublicKey, requesterId, roomId });
        }, secret => {

        });
    });

    socket.on('on-contact-online-state-change', ({ userId, onlineState, lastSeen }) => {
        let user = Memory.data.users.byId[userId];
        if (user) {
            let lastSeenString = '';
            if (!onlineState) {
                lastSeenString = 'last seen ' + (lastSeen === 0 ? 'prehistory' : (formatDate(lastSeen) + ' ' + new Date(lastSeen).toTimeString().substring(0, 5)));
            }
            let trx = Memory.startTrx();
            user.online = onlineState;
            user.lastSeen = lastSeen;
            user.lastSeenString = lastSeenString;
            trx.commit();
            Bus.publish(updates.ON_CONTACT_ONLINE_STATE_CHANGE, { userId: userId, peerStatus: onlineState ? 'online' : lastSeenString });
        }
    });

    socket.on('on-active-calls-sync', data => {
        let wArr = Object.keys(data.workspaceIds);
        let trx = Memory.startTrx();
        for (let i = 0; i < wArr.length; i++) {
            trx.addActiveCall(wArr[i]);
        }
        trx.commit();
        Bus.publish(updates.ON_ACTIVE_CALLS_SYNC, data);
    });
    socket.on('on-call-create', data => {
        Memory.startTrx().addActiveCall(data.spaceId).commit();
        Bus.publish(updates.ON_CALL_CREATE, data);
    });
    socket.on('on-call-destruct', data => {
        Memory.startTrx().removeActiveCall(data.spaceId).commit();
        Bus.publish(updates.ON_CALL_DESTRUCT, data);
    });

    updatesDictionary[updates.ROOM_KEY_REFERESHED] = async (data, done) => {
        let { encryptedKey, salt, roomId } = data;
        Crypto.instance().notifyNewRoomKey(roomId, encryptedKey, salt);
        done();
    };
    updatesDictionary[updates.PERMISSIONS_MODIFIED] = async (data, done) => {
        let { member } = data;
        Storage.spaces.dbUpdateMemberById(member.id, member);
        Memory.startTrx().updateMembership(member).commit();
        done();
        Bus.publish(updates.PERMISSIONS_MODIFIED, { member: member });
    };
    updatesDictionary[updates.NEW_INTERACTION] = async (data, done) => {
        data.tower.secret = { isContact: true };
        data.tower.contact = data.contact;
        Storage.spaces.dbSaveTowerAtOnce(data.tower);
        Storage.spaces.dbSaveRoomAtOnce(data.room);
        Storage.spaces.dbSaveMemberAtOnce(data.member1);
        Storage.spaces.dbSaveMemberAtOnce(data.member2);
        Storage.users.dbSaveUserAtOnce(data.contact);
        Storage.interactions.dbSaveInteractionAtOnce(data.interaction);
        let trx = Memory.startTrx();
        trx.addTower(data.tower);
        trx.addUser(data.contact);
        trx.addRoom(data.room);
        trx.addMembership(data.member1);
        trx.addMembership(data.member2);
        trx.commit();
        done();
        Bus.publish(updates.NEW_INTERACTION, { interaction: data.interaction });
    }
    updatesDictionary[updates.NEW_ROOM] = async (data, done) => {
        let { room } = data;
        Storage.spaces.dbSaveRoomAtOnce(room);
        Memory.startTrx().addRoom(room).commit();
        done();
        Bus.publish(updates.NEW_ROOM, { room: room });
    };
    updatesDictionary[updates.NEW_INVITE] = async (data, done) => {
        readRoomById(data.invite.roomId, async (room, tower) => {
            let trx = Memory.startTrx();
            if (Memory.data.towers.byId[tower.id]) {
                Storage.spaces.dbSaveTowerAtOnce(tower);
                trx.addTower(tower);
            }
            if (Memory.data.rooms.byId[room.id]) {
                Storage.spaces.dbSaveRoomAtOnce(room);
                trx.addRoom(room);
            }
            Storage.invites.dbSaveInviteAtOnce(data.invite);
            trx.addInvite(data.invite);
            done();
            Bus.publish(updates.NEW_INVITE, { invite: data.invite });
        })
    };
    updatesDictionary[updates.INVITE_CANCELLED] = async (data, done) => {
        Storage.invites.dbDeleteInviteById(data.inviteId);
        Memory.startTrx().removeInvite(data.invite.roomId).commit();
        done();
        Bus.publish(updates.INVITE_CANCELLED, { inviteId: data.inviteId });
    };
    updatesDictionary[updates.USER_JOINED_ROOM] = async (data, done) => {
        Storage.users.dbSaveUserAtOnce(data.user);
        Storage.spaces.dbSaveMemberAtOnce(data.member);
        let trx = Memory.startTrx();
        trx.addUser(data.user);
        trx.addMembership(data.member);
        trx.commit();
        if (trx.temp.rooms.byId[data.member.roomId].secret.adminIds.includes(trx.temp.me.id)) {
            Crypto.instance().refreshRoomKey(data.member.roomId);
        }
        done();
        Bus.publish(updates.USER_JOINED_ROOM, { user: data.user, roomId: data.roomId });
    };
    updatesDictionary['echoUpdate'] = async (data, done) => {
        if (Crypto.instance().isRoomSecure(data.roomId)) {
            alert(await Crypto.instance().openMesage(data.roomId, data.text));
        } else {
            alert(data.text);
        }
        done();
    }
    stompClient.subscribe(`/queue/queue_${Storage.me.fetchMyUserId()}`, message => {
        console.log(`Received: ${message.body}`);
        let data = JSON.parse(message.body);
        Bus.publish(updates.NEW_NOTIF, data);
        let callback = updatesDictionary[data.type];
        if (callback) {
            callback(data, () => {
                socket.emit('notifyUpdated', { updateId: data.id });
            });
        }
    });
    // socket.on('update', data => {
    //     console.log(data);
    //     Bus.publish(updates.NEW_NOTIF, data);
    //     if (data !== null) {
    //         let callback = updatesDictionary[data.type];
    //         if (callback) {
    //             callback(data, () => {
    //                 socket.emit('notifyUpdated', { updateId: data.id });
    //             });
    //         }
    //     }
    // });
}
