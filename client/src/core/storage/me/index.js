
export function saveFirstName(firstName) {
    localStorage.setItem('firstName', firstName);
}

export function fetchFirstName() {
    return localStorage.getItem('firstName');
}

export function saveLastName(lastName) {
    localStorage.setItem('lastName', lastName);
}

export function fetchLastName() {
    return localStorage.getItem('lastName');
}

export function saveAvatarId(avatarId) {
    localStorage.setItem('avatarId', avatarId);
}

export function fetchAvatarId() {
    return localStorage.getItem('avatarId');
}

export function saveMyUserId(userId) {
    localStorage.setItem('myUserId', userId);
}

export function fetchMyUserId() {
    return localStorage.getItem('myUserId');
}

export function saveMyHomeId(homeId) {
    localStorage.setItem('myHomeId', homeId);
}

export function fetchMyHomeId() {
    return localStorage.getItem('myHomeId');
}

export function saveAvatarBackColor(avatarBackColor) {
    localStorage.setItem('avatarBackColor', avatarBackColor);
}

export function fetchAvatarBackColor() {
    return localStorage.getItem('avatarBackColor');
}

let me = {
    saveFirstName,
    fetchFirstName,
    saveLastName,
    fetchLastName,
    saveAvatarId,
    fetchAvatarId,
    saveMyUserId,
    fetchMyUserId,
    saveMyHomeId,
    fetchMyHomeId,
    saveAvatarBackColor,
    fetchAvatarBackColor
};

export default me;
