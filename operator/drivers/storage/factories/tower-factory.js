
class TowerFactory {
    static inst;
    static initialize() {
        return new TowerFactory();
    }
    static instance() {
        return TowerFactory.inst;
    }
    constructor() {
        let schemas = require('../schemas/schemas');
        RoomInvite = schemas.RoomInvite;
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
        return await RoomInvite.findOne(query).session(session).exec();
    }
    async update(query, update, session) {

    }
    async remove(query, session) {

    }
}

module.exports = TowerFactory;
