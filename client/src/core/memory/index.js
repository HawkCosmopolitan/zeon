
import { useEffect } from "react";
import { readUserById } from "../api/users";
import { Storage } from "../storage";
import { fetchSessionToken } from "../storage/auth";
import { db } from "../storage/setup";

export async function setupMemory() {

    let me = {},
        towersList = [],
        towersDictById = [],
        roomsDict = {},
        roomsDictById = {},
        usersDict = {},
        interactionsDict = {},
        invitesDictById = {},
        membershipsDictByTowerId = {},
        membershipsDict = {}

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
            done({
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
                    list: []
                }
            });
        });
    });
}

const useMemoryInternal = () => {
    const [count, setCount] = useState(0);
    return {
        state: () => {
            count
        },
        modifyState: () => {
            setCount
        }
    };
};

export const useMemory = () => useBetween(useMemoryInternal);

export let Memory = {
    update: (newState) => { },
    data: {},
    startTrx: () => {
        return {
            temp: { ...this.data },
            commit: () => {
                Memory.update(this.temp);
            },
            updateMe: (myData) => {
                this.temp.me = {
                    ...this.temp.me,
                    id: myData.id,
                    firstName: myData.firstName,
                    lastName: myData.lastName,
                    homeId: myData.secret.homeId,
                    email: myData.secret.email,
                    avatarBackColor: myData.avatarBackColor
                };
                return this;
            },
            addTower: (tower) => {
                this.temp.towers.byId[tower.id] = tower;
                this.temp.towers.list.push(tower);
                this.temp.rooms.listPerTower[tower.id] = [];
                return this;
            },
            updateTower: (tower) => {
                this.temp.towers.byId[tower.id] = tower;
                return this;
            },
            addRoom: (room) => {
                this.temp.rooms.byId[room.id] = room;
                this.temp.rooms.listPerTower[room.towerId].push(room);
                room.tower = this.temp.towers.byId[room.towerId];
                this.temp.membership.dictPerRoom[room.id] = {};
                return this;
            },
            updateRoom: (room) => {
                this.temp.rooms.byId[room.id] = room;
                return this;
            },
            addUser: (user) => {
                this.temp.users[user.id] = user;
                return this;
            },
            updateUser: (user) => {
                this.temp.users[user.id] = user;
                return this;
            },
            addMembership: (member) => {
                member.tower = this.temp.towers.byId[member.towerId];
                member.room = this.temp.rooms.byId[member.roomId];
                if (member.userId !== me.id) {
                    this.temp.memberships.byTowerId[member.tower.id] = member;
                    readUserById(interaction.userId, user => { });
                }
                this.temp.memberships.dictPerRoom[member.roomId][member.userId] = member;
                return this;
            },
            addInteraction: (interaction) => {
                let peerId = (interaction.user1Id === me.id ? interaction.user2Id : interaction.user1Id);
                this.temp.interactions.byPeerId[peerId] = interaction;
                if (!this.temp.users.byId[peerId]) {
                    readUserById(peerId, (user, onlineState, lastSeen) => {
                        this.temp.towers.byId[this.temp.rooms.byId[interaction.roomId]?.towerId].contact = user;
                    });
                }
                return this;
            },
            removeInvite: (roomId) => {
                delete this.temp.invites.byId[roomId];
                return this;
            }
        }
    }
};

export function MemoryWrapper() {
    const { state, setState } = useMemory();
    useEffect(() => {
        setupMemory().then(mem => {
            setState(mem);
            Memory.update = (newState) => setState(newState);
            Memory.data = state;
        });
    }, []);
    return null;
}
