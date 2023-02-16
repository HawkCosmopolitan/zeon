
const UserFactory = require('./factories/user-factory');
const TowerFactory = require('./factories/tower-factory');
const RoomFactory = require('./factories/room-factory');
const WorkspaceFactory = require('./factories/workspace-factory');

class StorageDriver {
    static inst;
    static initialize() {
        return new StorageDriver();
    }
    static instance() {
        return StorageDriver.inst;
    }
    userFactory;
    towerFactory;
    roomFactory;
    workspaceFactory;
    user(userId) {

    }
    tower(towerId) {

    }
    room(roomId) {

    }
    workspace(workspaceId) {

    }
    constructor() {
        StorageDriver.inst = this;
        this.userFactory = UserFactory.initialize();
        this.towerFactory = TowerFactory.initialize();
        this.roomFactory = RoomFactory.initialize();
        this.workspaceFactory = WorkspaceFactory.initialize();
    }
}

module.exports = StorageDriver;
