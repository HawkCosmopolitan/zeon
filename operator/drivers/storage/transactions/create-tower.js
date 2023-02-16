
const mongoose = require('mongoose');
let { Tower, Room, Member, Workspace } = require('../schemas/schemas');
let { isEmpty, isNameFieldInvalid } = require('../../../global-utils/strings');
let defaultAvatars = require('../../../constants/avatars.json');
const permissions = require('../../../constants/permissions.json');

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

module.exports.createTower = async ({ title, avatarId, isPublic }, userId) => {
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
  let tower, room, member, workspace;
  try {
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
          userId
        ],
        defaultWorkspaceId: workspace.id
      }
    }], { session });
    room = room[0];
    tower = await Tower.create([{
      title: title,
      avatarId: isEmpty(avatarId) ? defaultAvatars.EMPTY_TOWER_AVATAR_ID : avatarId,
      isPublic: isPublic,
      secret: {
        adminIds: [
          userId
        ]
      }
    }], { session });
    tower = tower[0];
    await Tower.updateOne({ _id: tower._id }, { id: tower._id.toHexString() }).session(session);
    tower = await Tower.findOne({ id: tower._id.toHexString() }).session(session).exec();
    await Room.updateOne({ _id: room._id }, { id: room._id.toHexString(), towerId: tower.id }).session(session);
    room = await Room.findOne({ id: room._id.toHexString() }).session(session).exec();
    if (userId) {
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
      member = await Member.findOne({ id: member._id.toHexString() }).session(session).exec();
    }
    await Workspace.updateOne({ _id: workspace._id }, { roomId: room.id }).session(session);
    workspace = await Workspace.findOne({ id: workspace._id.toHexString() }).session(session).exec();
    await session.commitTransaction();
    session.endSession();
    return { success: true, tower: tower, room: room, member: member, workspace: workspace };
  } catch (error) {
    console.error(error);
    console.error('abort transaction');
    await session.abortTransaction();
    session.endSession();
    return { success: false };
  }
}

module.exports.dbCreateTower = this.createTower;
