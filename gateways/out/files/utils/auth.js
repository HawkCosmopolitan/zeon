
const grpc = require("@grpc/grpc-js");
let { Session, User, Room, Member } = require('../database/schemas/schemas');
const errors = require('../../../../constants/errors.json');

const checkImports = () => {
    if (Session === undefined) {
        Session = require('../database/schemas/schemas').Session;
    }
    if (User === undefined) {
        User = require('../database/schemas/schemas').User;
    }
    if (Room === undefined) {
        Room = require('../database/schemas/schemas').Room;
    }
    if (Member === undefined) {
        Member = require('../database/schemas/schemas').Member;
    }
}

let authRoomInfra = async (token, roomId, req, res) => {
    checkImports();
    let session = await Session.findOne({ token: token }).exec();
    if (session !== null) {
        let user = await User.findOne({ id: session.userId }).exec();
        if (roomId !== undefined) {
            let member = await Member.findOne({ userId: session.userId, roomId: roomId }).exec();
            let room = await Room.findOne({ id: roomId }).exec();
            if (room !== null) {
                return { success: true, session, user, room, isMember: (member !== null), rights: member.secret.permissions };
            } else {
                res.send({ status: 2, errorText: errors.ROOM_NOT_EXIST });
                return { success: false };
            }
        } else {
            res.send({ status: 2, errorText: errors.AUTHENTICATION_FAILED });
        }
    } else {
        res.send({ status: 2, errorText: errors.AUTHENTICATION_FAILED });
        return { success: false };
    }
}

module.exports.authRoom = async (req, res) => {
    return authRoomInfra(req.headers.token, req.headers.roomid, req, res);
}

module.exports.authRoomByQuery = async (req, res) => {
    return authRoomInfra(req.query.token, req.query.roomid, req, res);
}
