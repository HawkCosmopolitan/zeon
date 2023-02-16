
class MemberFactory {
    static inst;
    static initialize() {
        return new UserFactory();
    }
    static instance() {
        return UserFactory.inst;
    }
    add(tx) {

    }
    read(offset, count, tx) {

    }
    update(tx) {

    }
    remove(tx) {

    }
}

module.exports = UserFactory;
