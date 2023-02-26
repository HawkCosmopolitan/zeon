
import { Memory } from '../../memory';
import { db } from '../setup';

export async function dbSaveTower(tower) {
    let result = await db.post({
        type: 'tower',
        data: tower
    });
    tower.id = result.id;
    return { tower: tower, rev: result.rev };
}

export function dbUpdateTower(id, rev, tower) {
    db.put({
        _id: id,
        _rev: rev,
        id: tower.id,
        type: 'tower',
        data: tower
    });
}

export async function dbSaveTowerAtOnce(tower) {
    await db.post({
        type: 'tower',
        data: tower,
        id: tower.id,
    });
}

export async function dbFindTowerById(towerId) {
    let data = await db.find({
        selector: { type: { $eq: "tower" }, id: { $eq: towerId } },
    });
    if (data.docs.length > 0) {
        return data.docs[0].data;
    } else {
        return null;
    }
}

export async function dbUpdateTowerById(towerId, tower) {
    let data = await db.find({
        selector: { type: { $eq: "tower" }, id: { $eq: towerId } },
    });
    if (data.docs.length > 0) {
        db.put({
            _id: data.docs[0]._id,
            _rev: data.docs[0]._rev,
            id: tower.id,
            type: 'tower',
            data: tower
        });
    }
}

export async function dbDeleteTowerById(towerId) {
    let data = await db.find({
        selector: { type: { $eq: "tower" }, id: { $eq: towerId } },
    });
    if (data.docs.length > 0) {
        db.remove(data.docs[0]);
    }
}

export async function dbFetchTowers() {
    let data = await db.find({
        selector: { type: { $eq: "tower" } },
    });
    return data.docs.map(packet => packet.data);
}

export async function dbSaveRoomAtOnce(room) {
    await db.post({
        type: 'room',
        towerId: room.towerId,
        data: room,
        id: room.id,
        towerId: room.towerId,
    });
}

export async function dbSaveRoom(room) {
    let result = await db.post({
        type: 'room',
        towerId: room.towerId,
        data: room
    });
    room.id = result.id;
    return { room: room, rev: result.rev };
}

export function dbUpdateRoom(id, rev, room) {
    db.put({
        _id: id,
        _rev: rev,
        id: room.id,
        towerId: room.towerId,
        type: 'room',
        data: room
    });
}

export async function dbFindRoomById(roomId) {
    let data = await db.find({
        selector: { type: { $eq: "room" }, id: { $eq: roomId } },
    });
    if (data.docs.length > 0) {
        return data.docs[0].data;
    } else {
        return null;
    }
}

export async function dbFindFirstRoomOfTower(towerId) {
    let data = await db.find({
        selector: { type: { $eq: "room" }, towerId: { $eq: towerId } },
    });
    if (data.docs.length > 0) {
        return data.docs[0].data;
    } else {
        return null;
    }
}

export async function dbUpdateRoomById(roomId, room) {
    let data = await db.find({
        selector: { type: { $eq: "room" }, id: { $eq: roomId } },
    });
    if (data.docs.length > 0) {
        db.put({
            _id: data.docs[0]._id,
            _rev: data.docs[0]._rev,
            id: room.id,
            towerId: room.towerId,
            type: 'room',
            data: room
        });
    }
}

export async function dbDeleteRoomById(roomId) {
    let data = await db.find({
        selector: { type: { $eq: "room" }, id: { $eq: roomId } },
    });
    if (data.docs.length > 0) {
        db.remove(data.docs[0]);
    }
}

export async function dbFetchTowerRooms(towerId) {
    let data = await db.find({
        selector: { type: { $eq: "room" }, towerId: { $eq: towerId } },
    });
    return data.docs.map(packet => packet.data);
}

export async function dbSaveWorkspace(workspace) {
    let result = await db.post({
        type: 'workspace',
        roomId: workspace.roomId,
        data: workspace
    });
    workspace.id = result.id;
    return { workspace: workspace, rev: result.rev };
}

export function dbUpdateWorkspace(id, rev, workspace) {
    db.put({
        _id: id,
        _rev: rev,
        id: workspace.id,
        roomId: workspace.roomId,
        type: 'workspace',
        data: workspace
    });
}

export async function dbSaveWorkspaceAtOnce(workspace) {
    await db.post({
        type: 'workspace',
        data: workspace,
        id: workspace.id,
        roomId: workspace.roomId,
    });
}

export async function dbFindWorkspaceById(workspaceId) {
    let data = await db.find({
        selector: { type: { $eq: "workspace" }, id: { $eq: workspaceId } },
    });
    if (data.docs.length > 0) {
        return data.docs[0].data;
    } else {
        return null;
    }
}

export async function dbUpdateWorkspaceById(workspaceId, workspace) {
    let data = await db.find({
        selector: { type: { $eq: "workspace" }, id: { $eq: workspaceId } },
    });
    if (data.docs.length > 0) {
        workspace.avatarBackColor = data.docs[0].data.avatarBackColor;
        db.put({
            _id: data.docs[0]._id,
            _rev: data.docs[0]._rev,
            id: workspace.id,
            roomId: workspace.roomId,
            type: 'workspace',
            data: workspace
        });
    }
}

export async function dbDeleteWorkspaceById(workspaceId) {
    let data = await db.find({
        selector: { type: { $eq: "workspace" }, id: { $eq: workspaceId } },
    });
    if (data.docs.length > 0) {
        db.remove(data.docs[0]);
    }
}

export async function dbFetchRoomWorkspaces(roomId) {
    let data = await db.find({
        selector: { type: { $eq: "workspace" }, roomId: { $eq: roomId } },
    });
    return data.docs.map(packet => packet.data);
}

export async function dbFindFirstWorkspaceOfRoom(roomId) {
    let data = await db.find({
        selector: { type: { $eq: "workspace" }, roomId: { $eq: roomId } },
    });
    if (data.docs.length > 0) {
        return data.docs[0].data;
    } else {
        return null;
    }
}

export async function dbSaveMember(member) {
    let result = await db.post({
        type: 'member',
        towerId: member.towerId,
        roomId: member.roomId,
        userId: member.userId,
        data: member
    });
    member.id = result.id;
    return { member: member, rev: result.rev };
}

export function dbUpdateMember(id, rev, member) {
    db.put({
        _id: id,
        _rev: rev,
        id: member.id,
        towerId: member.towerId,
        roomId: member.roomId,
        userId: member.userId,
        type: 'member',
        data: member
    });
}

export async function dbSaveMemberAtOnce(member) {
    await db.post({
        type: 'member',
        data: member,
        id: member.id,
        towerId: member.towerId,
        roomId: member.roomId,
        userId: member.userId,
    });
}

export async function dbUpdateMemberById(membershipId, member) {
    let data = await db.find({
        selector: { type: { $eq: "member" }, id: { $eq: membershipId } },
    });
    data.docs.forEach(membershipDoc => {
        db.put({
            _id: membershipDoc._id,
            _rev: membershipDoc._rev,
            id: member.id,
            userId: member.userId,
            roomId: member.roomId,
            towerId: member.towerId,
            type: 'member',
            data: member
        });
    });
}

export async function dbDeleteMemberById(memberId) {
    let data = await db.find({
        selector: { type: { $eq: "member" }, id: { $eq: memberId } },
    });
    if (data.docs.length > 0) {
        db.remove(data.docs[0]);
    }
}

export async function dbFetchMMyMemberships() {
    let data = await db.find({
        selector: { type: { $eq: "member" }, userId: { $eq: Memory.data.me.id } },
    });
    return data.docs.map(d => d.data);
}

export async function dbFetchRoomMemberships(roomId) {
    let data = await db.find({
        selector: { type: { $eq: "member" }, roomId: { $eq: roomId } },
    });
    return data.docs.map(d => d.data);
}

let spaces = {
    dbSaveTower, dbUpdateTower, dbSaveTowerAtOnce, dbFindTowerById, dbUpdateTowerById,
    dbDeleteTowerById, dbFetchTowers, dbSaveRoomAtOnce, dbSaveRoom, dbUpdateRoom,
    dbFindRoomById, dbFindFirstRoomOfTower, dbUpdateRoomById, dbDeleteRoomById,
    dbFetchTowerRooms, dbSaveWorkspace, dbUpdateWorkspace, dbSaveWorkspaceAtOnce,
    dbFindWorkspaceById, dbUpdateWorkspaceById, dbDeleteWorkspaceById, dbFetchRoomWorkspaces,
    dbFindFirstWorkspaceOfRoom, dbSaveMember, dbUpdateMember, dbSaveMemberAtOnce,
    dbUpdateMemberById, dbDeleteMemberById, dbFetchMMyMemberships, dbFetchRoomMemberships
};

export default spaces;
