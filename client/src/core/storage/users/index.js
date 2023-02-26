
import { db } from '../setup';

export async function dbSaveUser(user) {
    let result = await db.post({
        type: 'user',
        data: user
    });
    user.id = result.id;
    return { user: user, rev: result.rev };
}

export function dbUpdateUser(id, rev, user) {
    db.put({
        _id: id,
        _rev: rev,
        id: user.id,
        type: 'user',
        data: user
    });
}

export async function dbSaveUserAtOnce(user) {
    await db.post({
        id: user.id,
        type: 'user',
        data: user
    });
    return true;
}

export async function dbFindUserById(userId) {
    let data = await db.find({
        selector: { type: { $eq: "user" }, id: { $eq: userId } },
    });
    if (data.docs.length > 0) {
        return data.docs[0].data;
    } else {
        return null;
    }
}

export async function dbUpdateUserById(userId, user) {
    let data = await db.find({
        selector: { type: { $eq: "user" }, id: { $eq: userId } },
    });
    if (data.docs.length > 0) {
        if (data.docs[0].data.avatarBackColor) {
            user.avatarBackColor = data.docs[0].data.avatarBackColor;
        } else {
            user.avatarBackColor = Number((Math.random() * 10).toString()[0]);
        }
        try {
            await db.put({
                _id: data.docs[0]._id,
                _rev: data.docs[0]._rev,
                id: user.id,
                type: 'user',
                data: user
            });
        } catch (ex) { }
    } else {
        user.avatarBackColor = Number((Math.random() * 10).toString()[0]);
        dbSaveUserAtOnce(user);
    }
}

export async function dbFetchUsers() {
    let data = await db.find({
        selector: { type: { $eq: "user" } },
    });
    return data.docs.map(packet => packet.data);
}

let users = {
    dbSaveUser,
    dbUpdateUser,
    dbSaveUserAtOnce,
    dbFindUserById,
    dbUpdateUserById,
    dbFetchUsers
};

export default users;
