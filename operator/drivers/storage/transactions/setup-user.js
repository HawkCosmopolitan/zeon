
const mongoose = require('mongoose');
let { Pending, User, Session, Tower, Room, Member, Workspace } = require('../schemas/schemas');
let { isEmpty, isNameFieldInvalid } = require('../../../global-utils/strings');
let defaultAvatars = require('../../../constants/avatars.json');
let permissions = require('../../../constants/permissions.json');
let { centralTower, centralTowerHall } = require('../initiators/main-initiator');
const { readUserStorageData } = require('../../network/socket/events/storage');
const { readUserDocumentsData } = require('../../network/socket/events/file');
const { readUserBlogsData } = require('../../network/socket/events/blog');
const {
    v4: uuidv4,
} = require('uuid');
const jwt = require('jsonwebtoken');

const checkImports = () => {
    if (Pending === undefined) {
        Pending = require('../schemas/schemas').Pending;
    }
    if (User === undefined) {
        User = require('../schemas/schemas').User;
    }
    if (Session === undefined) {
        Session = require('../schemas/schemas').Session;
    }
    if (Tower === undefined) {
        Tower = require('../schemas/schemas').Tower;
    }
    if (Room === undefined) {
        Room = require('../schemas/schemas').Room;
    }
    if (Workspace === undefined) {
        Workspace = require('../schemas/schemas').Workspace;
    }
    if (Member === undefined) {
        Member = require('../schemas/schemas').Member;
    }
    if (centralTower === undefined) {
        centralTower = require('../initiators/main-initiator').centralTower;
    }
    if (centralTowerHall === undefined) {
        centralTowerHall = require('../initiators/main-initiator').centralTowerHall;
    }
}

module.exports.dbSetupUser = async ({ auth0AccessToken, firstName, lastName }) => {
    if (isEmpty(firstName)) {
        console.error('first name can not be empty');
        return { success: false };
    }
    if (isNameFieldInvalid(firstName) || isNameFieldInvalid(lastName)) {
        console.error('name can not be longer than limit.');
        return { success: false };
    }
    checkImports();
    const session = await mongoose.startSession();
    session.startTransaction();
    const inputData = JSON.parse(Buffer.from(auth0AccessToken.split('.')[1], 'base64').toString());
    let email = inputData['https://internal.cosmopole.cloud/email'];
    let pending, user, userSession, tower, room, workspace, member, defaultMembership;
    try {
        pending = await Pending.findOne({ email: email }).session(session).exec();
        if (pending === null) {
            userSession = await Session.create([{
                token: uuidv4(),
            }], { session: session });
            userSession = userSession[0];
            user = await User.create([{
                firstName: firstName,
                lastName: lastName,
                secret: {
                    email: email,
                    sessionIds: [userSession._id.toHexString()]
                }
            }], { session: session });
            user = user[0];
            workspace = await Workspace.create([{
                title: 'main workspace',
                roomId: ''
            }], { session });
            workspace = workspace[0];
            room = await Room.create([{
                title: 'hall',
                avatarId: defaultAvatars.HALL_DEFAULT_AVATAR_ID,
                isPublic: false,
                floor: 'hall',
                secret: {
                    adminIds: [
                        user._id.toHexString()
                    ],
                    defaultWorkspaceId: workspace._id.toHexString()
                }
            }], { session });
            room = room[0];
            tower = await Tower.create([{
                title: `${firstName}'s home`,
                avatarId: defaultAvatars.EMPTY_TOWER_AVATAR_ID,
                isPublic: false,
                secret: {
                    adminIds: [
                        user._id.toHexString()
                    ]
                }
            }], { session });
            tower = tower[0];
            member = await Member.create([{
                userId: user._id.toHexString(),
                roomId: room._id.toHexString(),
                towerId: tower._id.toHexString(),
                secret: {
                    permissions: permissions.DEFAULT_ROOM_ADMIN_PERMISSIONS
                }
            }], { session });
            member = member[0];
            await User.updateOne({ _id: user._id }, { id: user._id.toHexString(), secret: { homeId: tower._id.toHexString() } }).session(session);
            user = await User.findOne({ id: user._id.toHexString() }).session(session).exec();
            await Session.updateOne({ _id: userSession._id }, { id: userSession._id.toHexString(), userId: user.id }).session(session);
            userSession = await Session.findOne({ id: userSession._id.toHexString() }).session(session).exec();
            await Tower.updateOne({ _id: tower._id }, { id: tower._id.toHexString() }).session(session);
            tower = await Tower.findOne({ id: tower._id.toHexString() }).session(session).exec();
            await Room.updateOne({ _id: room._id }, { id: room._id.toHexString(), towerId: tower.id }).session(session);
            room = await Room.findOne({ id: room._id.toHexString() }).session(session).exec();
            await Member.updateOne({ _id: member._id }, { id: member._id.toHexString() }).session(session);
            member = await Member.findOne({ id: member._id.toHexString() }).session(session).exec();
            await Workspace.updateOne({ _id: workspace._id }, { id: workspace._id.toHexString(), roomId: room.id }).session(session);
            workspace = await Workspace.findOne({ id: workspace._id.toHexString() }).session(session).exec();

            defaultMembership = await Member.create([{
                userId: user.id,
                roomId: centralTowerHall.id,
                towerId: centralTower.id,
                secret: {
                    permissions: permissions.DEFAULT_ROOM_ADMIN_PERMISSIONS
                }
            }], { session });
            defaultMembership = defaultMembership[0];
            await Member.updateOne({ _id: defaultMembership._id }, { id: defaultMembership._id.toHexString() }).session(session);
            defaultMembership = await Member.findOne({ id: defaultMembership._id.toHexString() }).session(session).exec();
            let workspaces = await Workspace.find({ 'roomId': { $in: [centralTowerHall.id] } }).session(session).exec();
            let storageData = await readUserStorageData(user.id, session);
            let documentsData = await readUserDocumentsData(user.id, session);
            let blogsData = await readUserBlogsData(user.id, session);

            pending = await Pending.create([{
                email: email, userId: user.id
            }], { session });
            await session.commitTransaction();
            session.endSession();
            return {
                success: true,
                session: userSession,
                user,
                tower,
                room,
                member,
                workspace,
                defaultMembership,
                centralTower,
                centralTowerHall,
                filespaces: storageData.filespaces,
                disks: storageData.disks,
                folders: storageData.folders,
                files: storageData.files,
                documents: documentsData.documents,
                blogs: blogsData.blogs,
                posts: blogsData.posts,
                workspaces: workspaces
            };
        } else {
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
}
