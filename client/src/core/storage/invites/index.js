
import { fetchMyUserId } from '../me';
import { db } from '../setup';

export async function dbSaveInvite(invite) {
    let result = await db.post({
        type: 'invite',
        data: invite,
        userId: invite.userId,
        roomId: invite.roomId
    });
    invite.id = result.id;
    return { invite: invite, rev: result.rev };
}

export function dbUpdateInvite(id, rev, invite) {
    db.put({
        _id: id,
        _rev: rev,
        id: invite.id,
        type: 'invite',
        data: invite,
        userId: invite.userId,
        roomId: invite.roomId
    });
}

export async function dbDeleteInviteById(inviteId) {
    let data = await db.find({
        selector: { type: { $eq: "invite" }, id: { $eq: inviteId } },
    });
    if (data.docs.length > 0) {
        db.remove({
            _id: data.docs[0]._id,
            _rev: data.docs[0]._rev
        });
    }
    return true;
}

export async function dbSaveInviteAtOnce(invite) {
    await db.post({
        id: invite.id,
        type: 'invite',
        data: invite,
        userId: invite.userId,
        roomId: invite.roomId
    });
    return true;
}

export async function dbFindInviteById(inviteId) {
    let data = await db.find({
        selector: { type: { $eq: "invite" }, id: { $eq: inviteId } },
    });
    if (data.docs.length > 0) {
        return data.docs[0].data;
    } else {
        return null;
    }
}

export async function dbFindInviteByInfo(userId, roomId) {
    let data = await db.find({
        selector: { type: { $eq: "invite" }, userId: { $eq: userId }, roomId: { $eq: roomId } },
    });
    if (data.docs.length > 0) {
        return data.docs[0].data;
    } else {
        return null;
    }
}

export async function dbUpdateInviteById(inviteId, invite) {
    let data = await db.find({
        selector: { type: { $eq: "invite" }, id: { $eq: inviteId } },
    });
    if (data.docs.length > 0) {
        db.put({
            _id: data.docs[0]._id,
            _rev: data.docs[0]._rev,
            id: invite.id,
            type: 'invite',
            data: invite,
            userId: invite.userId,
            roomId: invite.roomId
        });
    }
}

export async function dbFetchInvites() {
    let data = await db.find({
        selector: { type: { $eq: "invite" }, userId: { $eq: fetchMyUserId() } },
    });
    return data.docs.map(packet => packet.data);
}

let invites = {
    dbSaveInvite,
    dbUpdateInvite,
    dbDeleteInviteById,
    dbSaveInviteAtOnce,
    dbFindInviteById,
    dbFindInviteByInfo,
    dbUpdateInviteById,
    dbFetchInvites
};

export default invites;
