const { setupGrpcServer } = require('../grpc/connection');

module.exports.setupGrpcNetwork = () => {
    setupGrpcServer();
}
