
const mongoose = require('mongoose');
let { RoomInvite, Member, Room, Tower, Workspace } = require('../schemas/schemas');
let { isIdEmpty } = require('../../../../shared/utils/numbers');
const permissions = require('../../../../constants/permissions.json');
const updates = require('../../../../constants/updates.json');
const { secureObject, secureAdmins } = require('../../../../shared/utils/filter');
const InviteFactory = require('../factories/invite-factory');
const RoomFactory = require('../factories/room-factory');
const TowerFactory = require('../factories/tower-factory');
const WorkspaceFactory = require('../factories/workspace-factory');
const MemberFactory = require('../factories/member-factory');
const { makeUniqueId } = require('../../../../shared/utils/id-generator');

const checkImports = () => {
  if (RoomInvite === undefined) {
    RoomInvite = require('../schemas/schemas').RoomInvite;
  }
  if (Member === undefined) {
    Member = require('../schemas/schemas').Member;
  }
  if (Room === undefined) {
    Room = require('../schemas/schemas').Room;
  }
  if (Tower === undefined) {
    Tower = require('../schemas/schemas').Tower;
  }
  if (Workspace === undefined) {
    Workspace = require('../schemas/schemas').Workspace;
  }
}

module.exports.dbAcceptInvite = async ({ inviteId }, userId, callback) => {
  if (isIdEmpty(inviteId)) {
    console.error('invite id can not be empty');
    return { success: false };
  }
  checkImports();
  const session = await mongoose.startSession();
  session.startTransaction();
  let member, room, tower, workspace, rooms, workspaces, towerStorages, towerSocial, memberships, documentsData;
  try {
    let success = false;
    let invite = await InviteFactory.instance().find({ id: inviteId, userId: userId });
    if (invite !== null) {
      //towerStorages = await readUserStorageDataByRoomIds(rooms.map(room => room.id));
      //towerSocial = await readUserBlogsDataByRoomIds(rooms.map(room => room.id));
      //documentsData = await readUserDocumentsDataByRoomIds(rooms.map(room => room.id));
      room = await RoomFactory.instance().find({ id: invite.roomId }, session);
      Promise.all([
        (async () => { tower = await TowerFactory.instance().find({ id: room.towerId }, session); }),
        (async () => { workspace = await WorkspaceFactory.instance().find({ roomId: room.id }, session); }),
        (async () => {
          member = await MemberFactory.instance().create({
            id: makeUniqueId(),
            userId: invite.userId,
            roomId: invite.roomId,
            towerId: room.towerId,
            secret: {
              permissions: permissions.DEFAULT_ROOM_ADMIN_PERMISSIONS
            }
          }, session);
        }),
        (async () => { await InviteFactory.instance().remove({ id: invite.id }, session); }),
        (async () => {
          rooms = await RoomFactory.instance().find({ towerId: tower.id }, session);
          workspaces = await WorkspaceFactory.instance().findGroup({ roomId: { $in: rooms.map(room => room.id) } }, session);
        }),
        (async () => { memberships = await MemberFactory.instance().findGroup({ roomId: invite.roomId }, session); })
      ]);
      success = true;
      await session.commitTransaction();
    } else {
      console.error('invite not found');
      console.error('abort transaction');
      await session.abortTransaction();
    }
    session.endSession();
    if (success) {
      //createServiceMessage({ roomId: room.id, workspaceId: workspace.id, text: 'user joined room.' }, ({ message }) => {
      //message.time = Number(message.time);
      callback({
        success: true,
        member: member,
        rooms: rooms.map(r => secureAdmins(r, userId)),
        workspaces,
        tower,
        room,
        workspace,
        memberships,
        documents: [],//documentsData?.documents,
        filespaces: [],//towerStorages?.filespaces,
        disks: [],//towerStorages?.disks,
        folders: [],//towerStorages?.folders,
        files: [],//towerStorages?.files,
        blogs: [],//towerSocial?.blogs,
        posts: [],//towerSocial?.posts,
        update: {
          type: updates.USER_JOINED_ROOM,
          roomId: room.id,
          user: secureObject(getUser(member.userId), 'secret'),
          message: {},//message,
          member: member
        }
      });
      //});
    } else {
      callback({ success: false });
    }
  } catch (error) {
    console.error(error);
    console.error('abort transaction');
    await session.abortTransaction();
    session.endSession();
    callback({ success: false });
  }
};
