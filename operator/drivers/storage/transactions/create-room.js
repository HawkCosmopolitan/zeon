
const mongoose = require('mongoose');
let { Tower, Room, Member, Workspace } = require('../schemas/schemas');
let { isEmpty, isNameFieldInvalid } = require('../../../global-utils/strings');
const defaultAvatars = require('../../../constants/avatars.json');
const permissions = require('../../../constants/permissions.json');
const updates = require('../../../constants/updates.json');
const { secureObject, secureAdmins } = require('../../../global-utils/filter');

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
}

module.exports.dbCreateRoom = async ({ towerId, title, avatarId, isPublic, floor }, userId) => {
  if (isEmpty(title)) {
    console.error('title can not be empty');
    return { success: false };
  }
  if (isNameFieldInvalid(title)) {
    console.error('title can not be longer than limit');
    return { success: false };
  }
  checkImports();
  const session = await mongoose.startSession();
  session.startTransaction();
  let room, member, member2, workspace;
  try {
    let success = false;
    let tower = await Tower.findOne({ id: towerId }).session(session).exec();
    if (tower !== null) {
      if (tower.secret.adminIds.includes(userId)) {
        workspace = await Workspace.create([{
          title: 'main workspace',
          roomId: ''
        }], { session });
        workspace = workspace[0];
        await Workspace.updateOne({ _id: workspace._id }, { id: workspace._id.toHexString() }).session(session);
        workspace = await Workspace.findOne({ id: workspace._id.toHexString() }).session(session).exec();
        room = await Room.create([{
          title: title,
          avatarId: isEmpty(avatarId) ? defaultAvatars.EMPTY_ROOM_AVATAR_ID : avatarId,
          towerId: towerId,
          isPublic: isPublic,
          floor: floor,
          secret: {
            adminIds: [
              userId
            ],
            defaultWorkspaceId: workspace.id
          }
        }], { session });
        room = room[0];
        await Room.updateOne({ _id: room._id }, { id: room._id.toHexString() }).session(session);
        room = await Room.findOne({ id: room._id.toHexString() }).session(session).exec();
        member = await Member.create([{
          userId: userId,
          roomId: room.id,
          towerId: tower.id,
          secret: {
            permissions: permissions.DEFAULT_ROOM_ADMIN_PERMISSIONS
          }
        }], { session });
        member = member[0];
        await Member.updateOne({ _id: member._id }, { id: member._id.toHexString() }).session(session);
        if (tower.secret.isContact) {
          member2 = await Member.create([{
            userId: tower.secret.adminIds[0] === userId ? tower.secret.adminIds[1] : tower.secret.adminIds[0],
            roomId: room.id,
            towerId: tower.id,
            secret: {
              permissions: permissions.DEFAULT_ROOM_ADMIN_PERMISSIONS
            }
          }], { session });
          member2 = member2[0];
          await Member.updateOne({ _id: member2._id }, { id: member2._id.toHexString() }).session(session);
          member2 = await Member.findOne({ id: member2._id.toHexString() }).session(session).exec();
        }
        await Workspace.updateOne({ _id: workspace._id }, { roomId: room.id }).session(session);
        workspace = await Workspace.findOne({ id: workspace._id.toHexString() }).session(session).exec();
        success = true;
        await session.commitTransaction();
      } else {
        console.error('user is not admin of the tower');
        console.error('abort transaction');
        await session.abortTransaction();
      }
    } else {
      console.error('tower does not exist');
      console.error('abort transaction');
      await session.abortTransaction();
    }
    session.endSession();
    if (success) {
      return {
        success: true, room: room, member: member, member2: member2, workspace: workspace,
        update: { type: updates.NEW_ROOM, workspace: workspace, room: secureAdmins(room, ''), towerId: towerId, exceptions: [userId] }
      };
    } else {
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
