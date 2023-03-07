
module.exports.attachEchoEvents = (socket) => {
    socket.on('echo', async (data) => {
        console.log('echo', data.text);
        socket.reply(data.replyToInternal, {
            status: 1,
            text: data.text,
            update: { type: 'echoUpdate', roomId: data.roomId, text: data.text }
        });
    });
}
