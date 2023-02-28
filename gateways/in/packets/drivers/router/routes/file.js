const { authRoom } = require('../../../utils/auth');
const { replySocketReq } = require('../utils');
const addresses = require('../../../../constants/addresses.json');
const errors = require('../../../../constants/errors.json');
let { Member } = require('../../../database/schemas/schemas');

var PROTO_PATH = __dirname + '/../../../../protos/file.proto';

var grpc = require("@grpc/grpc-js");
var protoLoader = require("@grpc/proto-loader");

var packageDefinition = protoLoader.loadSync(PROTO_PATH, {
    keepCase: true,
    longs: String,
    enums: String,
    defaults: true,
    oneofs: true,
});
var file_proto = grpc.loadPackageDefinition(packageDefinition).file;

var client = new file_proto.Files(
    `${addresses.FILE2_SERVICE}:${addresses.FILE2_SERVICE_PORT}`,
    grpc.credentials.createInsecure()
);

module.exports.readUserDocumentsDataByRoomIds = async (roomIds) => {
    return new Promise((resolve, _) => {
        var meta = new grpc.Metadata();
        client.readUserData(
            { roomIds },
            meta,
            function (err, response) {
                if (response.status === 1) {
                    resolve({
                        success: true,
                        documents: response.documents
                    });
                } else {
                    resolve({ success: false });
                }
            }
        );
    });
}

module.exports.readUserDocumentsData = async (userId, session) => {
    return new Promise((resolve, _) => {
        if (Member === undefined) {
            Member = require('../../../database/schemas/schemas').Member;
        }
        if (session) {
            Member.find({ userId: userId }).session(session).exec().then((memberships) => {
                let roomIds = memberships.map(m => m.roomId);
                this.readUserDocumentsDataByRoomIds(roomIds).then(data => resolve(data));
            });
        } else {
            Member.find({ userId: userId }).exec().then((memberships) => {
                let roomIds = memberships.map(m => m.roomId);
                this.readUserDocumentsDataByRoomIds(roomIds).then(data => resolve(data));
            });
        }
    });
}

module.exports.attachFileEvents = (socket) => {
    socket.on('readDocById', async (data) => {
        let { success, session, user, room, isMember } = await authRoom(socket.session.token, data.roomId);
        if (success) {
            var meta = new grpc.Metadata();
            meta.add('userId', user.id);
            meta.add('roomId', room.id);
            meta.add('isMember', isMember);
            client.readDocById(
                data,
                meta,
                function (err, response) {
                    if (response.status === 1) {
                        replySocketReq(socket, data, { status: response.status, document: response.doc });
                    } else {
                        replySocketReq(socket, data, { status: response.status, errorText: response.errorText });
                    }
                }
            );
        } else {
            replySocketReq(socket, data, { status: 2, errorText: errors.ACCESS_DENIED });
        }
    });
};
