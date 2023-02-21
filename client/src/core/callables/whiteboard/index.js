import { socket } from "../../network/socket";

export function addWhiteboardObject(data) {
    socket.emit('whiteboard:added', data);
}

export function modifyWhiteboardObject(data) {
    socket.emit('whiteboard:modified', data);
}

export function removeWhiteboardObject(data) {
    socket.emit('whiteboard:removed', data);
}

export function fetchWhiteboardObjects() {
    socket.emit('whiteboard:fetch', {});
}
