
const PouchDB = require("pouchdb").default;
PouchDB.plugin(require("pouchdb-upsert"));
PouchDB.plugin(require("pouchdb-find").default);
export let db;

export let setupDB = () => {
    db = new PouchDB('IconDB');
};
