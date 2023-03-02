
const express = require('express');
const app = express();
const { authRoom, authRoomByQuery } = require('./utils/auth');
const http = require('http');
const addresses = require('../../../constants/ports.json');
const cors = require('cors');
const { setupDatabase } = require('./database/initiators/main-initiator');
const httpProxy = require('http-proxy');
const ports = require('../../../constants/ports.json');
app.use(cors());
app.use(express.urlencoded({
  extended: true
}));
app.use(express.json());

const proxy = httpProxy.createProxyServer({
  changeOrigin: true,
  ws: true,
  secure: false
});

async function main() {
  setupDatabase();
  app.get('/file/download', async (req, res, next) => {
    const { success, user, room, isMember } = await authRoom(req, res);
    if (success) {
      req.headers.userid = user.id;
      req.headers.roomid = room.id;
      req.headers.ismember = (isMember ? 'true' : 'false');
      proxy.web(req, res, { target: 'http://' + 'localhost:' + ports.FILES_STORAGE }, e => { console.log(e); });
    }
  });
  app.get('/file/download-link', async (req, res, next) => {
    const { success, user, room, isMember } = await authRoomByQuery(req, res);
    if (success) {
      req.headers.userid = user.id;
      req.headers.roomid = room.id;
      req.headers.ismember = (isMember ? 'true' : 'false');
      req.headers.documentid = req.query.documentid;
      proxy.web(req, res, { target: 'http://' + 'localhost:' + ports.FILES_STORAGE }, e => { console.log(e); });
    }
  });
  app.get('/file/preview', async (req, res, next) => {
    const { success, user, room, isMember } = await authRoomByQuery(req, res);
    if (success) {
      req.headers.userid = user.id;
      req.headers.roomid = room.id;
      req.headers.ismember = (isMember ? 'true' : 'false');
      req.headers.documentid = req.query.documentid;
      req.headers.token = req.query.token;
      proxy.web(req, res, { target: 'http://' + 'localhost:' + ports.FILES_STORAGE }, e => { console.log(e); });
    }
  });
  app.get('/file/coverAudio', async (req, res, next) => {
    const { success, user, room, isMember } = await authRoomByQuery(req, res);
    if (success) {
      req.headers.userid = user.id;
      req.headers.roomid = room.id;
      req.headers.ismember = (isMember ? 'true' : 'false');
      req.headers.documentid = req.query.documentid;
      req.headers.token = req.query.token;
      proxy.web(req, res, { target: 'http://' + 'localhost:' + ports.FILES_STORAGE }, e => { console.log(e); });
    }
  });
  let server = http.createServer(app);
  server.listen(`localhost:${ports.FILES_OUT_GATEWAY_PORT}`, () => {
    console.log(`listening on *:${ports.FILES_OUT_GATEWAY_PORT}`);
  });
}

main();
