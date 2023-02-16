const { default: mongoose, Schema } = require('mongoose');

module.exports.defineSchemas = () => {
    module.exports.Pending = mongoose.model('Pending', new Schema({
        email: String,
        clientCode: String,
        verificationCode: String,
        state: Number,
        userId: String
    }), 'Pending');
    module.exports.User = mongoose.model('User', new Schema({
        id: String,
        firstName: String,
        lastName: String,
        secret: Schema.Types.Mixed
    }), 'User');
    module.exports.Interaction = mongoose.model('Interaction', new Schema({
        id: String,
        user1Id: String,
        user2Id: String,
        roomId: String,
        towerId: String,
    }), 'Interaction');
    module.exports.Session = mongoose.model('Session', new Schema({
        id: String,
        token: String,
        userId: String
    }), 'Session');
    module.exports.Tower = mongoose.model('Tower', new Schema({
        id: String,
        title: String,
        avatarId: String,
        isPublic: Boolean,
        secret: Schema.Types.Mixed
    }), 'Tower');
    module.exports.Room = mongoose.model('Room', new Schema({
        id: String,
        title: String,
        avatarId: String,
        towerId: String,
        floor: String,
        isPublic: Boolean,
        secret: Schema.Types.Mixed
    }), 'Room');
    module.exports.Member = mongoose.model('Member', new Schema({
        id: String,
        userId: String,
        roomId: String,
        towerId: String,
        secret: Schema.Types.Mixed
    }), 'Member');
    module.exports.Bot = mongoose.model('Bot', new Schema({
        id: String,
        title: String,
        avatarId: String,
        secret: Schema.Types.Mixed
    }), 'Bot');
    module.exports.Worker = mongoose.model('Worker', new Schema({
        id: String,
        botId: String,
        workspaceId: String,
        secret: Schema.Types.Mixed
    }), 'Worker');
    module.exports.RoomInvite = mongoose.model('RoomInvite', new Schema({
        id: String,
        userId: String,
        roomId: String,
        title: String,
        text: String
    }), 'RoomInvite');
    module.exports.Workspace = mongoose.model('Workspace', new Schema({
        id: String,
        roomId: String,
        title: String,
        isPublic: Boolean,
        secret: Schema.Types.Mixed
    }), 'Workspace');
}
