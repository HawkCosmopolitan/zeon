import { socket } from "../../network/socket";

export function playWithEmoji(messageId) {
    socket.emit('playWithEmoji', { messageId });
}
