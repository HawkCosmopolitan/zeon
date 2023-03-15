
module.exports.attachEchoEvents = (socket) => {
    socket.on('echo', async (data) => {
        console.log('echo', data);
        socket.reply(data.replyToInternal, {
            replyTo: data.replyTo,
            status: 1,
            text: data.body.text,
            update: { type: 'echoUpdate', roomId: data.body.roomId, text: data.body.text }
        });
    });
}
