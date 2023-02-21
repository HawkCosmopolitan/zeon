
import { socket } from "../../network/socket";

export function joinCall() {
    socket.emit('join-call', {});
}

export function leaveCall() {
    socket.emit('leave-call', {});
}

export function turnVideoOff() {
    socket.emit('turn-off-video', {});
}

export function turnScreenOff() {
    socket.emit('turn-off-screen', {});
}

export function turnAudioOff() {
    socket.emit('turn-off-audio', {});
}
