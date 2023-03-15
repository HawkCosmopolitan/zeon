
export function saveEmail(email) {
    localStorage.setItem('email', email);
}

export function fetchEmail() {
    return localStorage.getItem('email');
}

export function saveSessionToken(token) {
    localStorage.setItem('token', token);
}

export function fetchSessionToken() {
    return localStorage.getItem('token');
}

export function saveCurrentRoomId(roomId) {
    localStorage.setItem('currentRoomId', roomId);
}

export function fetchCurrentRoomId() {
    return localStorage.getItem('currentRoomId');
}

export function saveCurrentTowerId(towerId) {
    localStorage.setItem('currentTowerId', towerId);
}

export function fetchCurrentTowerId() {
    return localStorage.getItem('currentTowerId');
}

let auth = {
    saveEmail,
    fetchEmail,
    saveSessionToken,
    fetchSessionToken,
    saveCurrentRoomId,
    fetchCurrentRoomId,
    saveCurrentTowerId,
    fetchCurrentTowerId
}

export default auth;