
const express = require('express');
const app = express();
const files = require('../endpoints/files');
const http = require('http');
const addresses = require('../../../../constants/addresses.json');
const cors = require('cors');
app.use(cors());
app.use(express.urlencoded({
    extended: true
  }));
app.use(express.json());

module.exports.setupNetwork = () => {
    app.use('/file', files);
    let server = http.createServer(app);
    server.listen(addresses.FILE_SERVICE_PORT, () => {
        console.log(`Server is running on ${addresses.FILE_SERVICE_PORT}`);
    });
}
