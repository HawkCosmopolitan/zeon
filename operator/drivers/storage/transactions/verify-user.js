
const mongoose = require('mongoose');
let { Pending, User, Session, Member, Tower, Room, Workspace, Interaction } = require('../schemas/schemas');
const {
    v4: uuidv4,
} = require('uuid');
const jwt = require('jsonwebtoken');
const { readUserStorageData } = require('../../network/socket/events/storage');
const { readUserDocumentsData } = require('../../network/socket/events/file');
const { readUserBlogsData } = require('../../network/socket/events/blog');
const { getUser } = require('../../network/socket/pool');

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
    if (Interaction === undefined) {
        Interaction = require('../schemas/schemas').Interaction;
    }
}

module.exports.dbVerifyUser = async ({ auth0AccessToken }) => {
    checkImports();
    const session = await mongoose.startSession();
    session.startTransaction();
    const inputData = JSON.parse(Buffer.from(auth0AccessToken.split('.')[1], 'base64').toString());
    let email = inputData['https://internal.cosmopole.cloud/email'];
    let pending, userSession, user;
    try {
        pending = await Pending.findOne({ email: email }).session(session).exec();
        if (pending !== null) {
            user = await User.findOne({ id: pending.userId }).session(session).exec();
            if (user !== null) {
                userSession = await Session.create([{
                    token: uuidv4(),
                    userId: user.id
                }], { session: session });
                userSession = userSession[0];
                await Session.updateOne({ _id: userSession._id }, { id: userSession._id.toHexString() }).session(session);
                userSession = await Session.findOne({ id: userSession._id.toHexString() }).session(session).exec();
                await User.updateOne({ id: user.id }, { $push: { sessionIds: userSession.id } });
                user = await User.findOne({ id: user._id.toHexString() }).session(session).exec();
                let memberships = await Member.find({ userId: user.id }).session(session).exec();
                let towers = await Tower.find({ 'id': { $in: memberships.map(m => m.towerId) } }).session(session).exec();
                let rooms = await Room.find({ 'id': { $in: memberships.map(m => m.roomId) } }).session(session).exec();
                let allMemberships = await Member.find({ roomId: { $in: rooms.map(r => r.id) } }).session(session).exec();
                let workspaces = await Workspace.find({ 'roomId': { $in: rooms.map(r => r.id) } }).session(session).exec();
                let interactions = await Interaction.find({ $or: [{ user1Id: user.id }, { user2Id: user.id }] }).session(session).exec();
                towers.forEach(tower => {
                    if (tower.secret.isContact) {
                        let user1Id = tower.secret.adminIds[0];
                        let user2Id = tower.secret.adminIds[1];
                        let target = (user1Id === user.id) ? user2Id : user1Id;
                        tower.contactId = target;
                        tower.contact = getUser(target);
                    }
                });
                let storageData = await readUserStorageData(user.id);
                let documentsData = await readUserDocumentsData(user.id);
                let blogsData = await readUserBlogsData(user.id);
                await session.commitTransaction();
                session.endSession();
                return {
                    success: true,
                    session: userSession,
                    user: user,
                    towers: towers,
                    rooms: rooms,
                    workspaces: workspaces,
                    myMemberships: memberships,
                    allMemberships: allMemberships,
                    interactions: interactions,
                    filespaces: storageData.filespaces,
                    disks: storageData.disks,
                    folders: storageData.folders,
                    files: storageData.files,
                    documents: documentsData.documents,
                    blogs: blogsData.blogs,
                    posts: blogsData.posts
                };
            } else {
                await session.commitTransaction();
                session.endSession();
                return { success: true };
            }
        } else {
            await session.commitTransaction();
            session.endSession();
            return { success: true };
        }
    } catch (error) {
        console.error(error);
        console.error('abort transaction');
        await session.abortTransaction();
        session.endSession();
        return { success: false };
    }
}
