const { readDocById, readUserData } = require('../endpoints/file');
const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const addresses = require('../../../../constants/addresses.json');

var PROTO_PATH = __dirname + '/../../../../protos/file.proto';

var packageDefinition = protoLoader.loadSync(
    PROTO_PATH,
    {
        keepCase: true,
        longs: String,
        enums: String,
        defaults: true,
        oneofs: true
    });
var file_proto = grpc.loadPackageDefinition(packageDefinition).file;

module.exports.setupGrpcServer = () => {
    var server = new grpc.Server();
    server.addService(file_proto.Files.service, {
        readDocById, readUserData
    });
    server.bindAsync(`0.0.0.0:${addresses.FILE2_SERVICE_PORT}`, grpc.ServerCredentials.createInsecure(), () => {
        server.start();
        console.log(`grpc service started at port ${addresses.FILE2_SERVICE_PORT}`);
    });
}
