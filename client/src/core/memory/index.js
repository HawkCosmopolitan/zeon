
import { useEffect, useState } from "react";
import { readUserById } from "../api/users";
import { Storage } from "../storage";
import { fetchSessionToken } from "../storage/auth";
import { db } from "../storage/setup";
import { useBetween } from 'use-between';

let me = {},
    towersList = [],
    towersDictById = [],
    roomsDict = {},
    roomsDictById = {},
    usersDict = {},
    interactionsDict = {},
    invitesDictById = {},
    membershipsDictByTowerId = {},
    membershipsDict = {},
    counterWrapper = { value: 0 };

let createMemory = () => ({
    token: fetchSessionToken(),
    me: me,
    towers: {
        byId: towersDictById,
        list: towersList
    },
    rooms: {
        byId: roomsDictById,
        listPerTower: roomsDict
    },
    users: {
        byId: usersDict
    },
    memberships: {
        byTowerId: membershipsDictByTowerId,
        dictPerRoom: membershipsDict
    },
    invites: {
        byId: invitesDictById
    },
    interactions: {
        byPeerId: interactionsDict
    },
    activeCalls: {
        bySpaceId: {}
    },
    docs: {
        byId: {}
    },
    counter: counterWrapper
});

export async function setupMemory() {

    me = { id: Storage.me.fetchMyUserId(), firstName: Storage.me.fetchFirstName(), lastName: Storage.me.fetchLastName(), homeId: Storage.me.fetchMyHomeId() };
    usersDict[me.id] = me;
    let datas = await db.allDocs({
        include_docs: true,
        attachments: false
    });
    return new Promise(function (done, err) {
        let records = datas.rows.map(row => row.doc);
        let tempStore = {};
        for (let i = 0; i < records.length; i++) {
            let record = records[i];
            let recordType = record.type;
            let data = record.data;
            if (!tempStore[recordType]) {
                tempStore[recordType] = [data];
            } else {
                tempStore[recordType].push(data);
            }
        }
        tempStore['user']?.forEach(user => {
            usersDict[user.id] = user
        });
        tempStore['tower']?.forEach(tower => {
            towersDictById[tower.id] = tower;
            roomsDict[tower.id] = [];
            if (tower.secret?.isContact) {
                tower.contact = usersDict[tower.contact?.id];
            }
        });
        tempStore['room']?.forEach(room => {
            roomsDict[room.towerId].push(room);
            roomsDictById[room.id] = room;
            membershipsDict[room.id] = {};
            room.tower = towersDictById[room.towerId];
        });
        tempStore['interaction']?.forEach(interaction => {
            let peerId = (interaction.user1Id === me.id ? interaction.user2Id : interaction.user1Id);
            interactionsDict[peerId] = interaction;
            towersDictById[roomsDictById[interaction.roomId]?.towerId].contact = usersDict[peerId];
        });
        tempStore['invite']?.forEach(invite => {
            invite.room = roomsDictById[invite.roomId];
            invite.tower = towersDictById[roomsDictById[invite.roomId]?.id];
            invitesDictById[invite.roomId] = invite;
        });
        let addedTowersByMemberships = {};
        tempStore['member']?.forEach(membership => {
            membership.room = roomsDictById[membership.roomId];
            membership.tower = towersDictById[membership.towerId];
            membershipsDictByTowerId[membership.towerId] = membership;
            membershipsDict[membership.roomId][membership.userId] = membership;
            if (membership.userId === me.id && !addedTowersByMemberships[membership.tower.id]) {
                addedTowersByMemberships[membership.tower.id] = true;
                towersList.push(membership.tower);
            }
        });
        let promises = [];
        Promise.all(promises).then(() => {
            done(createMemory());
        });
    });
}

const useMemoryInternal = () => {
    const [stateIn, setState] = useState(createMemory());
    return {
        state: () => stateIn,
        modifyState: setState
    };
};

export const useMemory = () => useBetween(useMemoryInternal);

export let Memory = {
    update: (newState) => { },
    data: () => { },
    startTrx: () => {
        let trx = {
            temp: {},
            commit: () => {
                Memory.update(trx.temp);
            },
            increase: () => {
                console.log(trx.temp.counter);
                trx.temp.counter.value++;
                return trx;
            },
            updateToken: (token) => {
                trx.temp.token = token;
                return trx;
            },
            updateMe: (myData) => {
                trx.temp.me = {
                    id: myData.id,
                    firstName: myData.firstName,
                    lastName: myData.lastName,
                    homeId: myData.secret.homeId,
                    email: myData.secret.email,
                    avatarBackColor: myData.avatarBackColor
                };
                return trx;
            },
            addTower: (tower) => {
                trx.temp.towers.byId[tower.id] = tower;
                trx.temp.towers.list.push(tower);
                trx.temp.rooms.listPerTower[tower.id] = [];
                return trx;
            },
            updateTower: (tower) => {
                trx.temp.towers.byId[tower.id] = tower;
                return trx;
            },
            addRoom: (room) => {
                trx.temp.rooms.byId[room.id] = room;
                trx.temp.rooms.listPerTower[room.towerId].push(room);
                room.tower = trx.temp.towers.byId[room.towerId];
                trx.temp.memberships.dictPerRoom[room.id] = {};
                return trx;
            },
            updateRoom: (room) => {
                trx.temp.rooms.byId[room.id] = room;
                return trx;
            },
            addUser: (user) => {
                trx.temp.users.byId[user.id] = user;
                return trx;
            },
            updateUser: (user) => {
                trx.temp.users.byId[user.id] = user;
                return trx;
            },
            addMembership: (member) => {
                member.tower = trx.temp.towers.byId[member.towerId];
                member.room = trx.temp.rooms.byId[member.roomId];
                if (member.userId !== trx.temp.me.id) {
                    trx.temp.memberships.byTowerId[member.tower.id] = member;
                    readUserById(member.userId, user => { });
                }
                trx.temp.memberships.dictPerRoom[member.roomId][member.userId] = member;
                return trx;
            },
            updateMembership: (member) => {
                member.tower = trx.temp.towers.byId[member.towerId];
                member.room = trx.temp.rooms.byId[member.roomId];
                if (member.userId !== trx.temp.me.id) {
                    trx.temp.memberships.byTowerId[member.tower.id] = member;
                }
                trx.temp.memberships.dictPerRoom[member.roomId][member.userId] = member;
                return trx;
            },
            addInteraction: (interaction) => {
                let peerId = (interaction.user1Id === trx.temp.me.id ? interaction.user2Id : interaction.user1Id);
                trx.temp.interactions.byPeerId[peerId] = interaction;
                if (!trx.temp.users.byId[peerId]) {
                    readUserById(peerId, (user, onlineState, lastSeen) => {
                        trx.temp.towers.byId[trx.temp.rooms.byId[interaction.roomId]?.towerId].contact = user;
                    });
                }
                return trx;
            },
            addInvite: (invite) => {
                invite.room = trx.temp.rooms.byId[invite.roomId];
                trx.temp.invites.byId[invite.roomId] = invite;
                return trx;
            },
            removeInvite: (roomId) => {
                delete trx.temp.invites.byId[roomId];
                return trx;
            },
            addActiveCall: (spaceId) => {
                trx.temp.activeCalls.byId[spaceId] = true;
                return trx;
            },
            removeActiveCall: (spaceId) => {
                delete trx.temp.activeCalls.byId[spaceId];
                return trx;
            }
        }
        trx.temp = Memory.data();
        return trx;
    }
};

export function MemoryWrapper() {
    const { state, modifyState } = useMemory();
    useEffect(() => {
        Memory.data = state;
        Memory.update = (newState) => modifyState({ ...createMemory(), ...newState });
        setupMemory().then(data => {
            Memory.update(data);
        });
    }, []);
    return null;
}
