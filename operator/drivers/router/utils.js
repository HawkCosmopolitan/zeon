
module.exports = {
    handleUpdate: (update) => {

    },
    replySocketReq: (socket, req, res) => {
        socket.emit('response', { replyTo: req.replyTo, ...res });
    }
}
