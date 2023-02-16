
let Member;

class MemberFactory {
    static inst;
    static initialize() {
        return new MemberFactory();
    }
    static instance() {
        return MemberFactory.inst;
    }
    constructor() {
        let schemas = require('../schemas/schemas');
        Member = schemas.Member;
        this.create = this.create.bind(this);
        this.read = this.read.bind(this);
        this.find = this.find.bind(this);
        this.update = this.update.bind(this);
        this.remove = this.remove.bind(this);
    }
    async create(initData, session) {
        return await Member.create([initData], { session })[0];
    }
    async read(offset, count, session) {

    }
    async find(query, session) {
        return await Member.findOne(query).session(session).exec();
    }
    async update(query, update, session) {
        await Member.updateOne(query, update).session(session);
    }
    async remove(query, session) {

    }
}

module.exports = MemberFactory;
