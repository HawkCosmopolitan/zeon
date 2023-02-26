
import { fetchMyUserId } from '../me';
import { db } from '../setup';
import { dbFindRoomById, dbFindTowerById, dbFindWorkspaceById } from '../spaces';
import { dbFindUserById } from '../users';

export async function dbSaveInteraction(interaction) {
    let result = await db.post({
        type: 'interaction',
        data: interaction
    });
    interaction.id = result.id;
    return { interaction: interaction, rev: result.rev };
}

export function dbUpdateInteraction(id, rev, interaction) {
    db.put({
        _id: id,
        _rev: rev,
        id: interaction.id,
        type: 'interaction',
        user1Id: interaction.user1Id,
        user2Id: interaction.user2Id,
        data: interaction,
        roomId: interaction.roomId
    });
}

export async function dbSaveInteractionAtOnce(interaction) {
    await db.post({
        type: 'interaction',
        data: interaction,
        user1Id: interaction.user1Id,
        user2Id: interaction.user2Id,
        roomId: interaction.roomId,
        id: interaction.id,
    });
    return true;
}

export async function dbFindInteractionById(interactionId) {
    let data = await db.find({
        selector: { type: { $eq: "interaction" }, id: { $eq: interactionId } },
    });
    if (data.docs.length > 0) {
        return data.docs[0].data;
    } else {
        return null;
    }
}

export async function dbFindInteractionByPeerId(peerId) {
    let data = await db.find({
        selector: {
            type: { $eq: "interaction" },
            $or: [
                { user1Id: fetchMyUserId(), user2Id: peerId },
                { user2Id: fetchMyUserId(), user1Id: peerId },
            ]
        },
    });
    if (data.docs.length > 0) {
        return data.docs[0].data;
    } else {
        return null;
    }
}

export async function dbUpdateInteractionById(interactionId, interaction) {
    let data = await db.find({
        selector: { type: { $eq: "interaction" }, id: { $eq: interactionId } },
    });
    if (data.docs.length > 0) {
        db.put({
            _id: data.docs[0]._id,
            _rev: data.docs[0]._rev,
            id: interaction.id,
            type: 'interaction',
            user1Id: interaction.user1Id,
            user2Id: interaction.user2Id,
            data: interaction,
            roomId: interaction.roomId
        });
    }
}

export async function dbFetchInteractions() {
    let data = await db.find({
        selector: { type: { $eq: "interaction" } },
    });
    return data.docs.map(packet => packet.data);
}

let interactions = {
    dbSaveInteraction,
    dbUpdateInteraction,
    dbSaveInteractionAtOnce,
    dbSaveInteractionAtOnce,
    dbFindInteractionById,
    dbFindInteractionByPeerId,
    dbUpdateInteractionById
};

export default interactions;
