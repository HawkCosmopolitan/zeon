
const express = require('express');
const app = express();
const { authRoom, authRoomByQuery } = require('./utils/auth');
const http = require('http');
const addresses = require('../../../constants/addresses.json');
const cors = require('cors');
const { setupDatabase } = require('./database/initiators/main-initiator');
const httpProxy = require('http-proxy');
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
  app.post('/file/upload', async (req, res, next) => {
    const { success, user, room, isMember, rights } = await authRoom(req, res);
    if (success && rights.uploadFile) {
      req.headers.userid = user.id;
      req.headers.roomid = room.id;
      req.headers.ismember = (isMember ? 'true' : 'false');
      req.headers.size = req.headers.size;
      req.headers.filetype = req.headers.filetype;
      req.headers.extension = req.headers.extension;
      req.headers.ispublic = req.headers.ispublic;
      if (req.headers.documentid) {
        req.headers.documentid = req.headers.documentid;
      }
      if (req.headers.endfileupload) {
        req.headers.endfileupload = req.headers.endfileupload;
      }
      proxy.web(req, res, { target: addresses.FILES_STORAGE_PATH }, e => { console.log(e); });
    }
  });
  app.listen(addresses.FILES_IN_GATEWAY_PORT, () => {
    console.log(`listening on *:${addresses.FILES_IN_GATEWAY_PORT}`);
  })
}

main();
