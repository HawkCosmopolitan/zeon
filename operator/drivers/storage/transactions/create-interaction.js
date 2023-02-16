
const mongoose = require('mongoose');
let { Tower, Room, Member, Workspace, User, Interaction } = require('../schemas/schemas');
let { isEmpty } = require('../../../global-utils/strings');
let defaultAvatars = require('../../../constants/avatars.json');
const permissions = require('../../../constants/permissions.json');
const updates = require('../../../constants/updates.json');
const { createServiceMessage, readMessages } = require('../../network/socket/events/messenger');
const { secureObject, secureAdmins } = require('../../../global-utils/filter');
const { getUser } = require('../../network/socket/pool');

const checkImports = () => {
    if (Tower === undefined) {
        Tower = require('../schemas/schemas').Tower;
    }
    if (Room === undefined) {
        Room = require('../schemas/schemas').Room;
    }
    if (Member === undefined) {
        Member = require('../schemas/schemas').Member;
    }
    if (Workspace === undefined) {
        Workspace = require('../schemas/schemas').Workspace;
    }
    if (User === undefined) {
        User = require('../schemas/schemas').User;
    }
    if (Interaction === undefined) {
        Interaction = require('../schemas/schemas').Interaction;
    }
}

module.exports.dbCreateInteraction = async ({ peerId }, userId, callback) => {
    if (isEmpty(peerId)) {
        console.error('peer id can not be empty');
        return { success: false };
    }
    checkImports();
    const session = await mongoose.startSession();
    session.startTransaction();
    let tower, room, member1, member2, workspace, interaction, user, me;
    try {
        user = (await User.findOne({ id: peerId }).session(session).exec()).toObject();
        if (user !== null) {
            interaction = await Interaction.findOne({ user1Id: userId, user2Id: peerId }).session(session).exec();
            if (interaction === null) {
                interaction = await Interaction.findOne({ user2Id: userId, user1Id: peerId }).session(session).exec();
            }
            if (interaction === null) {
                workspace = await Workspace.create([{
                    title: 'main workspace',
                    roomId: ''
                }], { session });
                workspace = workspace[0];
                await Workspace.updateOne({ _id: workspace._id }, { id: workspace._id.toHexString() }).session(session);
                workspace = await Workspace.findOne({ id: workspace._id.toHexString() }).session(session).exec();
                room = await Room.create([{
                    title: 'hall',
                    avatarId: defaultAvatars.HALL_DEFAULT_AVATAR_ID,
                    floor: 'hall',
                    secret: {
                        adminIds: [
                            userId,
                            peerId
                        ],
                        defaultWorkspaceId: workspace.id
                    }
                }], { session });
                room = room[0];
                tower = await Tower.create([{
                    title: '-',
                    avatarId: defaultAvatars.EMPTY_TOWER_AVATAR_ID,
                    isPublic: false,
                    secret: {
                        adminIds: [
                            userId,
                            peerId
                        ],
                        isContact: true
                    }
                }], { session });
                tower = tower[0];
                await Tower.updateOne({ _id: tower._id }, { id: tower._id.toHexString() }).session(session);
                tower = await Tower.findOne({ id: tower._id.toHexString() }).session(session).exec();
                await Room.updateOne({ _id: room._id }, { id: room._id.toHexString(), towerId: tower.id }).session(session);
                room = await Room.findOne({ id: room._id.toHexString() }).session(session).exec();
                member1 = await Member.create([{
                    userId: userId,
                    roomId: room.id,
                    towerId: tower.id,
                    secret: {
                        permissions: permissions.DEFAULT_ROOM_ADMIN_PERMISSIONS
                    }
                }], { session });
                member1 = member1[0];
                member2 = await Member.create([{
                    userId: peerId,
                    roomId: room.id,
                    towerId: tower.id,
                    secret: {
                        permissions: permissions.DEFAULT_ROOM_ADMIN_PERMISSIONS
                    }
                }], { session });
                member2 = member2[0];
                await Member.updateOne({ _id: member1._id }, { id: member1._id.toHexString() }).session(session);
                member1 = await Member.findOne({ id: member1._id.toHexString() }).session(session).exec();
                await Member.updateOne({ _id: member2._id }, { id: member2._id.toHexString() }).session(session);
                member2 = await Member.findOne({ id: member2._id.toHexString() }).session(session).exec();
                await Workspace.updateOne({ _id: workspace._id }, { roomId: room.id }).session(session);
                workspace = await Workspace.findOne({ id: workspace._id.toHexString() }).session(session).exec();
                interaction = await Interaction.create([{
                    user1Id: userId,
                    user2Id: peerId,
                    roomId: room.id,
                    towerId: tower.id,
                }], { session });
                interaction = interaction[0];
                await Interaction.updateOne({ _id: interaction._id }, { id: interaction._id.toHexString() }).session(session);
                interaction = await Interaction.findOne({ id: interaction._id.toHexString() }).session(session).exec();
                me = (await User.findOne({ id: userId }).session(session).exec()).toObject();
                await session.commitTransaction();
                session.endSession();
                createServiceMessage({ roomId: room.id, workspaceId: workspace.id, text: 'room created.' }, async response => {
                    if (response.status === 1) {
                        let serviceMessage = response.message;
                        callback({
                            noAction: false,
                            success: true,
                            update: {
                                type: updates.NEW_INTERACTION,
                                tower,
                                room,
                                member1,
                                member2,
                                workspace,
                                interaction,
                                contact: secureObject(me, 'secret'),
                                userId: peerId,
                                messages: [serviceMessage]
                            },
                            tower,
                            room,
                            member1,
                            member2,
                            workspace,
                            interaction,
                            contact: secureObject(user, 'secret'),
                            messages: [serviceMessage],
                        });
                    }
                });
            } else {
                await session.abortTransaction();
                session.endSession();
                tower = await Tower.findOne({ id: interaction.towerId }).exec();
                room = await Room.findOne({ id: interaction.roomId }).exec();
                member1 = await Member.findOne({ roomId: room.id, userId: interaction.user1Id }).exec();
                member2 = await Member.findOne({ roomId: room.id, userId: interaction.user2Id }).exec();
                workspace = await Workspace.findOne({ roomId: room.id }).exec();
                user = (await User.findOne({ id: peerId }).exec()).toObject();
                me = (await User.findOne({ id: userId }).exec()).toObject();
                readMessages({ userId: userId, roomId: room.id, workspaceId: workspace.id }, async response => {
                    if (response.status === 1) {
                        let messages = response.messages;
                        callback({
                            noAction: true,
                            success: true,
                            existed: true,
                            update: {
                                type: updates.NEW_INTERACTION,
                                tower,
                                room,
                                member1,
                                member2,
                                workspace,
                                interaction, 
                                contact: secureObject(me, 'secret'),
                                userId: peerId,
                                messages: JSON.parse(messages)
                            },
                            tower,
                            room,
                            member1,
                            member2,
                            workspace,
                            interaction,
                            contact: secureObject(user, 'secret'),
                            messages: JSON.parse(messages)
                        });
                    }
                });
            }
        } else {
            console.error('peer does not exist');
            console.error('abort transaction');
            await session.abortTransaction();
            session.endSession();
            return { success: false };
        }
    } catch (error) {
        console.error(error);
        console.error('abort transaction');
        await session.abortTransaction();
        session.endSession();
        return { success: false };
    }
};
