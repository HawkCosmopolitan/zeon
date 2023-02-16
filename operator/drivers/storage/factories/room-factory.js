
let Room;

class RoomFactory {
    static inst;
    static initialize() {
        return new RoomFactory();
    }
    static instance() {
        return RoomFactory.inst;
    }
    constructor() {
        let schemas = require('../schemas/schemas');
        Room = schemas.Room;
        this.create = this.create.bind(this);
        this.read = this.read.bind(this);
        this.find = this.find.bind(this);
        this.update = this.update.bind(this);
        this.remove = this.remove.bind(this);
    }
    async create(initData, session) {

    }
    async read(offset, count, session) {

    }
    async find(query, session) {
        return await Room.findOne(query).session(session).exec();
    }
    async update(query, update, session) {

    }
    async remove(query, session) {

    }
}

module.exports = RoomFactory;
