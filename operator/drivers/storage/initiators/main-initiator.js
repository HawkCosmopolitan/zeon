
const MemoryDriver = require('../../memory');
const { connectMongoClient } = require('../drivers/main-driver');
const { defineSchemas } = require('../schemas/schemas');

module.exports.setupDatabase = async () => {
    connectMongoClient();
    defineSchemas();
    const { User, Member, Room, Workspace, Tower } = require('../schemas/schemas');
    let rooms = await Room.find({}).exec();
    if (rooms.length > 0) {
        module.exports.centralTower = await Tower.findOne({ id: 'CENTRAL_TOWER' }).exec();
        module.exports.centralTowerHall = await Room.findOne({ towerId: 'CENTRAL_TOWER' }).exec();
    } else {
        let room = await Room.create([{
            title: 'hall',
            avatarId: 'help',
            floor: 'hall',
            secret: {
                adminIds: [
                    '0'
                ],
            }
        }]);
        room = room[0];
        let tower = await Tower.create([{
            title: 'Central Tower',
            avatarId: 'help',
            isPublic: true,
            secret: {
                adminIds: [
                    '0'
                ]
            }
        }]);
        tower = tower[0];
        await Tower.updateOne({ _id: tower._id }, { id: 'CENTRAL_TOWER' });
        tower = await Tower.findOne({ id: 'CENTRAL_TOWER' }).exec();
        await Room.updateOne({ _id: room._id }, { id: room._id.toHexString(), towerId: tower.id });
        room = await Room.findOne({ id: room._id.toHexString() }).exec();

        module.exports.centralTower = tower;
        module.exports.centralTowerHall = room;
    }
}
