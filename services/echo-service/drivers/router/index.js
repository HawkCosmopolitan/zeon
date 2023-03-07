
let echo = require('./routes/echo');

module.exports = {
    attachRouter: (socket) => {
        echo.attachEchoEvents(socket);
    }
}
