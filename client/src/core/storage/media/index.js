
export function saveCurrentPlayingMediaId(docId) {
    localStorage.setItem('currentPlayingMediaId', docId);
}

export function fetchCurrentPlayingMediaId() {
    return localStorage.getItem('currentPlayingMediaId');
}
