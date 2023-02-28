
const { setupDatabase } = require('../storage/initiators/main-initiator');
const UserFactory = require('./factories/user-factory');
const TowerFactory = require('./factories/tower-factory');
const RoomFactory = require('./factories/room-factory');
const SessionFactory = require('./factories/session-factory');
const InteractonFactory = require('./factories/interaction-factory');
const MemberFactory = require('./factories/member-factory');
const PendingFactory = require('./factories/pending-factory');
const InviteFactory = require('./factories/invite-factory');

class StorageDriver {
    static inst;
    static initialize(callback) {
        return new StorageDriver(callback);
    }
    static instance() {
        return StorageDriver.inst;
    }
    userFactory;
    towerFactory;
    roomFactory;
    workspaceFactory;
    inviteFactory;
    memberFactory;
    pendingFactory;
    interactionFactory;
    sessionFactory;
    constructor(callback) {
        StorageDriver.inst = this;
        setupDatabase().then(() => {
            this.userFactory = UserFactory.initialize();
            this.towerFactory = TowerFactory.initialize();
            this.roomFactory = RoomFactory.initialize();
            this.inviteFactory = InviteFactory.initialize();
            this.memberFactory = MemberFactory.initialize();
            this.pendingFactory = PendingFactory.initialize();
            this.interactionFactory = InteractonFactory.initialize();
            this.sessionFactory = SessionFactory.initialize();
            if (callback) callback();
        });
    }
}

module.exports = StorageDriver;
