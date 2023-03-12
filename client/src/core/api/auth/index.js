
import topics from '../../events/topics.json';
import { request } from '../../utils/requests';
import { Storage } from '../../storage';
import Bus from '../../events/bus';
import { Memory } from '../../memory';
import api from '../../api';
import SecurityDriver from '../../crypto';

export function verify(/*auth0AccessToken*/ email, callback) {
    request('verifyUser', { /*auth0AccessToken: auth0AccessToken*/ email }, res => {
        if (res.status === 1) {
            if (res.session !== undefined) {

                let towers = res.towers;
                let rooms = res.rooms;
                let myMemberships = res.myMemberships;
                let allMemberships = res.allMemberships;
                let interactions = res.interactions;

                let newColor = (Math.random() * 10).toString()[0];
                res.user.avatarBackColor = newColor;
                Storage.me.saveAvatarBackColor(newColor);
                Storage.auth.saveSessionToken(res.session.token);
                Storage.me.saveMyUserId(res.user.id);
                Storage.me.saveFirstName(res.user.firstName);
                Storage.me.saveLastName(res.user.lastName);
                Storage.me.saveMyHomeId(res.user.secret.homeId);
                Storage.auth.saveEmail(res.user.secret.email);

                let trx = Memory.startTrx();
                trx.updateToken(res.session.token);
                res.user.avatarBackColor = newColor;
                trx.updateMe(res.user);
                trx.addUser(trx.temp.me);
                towers.forEach(tower => { Storage.spaces.dbSaveTowerAtOnce(tower); trx.addTower(tower); });
                rooms.forEach(room => { Storage.spaces.dbSaveRoomAtOnce(room); trx.addRoom(room); });
                myMemberships.forEach(member => { Storage.spaces.dbSaveMemberAtOnce(member); trx.addMembership(member); });
                allMemberships.forEach(member => { Storage.spaces.dbSaveMemberAtOnce(member); trx.addMembership(member); });
                interactions.forEach(interaction => { Storage.interactions.dbSaveInteractionAtOnce(interaction); trx.addInteraction(interaction); });
                trx.commit();

                SecurityDriver.instance().generateKeyPair((keyPair) => {
                    api.crypto.saveMyKeyPair(keyPair[0], keyPair[1], () => {
                        if (callback !== undefined) callback(res);
                        Bus.publish(topics.SETUP_DONE, {});
                    });
                });
            } else {
                if (callback !== undefined) callback(res);
                Bus.publish(topics.VERIFIED, {});
            }
        }
    });
}

export function setup(/*accessToken,*/ email, firstName, lastName, callback) {
    request('setupUser', { /*auth0AccessToken: accessToken,*/ email, firstName: firstName, lastName: lastName }, res => {
        if (res.status === 1) {
            if (res.session !== undefined) {

                let defaultMembership = res.defaultMembership;
                let centralTower = res.centralTower;
                let centralTowerHall = res.centralTowerHall;

                res.user.email = res.user.secret.email;
                res.user.firstName = firstName;
                res.user.lastName = lastName;
                res.user.homeId = res.user.secret.homeId;

                let newColor = (Math.random() * 10).toString()[0];
                res.user.avatarBackColor = newColor;

                Storage.auth.saveEmail(res.user.secret.email);
                Storage.me.saveAvatarBackColor(newColor);
                Storage.auth.saveSessionToken(res.session.token);
                Storage.me.saveMyUserId(res.user.id);
                Storage.me.saveFirstName(firstName);
                Storage.me.saveLastName(lastName);
                Storage.me.saveMyHomeId(res.user.secret.homeId);
                Storage.spaces.dbSaveTowerAtOnce(res.tower);
                Storage.spaces.dbSaveRoomAtOnce(res.room);
                Storage.spaces.dbSaveMemberAtOnce(res.member);
                Storage.spaces.dbSaveTowerAtOnce(centralTower);
                Storage.spaces.dbSaveRoomAtOnce(centralTowerHall);
                Storage.spaces.dbSaveMemberAtOnce(defaultMembership);

                let trx = Memory.startTrx();
                trx.updateToken(res.session.token);
                trx.updateMe(res.user);
                trx.addTower(res.tower);
                trx.addRoom(res.room);
                trx.addMembership(res.member);
                trx.addTower(centralTower);
                trx.addRoom(centralTowerHall);
                trx.addMembership(defaultMembership);
                trx.commit();

                SecurityDriver.instance().generateKeyPair((keyPair) => {
                    api.crypto.saveMyKeyPair(keyPair[0], keyPair[1], () => {
                        if (callback !== undefined) callback(res);
                        Bus.publish(topics.SETUP_DONE, {});
                    });
                });
            }
        }
    });
}

export function authenticate(callback) {
    console.log('authenticating...');
    request('authenticate', { token: Memory.data().token }, async response => {
        console.log('authenticated.');
        Bus.publish(topics.AUTHENTICATED, {});
        if (callback) callback();
    });
}

export function teleport(spaceId, callback) {
    console.log('teleporting...');
    if (Memory.data().towers.byId[spaceId]) {
        Storage.auth.saveCurrentTowerId(spaceId);
        request('teleport', { spaceId: spaceId }, response => {
            console.log('teleported.');
            Bus.publish(topics.TELEPORTED_TO_TOWER, { towerId: spaceId });
            if (callback) callback();
        });
    } else {
        Storage.auth.saveCurrentRoomId(spaceId);
        request('teleport', { spaceId: spaceId }, response => {
            console.log('teleported.');
            Bus.publish(topics.TELEPORTED_TO_ROOM, { roomId: spaceId });
            if (callback) callback();
        });
    }
}

let auth = {
    verify,
    setup,
    authenticate,
    teleport
};

export default auth;
